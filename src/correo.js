// Correos del circuito: a la casilla de De Barrio cuando entra un pedido pagado y cuando queda
// listo, y al cliente con el link para ver la muestra y aprobar.
//
// Configuración (variables de entorno):
//   SMTP_URL        smtps://usuario:clave@smtp.servidor.com:465  (cualquier proveedor SMTP)
//   CORREO_DESDE    "De Barrio <pedidos@debarrio.com.ar>"
//   CORREO_CASILLA  casilla donde llegan los pedidos (la del dueño)
// Sin SMTP_URL no se manda nada: los correos se guardan en memoria (para las pruebas) y se
// muestran en la consola.
import nodemailer from "nodemailer";

export const enviados = [];

let transporte = null;
function smtp() {
  if (!process.env.SMTP_URL) return null;
  transporte ??= nodemailer.createTransport(process.env.SMTP_URL);
  return transporte;
}

export const casilla = () => process.env.CORREO_CASILLA || "";

/** Manda un correo. Nunca tira error: si falla, lo registra y sigue (el pedido no se traba por un mail). */
export async function enviar({ para, asunto, texto, adjuntos = [] }) {
  if (!para) return { enviado: false, motivo: "sin destinatario" };
  const correo = { from: process.env.CORREO_DESDE || "De Barrio <pedidos@localhost>", to: para, subject: asunto, text: texto, attachments: adjuntos };
  const t = smtp();
  if (!t) {
    enviados.push(correo);
    if (process.env.NODE_ENV !== "test") console.log(`[correo sin enviar, falta SMTP_URL] Para: ${para} · ${asunto}`);
    return { enviado: false, motivo: "sin SMTP" };
  }
  try {
    await t.sendMail(correo);
    return { enviado: true };
  } catch (e) {
    console.error(`No se pudo mandar el correo «${asunto}» a ${para}:`, e.message);
    return { enviado: false, motivo: e.message };
  }
}
