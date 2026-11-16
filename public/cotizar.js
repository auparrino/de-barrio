// Calcula la cotización de un pedido a partir del catálogo. Lo usan el servidor y el navegador.
// Regla del negocio: ningún pedido supera el tope (200.000 ARS); si la suma
// lo pasa, la diferencia figura como bonificación.
const buscarServicio = (catalogo, id) => catalogo.servicios.find((s) => s.id === id) ?? null;

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

/**
 * Los adicionales salen de lo que el cliente tildó: cada pregunta con "ajusta" fija un adicional.
 * - elegir: "valores" da la cantidad (o true) para la respuesta elegida; si no figura, 0 / false.
 * - varios con "cuenta": la cantidad de casilleros tildados.
 * - si_no: true si lo tildó.
 */
export function opcionesDesdeRespuestas(servicio, respuestas = {}) {
  const opciones = {};
  for (const o of servicio.opciones) opciones[o.id] = o.tipo === "cantidad" ? 0 : false;
  for (const c of servicio.campos) {
    const aj = c.ajusta;
    if (!aj || !(aj.opcion in opciones)) continue;
    const r = respuestas[c.id];
    if (c.tipo === "si_no") opciones[aj.opcion] = r === true || r === "true" || r === "on";
    else if (c.tipo === "varios" && aj.cuenta) opciones[aj.opcion] = Array.isArray(r) ? r.length : 0;
    else if (aj.valores && r in aj.valores) opciones[aj.opcion] = aj.valores[r];
  }
  for (const o of servicio.opciones) {
    if (o.tipo === "cantidad") opciones[o.id] = Math.max(0, Math.min(o.max ?? 1, Number(opciones[o.id]) || 0));
  }
  return opciones;
}

/** Texto legible de una respuesta (listas, sí/no). */
export function textoRespuesta(valor) {
  if (Array.isArray(valor)) return valor.join(", ");
  if (valor === true) return "Sí";
  if (valor === false) return "No";
  return String(valor ?? "").trim();
}
