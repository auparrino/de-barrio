// Guías de producción (data/guias/*.md): la investigación de cada familia de
// servicios, con su plantilla, prohibidos e instrucciones para el modelo.
// Cada guía declara en su frontmatter a qué servicios se aplica.
import { readFileSync, readdirSync, existsSync } from "node:fs";

const DIR = new URL("../data/guias/", import.meta.url);

export function cargarGuias() {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((archivo) => {
      const texto = readFileSync(new URL(archivo, DIR), "utf8");
      const cabecera = texto.match(/^---\n([\s\S]*?)\n---\n/);
      const servicios = cabecera?.[1].match(/servicios:\s*\[([^\]]*)\]/)?.[1]
        .split(",").map((s) => s.trim()).filter(Boolean) ?? [];
      // La sección «Fuentes» queda en el archivo para los humanos; al modelo no le suma.
      const cuerpo = texto.slice(cabecera?.[0].length ?? 0).split(/\n## Fuentes\b/)[0].trim();
      return { id: archivo.slice(0, -3), servicios, cuerpo };
    });
}

export function guiasDe(servicioId, guias = cargarGuias()) {
  return guias.filter((g) => g.servicios.includes(servicioId));
}
