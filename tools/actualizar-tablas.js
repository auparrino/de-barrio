// Actualiza las tablas de data/tablas/ contra sus fuentes oficiales, con Claude
// y búsqueda web restringida a dominios oficiales.
//
//   node tools/actualizar-tablas.js            # todas las tablas
//   node tools/actualizar-tablas.js comisiones # una sola
//   SIMULAR=1 node tools/actualizar-tablas.js  # no escribe, solo informa
//
// Regla de seguridad: un cambio se aplica solo si Claude lo confirmó en una
// fuente oficial y pasa los controles de abajo (misma estructura, cambios
// dentro de un rango razonable, fuentes de dominios permitidos). Si no, la
// tabla queda como estaba: cuando se vence, su servicio se apaga solo
// («Muy pronto») hasta que una persona la revise. Nunca se vende con datos
// dudosos.
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, readdirSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DIR = new URL("../data/tablas/", import.meta.url);
const INFORME = new URL("../data/tablas/INFORME.md", import.meta.url);
const MODELO = process.env.CLAUDE_MODEL || "claude-opus-5-5";

// Qué se puede consultar y cuánto puede cambiar cada tabla de una vez.
export const REGLAS = {
  comisiones: {
    dominios: ["mercadopago.com.ar", "getnet.com.ar", "bancoprovincia.com.ar", "bcra.gob.ar", "modo.com.ar", "payway.com.ar", "naranjax.com", "uala.com.ar"],
    // puntos porcentuales: una comisión que salta más de 2 puntos se revisa a mano
    cambio_maximo: { tipo: "absoluto", valor: 2 },
    tarea: "Confirmá las comisiones, plazos y abonos vigentes de cada fila en la página oficial del proveedor.",
  },
  escala_comercio: {
    dominios: ["faecys.org.ar", "cac.com.ar", "boletinoficial.gob.ar", "argentina.gob.ar", "afip.gob.ar", "arca.gob.ar", "infoleg.gob.ar", "servicios.infoleg.gob.ar", "trabajo.gob.ar"],
    // un salario no sube más de 30% ni baja más de 5% entre dos revisiones
    cambio_maximo: { tipo: "relativo", sube: 0.3, baja: 0.05 },
    tarea: "Confirmá la escala salarial de Empleados de Comercio (CCT 130/75) del mes en curso, las sumas no remunerativas y los porcentajes de contribuciones del empleador.",
  },
  normativa_precios: {
    dominios: ["boletinoficial.gob.ar", "argentina.gob.ar", "infoleg.gob.ar", "servicios.infoleg.gob.ar", "buenosaires.gob.ar"],
    // en una norma no se aplica ningún cambio automático: si cambió, lo revisa una persona
    cambio_maximo: { tipo: "ninguno" },
    tarea: "Buscá si la norma de exhibición de precios fue modificada o reemplazada después de la fecha de la tabla y confirmá que cada regla sigue vigente.",
  },
};

const DIA = 24 * 60 * 60 * 1000;
const hoy = () => new Date().toISOString().slice(0, 10);

// ---------- Controles (exportados para las pruebas) ----------

const esquemaDe = (v) =>
  Array.isArray(v) ? [esquemaDe(v[0])] : v && typeof v === "object"
    ? Object.fromEntries(Object.keys(v).filter((k) => !["fuente", "nota"].includes(k)).sort().map((k) => [k, esquemaDe(v[k])]))
    : v === null ? "null" : typeof v;

function numeros(v, ruta = "", salida = new Map()) {
  if (typeof v === "number") salida.set(ruta, v);
  else if (Array.isArray(v)) v.forEach((x, i) => numeros(x, `${ruta}[${i}]`, salida));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) numeros(x, ruta ? `${ruta}.${k}` : k, salida);
  return salida;
}

const DATOS = (t) => {
  const { fecha, verificado, nota_verificacion, fuentes, fuentes_detalle, vigencia_dias, ...resto } = t;
  return resto;
};

