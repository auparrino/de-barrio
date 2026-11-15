// Genera el producto con Claude una vez que el pedido está pagado.
import Anthropic from "@anthropic-ai/sdk";
import { SISTEMA, ESQUEMA_ENTREGA, armarPedido } from "./prompts.js";

const MODELO = process.env.CLAUDE_MODEL || "claude-opus-5-5";

let cliente = null;
function obtenerCliente() {
  cliente ??= new Anthropic(); // toma ANTHROPIC_API_KEY del entorno
  return cliente;
}

/** Devuelve { resumen, archivos: [{ruta, contenido}], uso } o lanza un error. */
export async function generarProducto(catalogo, pedido) {
  if (process.env.GENERADOR === "demo") return entregaDemo(pedido);

  const stream = obtenerCliente().beta.messages.stream({
    model: MODELO,
    max_tokens: 64000,
    // Si un clasificador de seguridad rechaza el pedido, la API lo reintenta en otro modelo.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SISTEMA,
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: ESQUEMA_ENTREGA },
    },
    messages: [{ role: "user", content: armarPedido(catalogo, pedido) }],
  });

  const mensaje = await stream.finalMessage();

  if (mensaje.stop_reason === "refusal") {
    throw new Error(`Claude rechazó el pedido: ${mensaje.stop_details?.explanation ?? "sin detalle"}`);
  }
  if (mensaje.stop_reason === "max_tokens") {
    throw new Error("La respuesta quedó cortada (max_tokens). Conviene dividir el pedido.");
  }

  const texto = mensaje.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const entrega = JSON.parse(texto);
  return { ...entrega, uso: mensaje.usage, modelo: mensaje.model };
}

// Para probar el circuito completo sin gastar en la API.
function entregaDemo(pedido) {
  return {
    resumen: `Entrega de prueba para ${pedido.negocio.nombre} (modo demo, sin llamar a Claude).`,
    archivos: [
      { ruta: "LEEME.md", contenido: `# ${pedido.nombreServicio}\n\nEsto es una entrega de prueba.\n` },
      { ruta: "ejemplo/hola.html", contenido: `<!doctype html><h1>${pedido.negocio.nombre}</h1>` },
    ],
    uso: null,
    modelo: "demo",
  };
}
