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

/**
 * @param {object} catalogo
 * @param {string} servicioId
 * @param {Record<string, number|boolean>} opciones  id de opción -> cantidad o true
 * @param {{urgente?: boolean}} extras
 */
export function cotizar(catalogo, servicioId, opciones = {}, extras = {}) {
  const servicio = buscarServicio(catalogo, servicioId);
  if (!servicio) throw new Error(`Servicio desconocido: ${servicioId}`);

  const lineas = [{ concepto: servicio.nombre, importe: servicio.precio_base }];

  for (const op of servicio.opciones) {
    const valor = opciones[op.id];
    if (op.tipo === "si_no" && (valor === true || valor === "true" || valor === "on")) {
      lineas.push({ concepto: op.nombre, importe: op.precio });
    } else if (op.tipo === "cantidad") {
      const n = Math.max(0, Math.min(op.max ?? 1, Math.floor(Number(valor) || 0)));
      if (n > 0) lineas.push({ concepto: `${op.nombre} × ${n}`, importe: op.precio_unitario * n });
    }
  }

  let subtotal = lineas.reduce((s, l) => s + l.importe, 0);

  if (extras.urgente && catalogo.recargos?.urgente) {
    const r = catalogo.recargos.urgente;
    const importe = Math.round((subtotal * r.porcentaje) / 100);
    lineas.push({ concepto: `${r.nombre} (+${r.porcentaje}%)`, importe });
    subtotal += importe;
  }

  let bonificacion = 0;
  if (subtotal > catalogo.tope) {
    bonificacion = subtotal - catalogo.tope;
    lineas.push({ concepto: "Bonificación: nunca pagás más del tope", importe: -bonificacion });
  }

  return {
    servicio: servicio.id,
    moneda: catalogo.moneda,
    lineas,
    total: subtotal - bonificacion,
    bonificacion,
  };
}
