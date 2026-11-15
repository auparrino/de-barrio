// Genera el producto con Claude una vez que el pedido está pagado.
// 1) si el servicio necesita cuentas, Claude extrae los datos y el código calcula;
// 2) Claude genera los entregables con las tablas vigentes y los cálculos;
// 3) el código arma las planillas .xlsx y los QR reales.
import Anthropic from "@anthropic-ai/sdk";
import QRCode from "qrcode";
import { buscarServicio } from "./cotizador.js";
import { SISTEMA, ESQUEMA_ENTREGA, armarPedido, armarExtraccion } from "./prompts.js";
import { EXTRACCIONES } from "./calculos.js";
import { armarXlsx, revisarPlanilla } from "./planillas.js";

const MODELO = process.env.CLAUDE_MODEL || "claude-opus-5-5";

let cliente = null;
function obtenerCliente() {
  cliente ??= new Anthropic(); // toma ANTHROPIC_API_KEY del entorno
  return cliente;
}

async function pedirJson({ content, esquema, effort = "high", system = SISTEMA, max_tokens = 64000 }) {
  const stream = obtenerCliente().beta.messages.stream({
    model: MODELO,
    max_tokens,
    // Si un clasificador de seguridad rechaza el pedido, la API lo reintenta en otro modelo.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    output_config: { effort, format: { type: "json_schema", schema: esquema } },
    messages: [{ role: "user", content }],
  });
  const mensaje = await stream.finalMessage();
  if (mensaje.stop_reason === "refusal") {
    throw new Error(`Claude rechazó el pedido: ${mensaje.stop_details?.explanation ?? "sin detalle"}`);
  }
  if (mensaje.stop_reason === "max_tokens") {
    throw new Error("La respuesta quedó cortada (max_tokens). Conviene dividir el pedido.");
  }
  const texto = mensaje.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return { datos: JSON.parse(texto), uso: mensaje.usage, modelo: mensaje.model };
}

/** Reemplaza cada {{QR:contenido}} por un QR real en SVG. */
export async function insertarQrs(texto) {
  const marcas = [...texto.matchAll(/\{\{QR:([^}]+)\}\}/g)];
  let salida = texto;
  for (const [marca, contenido] of marcas) {
    const svg = await QRCode.toString(contenido.trim(), { type: "svg", margin: 1 });
    salida = salida.replace(marca, svg.replace("<svg ", '<svg style="width:100%;height:100%" '));
  }
  return salida;
}

/** Convierte la respuesta de Claude en archivos listos para guardar. */
export async function armarArchivos(entrega) {
  const archivos = [];
  const avisos = [];
  for (const a of entrega.archivos) {
    archivos.push({ ruta: a.ruta, contenido: await insertarQrs(a.contenido) });
  }
  for (const p of entrega.planillas ?? []) {
    avisos.push(...revisarPlanilla(p));
    const nombre = p.archivo.endsWith(".xlsx") ? p.archivo : `${p.archivo}.xlsx`;
    archivos.push({ ruta: nombre, contenido: await armarXlsx(p) });
  }
  if (avisos.length) {
    const leeme = archivos.find((a) => a.ruta === "LEEME.md");
    const nota = `\n\n## Revisión automática de las planillas\n\n${avisos.map((a) => `- ${a}`).join("\n")}\n`;
    if (leeme) leeme.contenido += nota;
    else archivos.push({ ruta: "LEEME.md", contenido: nota.trimStart() });
  }
  return { archivos, avisos };
}

/** Devuelve { resumen, archivos: [{ruta, contenido}], avisos, uso, modelo } o lanza un error. */
export async function generarProducto(catalogo, pedido, { tablas = {} } = {}) {
  const servicio = buscarServicio(catalogo, pedido.servicio);

  let calculos = null;
  const extraccion = servicio.calculo && EXTRACCIONES[servicio.calculo];
  if (extraccion && process.env.GENERADOR !== "demo") {
    const r = await pedirJson({
      content: armarExtraccion(servicio, pedido, extraccion.instruccion),
      esquema: extraccion.esquema,
      effort: "medium",
      system: "Extraés datos de comercios de barrio con exactitud. No inventes ni calcules nada.",
      max_tokens: 16000,
    });
    calculos = extraccion.calcular(r.datos);
  }

  const r = process.env.GENERADOR === "demo"
    ? { datos: entregaDemo(pedido), uso: null, modelo: "demo" }
    : await pedirJson({ content: armarPedido(catalogo, pedido, { tablas, calculos }), esquema: ESQUEMA_ENTREGA });

  const { archivos, avisos } = await armarArchivos(r.datos);
  return { resumen: r.datos.resumen, archivos, avisos, uso: r.uso, modelo: r.modelo };
}

// Para probar el circuito completo sin gastar en la API.
function entregaDemo(pedido) {
  return {
    resumen: `Entrega de prueba para ${pedido.negocio.nombre} (modo demo, sin llamar a Claude).`,
    archivos: [
      { ruta: "LEEME.md", contenido: `# ${pedido.nombreServicio}\n\nEsto es una entrega de prueba.\n` },
      { ruta: "cartel.html", contenido: `<!doctype html><h1>${pedido.negocio.nombre}</h1><div style="width:120px">{{QR:https://example.com}}</div>` },
    ],
    planillas: [{
      archivo: "ejemplo.xlsx",
      hojas: [
        { nombre: "Productos", filas: [["Producto", "Costo", "Precio", "Margen %"], ["Yerba 1 kg", "3000", "4500", "=(C2-B2)/C2"]] },
        { nombre: "Resumen", filas: [["Concepto", "Valor"], ["Margen promedio", "=AVERAGE(Productos!D2:D2)"]] },
      ],
    }],
  };
}