export function dominioPermitido(url, dominios) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return dominios.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/** Devuelve la lista de problemas; vacía si el cambio se puede aplicar solo. */
export function controlar(anterior, nueva, regla, fuentesUsadas) {
  const problemas = [];
  if (nueva.id !== anterior.id) problemas.push("cambió el id de la tabla");

  // La forma de los datos tiene que ser la misma (los valores null pueden pasar a número).
  const forma = (t) => JSON.stringify(esquemaDe(DATOS(t))).replaceAll('"null"', '"number"');
  if (forma(nueva) !== forma(anterior)) problemas.push("cambió la estructura de la tabla");

  for (const url of fuentesUsadas) {
    if (!dominioPermitido(url, regla.dominios)) problemas.push(`fuente no oficial: ${url}`);
  }
  if (!fuentesUsadas.length) problemas.push("no hay fuentes oficiales citadas");

  const antes = numeros(DATOS(anterior));
  const despues = numeros(DATOS(nueva));
  const textoAntes = JSON.stringify(DATOS(anterior));
  const textoDespues = JSON.stringify(DATOS(nueva));

  if (regla.cambio_maximo.tipo === "ninguno" && textoAntes !== textoDespues) {
    problemas.push("la norma cambió: requiere revisión de una persona");
  }
  for (const [ruta, a] of antes) {
    const b = despues.get(ruta);
    if (b === undefined) continue;
    const m = regla.cambio_maximo;
    if (m.tipo === "absoluto" && Math.abs(b - a) > m.valor) problemas.push(`${ruta}: ${a} → ${b} supera ${m.valor} puntos`);
    if (m.tipo === "relativo" && a > 0) {
      const r = (b - a) / a;
      if (r > m.sube || r < -m.baja) problemas.push(`${ruta}: ${a} → ${b} (${(r * 100).toFixed(1)}%) fuera de rango`);
    }
  }
  return problemas;
}

// ---------- Consulta a Claude ----------

let cliente;
const claude = () => (cliente ??= new Anthropic());

/** Paso 1: Claude investiga con búsqueda y lectura web limitadas a dominios oficiales. */
async function investigar(tabla, regla) {
  const herramientas = [
    { type: "web_search_20260209", name: "web_search", max_uses: 8, allowed_domains: regla.dominios },
    { type: "web_fetch_20260209", name: "web_fetch", max_uses: 12, allowed_domains: regla.dominios },
  ];
  const messages = [{
    role: "user",
    content: `Hoy es ${hoy()}. Esta es una tabla de datos de una consultora para comercios de barrio en Argentina:

<tabla>
${JSON.stringify(tabla, null, 2)}
</tabla>

${regla.tarea}
Usá solo fuentes oficiales (las herramientas ya están limitadas a esos dominios). Para cada valor decí si
está confirmado, cuál es el valor vigente y la URL exacta donde lo leíste. Si un valor no se puede
confirmar, decilo: no lo estimes ni lo completes de memoria.`,
  }];

  const urls = new Set();
  const anotarUrls = (contenido) => {
    for (const b of contenido) {
      if (b.type === "web_fetch_tool_result" && b.content?.url) urls.add(b.content.url);
      if (b.type === "web_search_tool_result" && Array.isArray(b.content)) for (const r of b.content) if (r.url) urls.add(r.url);
      for (const c of b.citations ?? []) if (c.url) urls.add(c.url);
    }
  };

  for (let vuelta = 0; vuelta < 6; vuelta++) {
    const mensaje = await claude().beta.messages.stream({
      model: MODELO,
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high" },
      tools: herramientas,
      messages,
    }).finalMessage();

    anotarUrls(mensaje.content);
    if (mensaje.stop_reason === "pause_turn") {
      // El servidor retoma solo si se reenvía el turno tal cual.
      messages.push({ role: "assistant", content: mensaje.content });
      continue;
    }
    if (mensaje.stop_reason === "refusal") throw new Error("Claude rechazó la consulta");
    const texto = mensaje.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    return { texto, urlsLeidas: [...urls] };
  }
  throw new Error("La investigación no terminó después de 6 vueltas");
}

const ESQUEMA_RESULTADO = {
  type: "object",
  properties: {
    tabla_json: { type: "string", description: "La tabla completa actualizada, como JSON, con la misma estructura." },
    todo_confirmado: { type: "boolean", description: "true solo si cada valor quedó confirmado en una fuente oficial." },
    fuentes: { type: "array", items: { type: "string" }, description: "URLs oficiales donde se confirmaron los valores." },
    cambios: {
      type: "array",
      items: {
        type: "object",
        properties: { campo: { type: "string" }, antes: { type: "string" }, despues: { type: "string" }, fuente: { type: "string" } },
        required: ["campo", "antes", "despues", "fuente"],
        additionalProperties: false,
      },
    },
    sin_confirmar: { type: "array", items: { type: "string" } },
  },
  required: ["tabla_json", "todo_confirmado", "fuentes", "cambios", "sin_confirmar"],
  additionalProperties: false,
};

