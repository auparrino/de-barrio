// Arma la versión de prueba estática para GitHub Pages en dist/.
//   BASE=/de-barrio/ node tools/pages.js
// BASE es la ruta donde queda publicado el sitio (el nombre del repositorio en project pages).
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cargarCatalogo } from "../src/cotizador.js";
import { cargarTablas, disponibilidad, estadoTabla } from "../src/tablas.js";
import { cargarGuias } from "../src/guias.js";

const BASE = (process.env.BASE || "/").replace(/\/?$/, "/");
const DIST = "dist";
const NOMBRES = { comisiones: "comisiones de cobro", escala_comercio: "sueldos de Comercio", normativa_precios: "norma de exhibición de precios" };

rmSync(DIST, { recursive: true, force: true });
cpSync("public", DIST, { recursive: true });

// El mismo catálogo que entrega GET /api/catalogo, sin las instrucciones internas.
const catalogo = cargarCatalogo();
const tablas = cargarTablas();
mkdirSync(join(DIST, "api"), { recursive: true });
// En la versión de prueba no hay servidor: el pedido viaja por WhatsApp al dueño con el prompt
// armado en el navegador, así que el catálogo incluye las instrucciones de cada servicio, las tablas
// vigentes que usa y los nombres de las guías del proyecto de Claude.
const guias = cargarGuias();
writeFileSync(join(DIST, "api", "catalogo.json"), JSON.stringify({
  ...catalogo,
  servicios: catalogo.servicios.map((s) => ({
    ...s,
    ...disponibilidad(s, tablas),
    tablas_vigentes: (s.tablas ?? []).map((id) => tablas[id]).filter(Boolean),
    guias: guias.filter((g) => g.servicios.includes(s.id)).map((g) => g.id),
  })),
  tablas: Object.values(tablas).map((t) => ({ nombre: NOMBRES[t.id] ?? t.titulo, fecha: t.fecha, verificado: estadoTabla(t).ok })),
  whatsapp: process.env.WHATSAPP_DUENO || "",
}));

// Rutas absolutas a la base de Pages y marca de modo de prueba.
for (const archivo of readdirSync(DIST).filter((f) => /\.(html|css)$/.test(f))) {
  const ruta = join(DIST, archivo);
  let texto = readFileSync(ruta, "utf8")
    .replaceAll('href="/', `href="${BASE}`)
    .replaceAll('src="/', `src="${BASE}`)
    .replaceAll('content="/', `content="${BASE}`)
    .replaceAll('url("/', `url("${BASE}`);
  if (archivo.endsWith(".html")) texto = texto.replace('<html lang="es-AR">', '<html lang="es-AR" data-estatico>');
  writeFileSync(ruta, texto);
}
writeFileSync(join(DIST, ".nojekyll"), "");
console.log(`dist/ lista para ${BASE}`);
