// Confirmación del pedido: la misma para la pantalla y para el mail al cliente.
// Dice qué pidió, cuánto sale, qué sigue y que no paga hasta ver la muestra. Nada de cómo se arma.

const pesos = (n) => "$ " + Math.round(n).toLocaleString("es-AR");

/** Número corto y legible a partir del id del pedido. */
export const numeroPedido = (id) => String(id).slice(0, 8).toUpperCase();

/**
 * @param {object} p
 * @param {string} p.numero
 * @param {string} p.servicio   nombre del servicio
 * @param {string} p.negocio
 * @param {number} p.total
 * @param {string} p.email
 */
export function confirmacion({ numero, servicio, negocio, total, email }) {
  return {
    titulo: "Recibimos tu pedido",
    detalle: [
      ["Pedido", `N° ${numero}`],
      ["Servicio", servicio],
      ["Negocio", negocio],
      ["Total", `${pesos(total)}, se paga después de ver la muestra`],
    ],
    pasos: [
      "Lo armamos con lo que nos contaste y las fotos que mandaste.",
      `Cuando esté, te llega un mail a ${email} con una muestra para que la veas.`,
      "Si te gusta, la pagás con Mercado Pago y descargás los archivos.",
      "Si no te gusta, no pagás nada. Si querés algún cambio, respondé el mail.",
    ],
  };
}

/** La confirmación en texto, para el mail. */
export function confirmacionTexto(datos) {
  const c = confirmacion(datos);
  return `Hola! ${c.titulo}.

${c.detalle.map(([k, v]) => `${k}: ${v}`).join("\n")}

Qué sigue:
${c.pasos.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Si tenés alguna duda, respondé este mail.

De Barrio`;
}

/** La confirmación en HTML, para la pantalla. */
export function confirmacionHtml(datos) {
  const e = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const c = confirmacion(datos);
  return `<h2 class="confirmado-titulo">${e(c.titulo)}</h2>
<dl class="confirmado-detalle">${c.detalle.map(([k, v]) => `<dt>${e(k)}</dt><dd>${e(v)}</dd>`).join("")}</dl>
<h3>Qué sigue</h3>
<ol class="confirmado-pasos">${c.pasos.map((p) => `<li>${e(p)}</li>`).join("")}</ol>
<p class="aclaracion">Te mandamos esto mismo por mail.</p>`;
}
