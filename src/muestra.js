// Muestras con marca de agua: el cliente ve lo que se armó antes de aprobar y descargar.
// Las planillas se muestran incompletas (primeras filas, valores en vez de fórmulas) y los textos
// largos, solo el comienzo, para que la muestra no reemplace al producto.
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import ExcelJS from "exceljs";

const FILAS_MUESTRA = 6;
const RENGLONES_TEXTO = 12;

const escapar = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Marca de agua en diagonal, repetida, por encima de todo (no se puede seleccionar ni tocar).
const MARCA = `<style>
html::after { content: ""; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;
  background-image: url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220"><text x="20" y="140" transform="rotate(-24 180 110)" font-family="sans-serif" font-size="34" font-weight="700" fill="rgba(200,38,28,0.32)">MUESTRA · De Barrio</text></svg>')}"); }
html { -webkit-user-select: none; user-select: none; }
</style>`;

function pagina(titulo, cuerpo) {
  return `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Muestra: ${escapar(titulo)}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:24px;color:#16130F;background:#F4F2EC}
table{border-collapse:collapse;margin:8px 0 24px;background:#fff}td,th{border:1px solid #23408E55;padding:4px 8px}
th{background:#23408E;color:#fff}h2{color:#23408E}.corte{color:#B01E18;font-weight:700}</style>${MARCA}</head>
<body>${cuerpo}</body></html>`;
}

async function muestraPlanilla(ruta, nombre) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(ruta);
  const partes = [];
  libro.eachSheet((hoja) => {
    const filas = [];
    hoja.eachRow({ includeEmpty: false }, (fila, n) => {
      if (n > FILAS_MUESTRA + 1) return;
      const celdas = (fila.values ?? []).slice(1).map((v) => (v && typeof v === "object" && "formula" in v ? "= fórmula" : v));
      filas.push(celdas);
    });
    const [cabecera = [], ...resto] = filas;
    partes.push(`<h2>${escapar(hoja.name)}</h2><table><tr>${cabecera.map((c) => `<th>${escapar(c)}</th>`).join("")}</tr>${
      resto.map((f) => `<tr>${f.map((c) => `<td>${escapar(c)}</td>`).join("")}</tr>`).join("")}</table>
      ${hoja.rowCount > FILAS_MUESTRA + 1 ? `<p class="corte">… y ${hoja.rowCount - FILAS_MUESTRA - 1} filas más en la planilla completa.</p>` : ""}`);
  });
  return pagina(nombre, `<h1>${escapar(nombre)}</h1>${partes.join("")}`);
}

function muestraTexto(ruta, nombre) {
  const renglones = readFileSync(ruta, "utf8").split("\n");
  const visibles = renglones.slice(0, RENGLONES_TEXTO).join("\n");
  const faltan = renglones.length - RENGLONES_TEXTO;
  return pagina(nombre, `<h1>${escapar(nombre)}</h1><pre style="white-space:pre-wrap">${escapar(visibles)}</pre>${
    faltan > 0 ? `<p class="corte">… y ${faltan} renglones más en el archivo completo.</p>` : ""}`);
}

function muestraDiseno(ruta) {
  const texto = readFileSync(ruta, "utf8");
  // Para HTML se inyecta la marca en el <head>; un SVG se envuelve en una página.
  if (/<head[^>]*>/i.test(texto)) return texto.replace(/<head[^>]*>/i, (m) => `${m}${MARCA}`);
  return pagina("Muestra", texto);
}

/** Devuelve el HTML de la muestra de un archivo de la entrega. */
export async function armarMuestra(ruta, nombre) {
  const ext = extname(ruta).toLowerCase();
  if (ext === ".xlsx") return muestraPlanilla(ruta, nombre);
  if (ext === ".html" || ext === ".htm" || ext === ".svg") return muestraDiseno(ruta);
  return muestraTexto(ruta, nombre);
}
