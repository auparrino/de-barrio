// Calcula la cotización de un pedido a partir del catálogo.
// Regla del negocio: ningún pedido supera el tope (200.000 ARS); si la suma
// lo pasa, la diferencia figura como bonificación.
import { readFileSync } from "node:fs";

const CATALOGO_URL = new URL("../data/catalogo.json", import.meta.url);

export function cargarCatalogo() {
  return JSON.parse(readFileSync(CATALOGO_URL, "utf8"));
}

export function buscarServicio(catalogo, id) {
  return catalogo.servicios.find((s) => s.id === id) ?? null;
}

// La cuenta vive en public/cotizar.js para que el navegador (versión de prueba en GitHub Pages)
// y el servidor calculen exactamente igual.
export { cotizar } from "../public/cotizar.js";
