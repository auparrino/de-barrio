// Tablas de datos que cambian (comisiones, escala salarial, normativa).
// Un servicio que usa una tabla solo se puede contratar si la tabla está
// verificada por una persona y no pasó su vigencia: así el modelo nunca
// trabaja con números viejos o inventados.
import { readFileSync, readdirSync } from "node:fs";

const DIR = new URL("../data/tablas/", import.meta.url);
const DIA = 24 * 60 * 60 * 1000;

export function cargarTablas() {
  const tablas = {};
  for (const archivo of readdirSync(DIR)) {
    if (!archivo.endsWith(".json")) continue;
    const t = JSON.parse(readFileSync(new URL(archivo, DIR), "utf8"));
    tablas[t.id] = t;
  }
  return tablas;
}

/** @returns {{ok: boolean, motivo?: string}} */
export function estadoTabla(tabla, hoy = new Date()) {
  if (!tabla) return { ok: false, motivo: "falta la tabla" };
  if (!tabla.verificado) return { ok: false, motivo: `la tabla «${tabla.titulo}» no está verificada` };
  const dias = Math.floor((hoy - new Date(tabla.fecha)) / DIA);
  if (dias > tabla.vigencia_dias) {
    return { ok: false, motivo: `la tabla «${tabla.titulo}» tiene ${dias} días (vigencia ${tabla.vigencia_dias})` };
  }
  return { ok: true };
}

export function disponibilidad(servicio, tablas, hoy = new Date()) {
  const problemas = (servicio.tablas ?? [])
    .map((id) => estadoTabla(tablas[id], hoy))
    .filter((e) => !e.ok)
    .map((e) => e.motivo);
  return problemas.length ? { disponible: false, motivos: problemas } : { disponible: true };
}
