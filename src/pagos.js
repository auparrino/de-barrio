// Cobro con Mercado Pago (Checkout Pro). Sin MP_ACCESS_TOKEN funciona en modo
// simulado: el botón de pago lleva a una página que marca el pedido como pagado.
import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.mercadopago.com";

export const modoSimulado = () => !process.env.MP_ACCESS_TOKEN;

async function mp(ruta, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(opciones.headers ?? {}),
    },
  });
  if (!r.ok) throw new Error(`Mercado Pago ${r.status}: ${await r.text()}`);
  return r.json();
}

/** Crea la preferencia de pago y devuelve la URL a la que mandar al cliente. */
export async function crearLinkDePago(pedido, urlBase) {
  const urlPedido = `${urlBase}/pedido.html?id=${pedido.id}&clave=${pedido.clave}`;
  if (modoSimulado()) {
    return `${urlBase}/api/pago-simulado/${pedido.id}?clave=${pedido.clave}`;
  }
  const pref = await mp("/checkout/preferences", {
    method: "POST",
    headers: { "X-Idempotency-Key": `pref-${pedido.id}` },
    body: JSON.stringify({
      items: [{
        id: pedido.servicio,
        title: `Vecino Digital - ${pedido.nombreServicio}`,
        quantity: 1,
        currency_id: "ARS",
        unit_price: pedido.cotizacion.total,
      }],
      payer: { email: pedido.contacto.email, name: pedido.contacto.nombre },
      external_reference: pedido.id,
      notification_url: `${urlBase}/api/webhooks/mercadopago`,
      back_urls: { success: urlPedido, pending: urlPedido, failure: urlPedido },
      auto_return: "approved",
    }),
  });
  return pref.init_point;
}

/**
 * Valida la firma x-signature del webhook (si hay MP_WEBHOOK_SECRET).
 * Manifiesto según la doc de Mercado Pago: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 */
export function firmaValida(headers, dataId) {
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (!secreto) return true;
  const firma = headers["x-signature"] ?? "";
  const partes = Object.fromEntries(firma.split(",").map((p) => p.trim().split("=")));
  if (!partes.ts || !partes.v1) return false;
  const manifiesto = `id:${String(dataId).toLowerCase()};request-id:${headers["x-request-id"] ?? ""};ts:${partes.ts};`;
  const esperado = createHmac("sha256", secreto).update(manifiesto).digest("hex");
  const a = Buffer.from(esperado);
  const b = Buffer.from(partes.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Consulta el pago real en Mercado Pago (nunca confiar solo en el webhook). */
export async function consultarPago(pagoId) {
  const p = await mp(`/v1/payments/${encodeURIComponent(pagoId)}`);
  return {
    id: String(p.id),
    estado: p.status, // approved, pending, rejected...
    pedidoId: p.external_reference,
    monto: p.transaction_amount,
    moneda: p.currency_id,
  };
}