/** Paso 2: pasa lo investigado a la tabla nueva, con salida estructurada. */
async function consolidar(tabla, investigacion) {
  const mensaje = await claude().messages.create({
    model: MODELO,
    max_tokens: 16000,
    output_config: { effort: "medium", format: { type: "json_schema", schema: ESQUEMA_RESULTADO } },
    messages: [{
      role: "user",
      content: `<tabla_actual>\n${JSON.stringify(tabla, null, 2)}\n</tabla_actual>

<investigacion>\n${investigacion.texto}\n</investigacion>

Devolvé la tabla actualizada con exactamente la misma estructura. Cambiá solo los valores que la
investigación confirma con una URL oficial; los demás dejalos como están y listalos en sin_confirmar.
Si un valor o un texto sigue vigente sin cambios, copialo idéntico, sin reescribirlo.
En cada fila podés agregar "fuente" con la URL. No cambies fecha, verificado ni nota_verificacion.`,
    }],
  });
  if (mensaje.stop_reason !== "end_turn") throw new Error(`Consolidación incompleta: ${mensaje.stop_reason}`);
  const r = JSON.parse(mensaje.content.find((b) => b.type === "text").text);
  return { ...r, tabla: JSON.parse(r.tabla_json) };
}

// ---------- Orquestación ----------

async function actualizar(id) {
  const archivo = new URL(`${id}.json`, DIR);
  const anterior = JSON.parse(readFileSync(archivo, "utf8"));
  const regla = REGLAS[id];
  if (!regla) return { id, aplicado: false, motivo: "no hay reglas de actualización para esta tabla" };

  const investigacion = await investigar(anterior, regla);
  const r = await consolidar(anterior, investigacion);
  const fuentes = [...new Set(r.fuentes)];
  const problemas = controlar(anterior, r.tabla, regla, fuentes);
  if (!r.todo_confirmado) problemas.push(`sin confirmar: ${r.sin_confirmar.join("; ") || "(sin detalle)"}`);
  // Las URLs citadas tienen que haber sido leídas de verdad en esta corrida.
  const leidas = investigacion.urlsLeidas.map((u) => u.replace(/\/$/, ""));
  for (const f of fuentes) if (leidas.length && !leidas.includes(f.replace(/\/$/, ""))) problemas.push(`no se leyó ${f} en esta corrida`);

  if (problemas.length) return { id, aplicado: false, problemas, cambios: r.cambios };

  const nueva = {
    ...r.tabla,
    fecha: hoy(),
    verificado: true,
    fuentes,
    nota_verificacion: `Actualizada automáticamente el ${hoy()} contra fuentes oficiales (${r.cambios.length} cambio/s).`,
  };
  if (!process.env.SIMULAR) writeFileSync(archivo, JSON.stringify(nueva, null, 2) + "\n");
  return { id, aplicado: true, cambios: r.cambios };
}

function informar(resultados) {
  const lineas = [`\n## ${hoy()}\n`];
  for (const r of resultados) {
    lineas.push(`### ${r.id}: ${r.aplicado ? "actualizada" : "SIN CAMBIOS — revisar"}`);
    if (r.error) lineas.push(`- Error: ${r.error}`);
    for (const c of r.cambios ?? []) lineas.push(`- ${c.campo}: ${c.antes} → ${c.despues} (${c.fuente})`);
    for (const p of r.problemas ?? []) lineas.push(`- ⚠️ ${p}`);
    if (r.motivo) lineas.push(`- ${r.motivo}`);
  }
  const texto = lineas.join("\n") + "\n";
  if (!process.env.SIMULAR) appendFileSync(INFORME, texto);
  console.log(texto);
}

async function main() {
  const pedidas = process.argv.slice(2);
  const ids = pedidas.length ? pedidas : readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
  const resultados = [];
  for (const id of ids) {
    const tabla = JSON.parse(readFileSync(new URL(`${id}.json`, DIR), "utf8"));
    const dias = Math.floor((Date.now() - new Date(tabla.fecha)) / DIA);
    // Se revisa cuando pasó la mitad de la vigencia, así hay margen para corregir a mano antes de que se apague.
    if (!pedidas.length && tabla.verificado && dias < tabla.vigencia_dias / 2) {
      resultados.push({ id, aplicado: false, motivo: `al día (${dias} de ${tabla.vigencia_dias} días)` });
      continue;
    }
    try {
      resultados.push(await actualizar(id));
    } catch (e) {
      resultados.push({ id, aplicado: false, error: e.message });
    }
  }
  informar(resultados);
  // Sale con error si alguna tabla necesita revisión, para que la corrida programada avise.
  if (resultados.some((r) => r.error || r.problemas?.length)) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
