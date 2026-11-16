import express from "express";
import multer from "multer";
import { timingSafeEqual, createHmac } from "node:crypto";
import { cargarCatalogo, buscarServicio, cotizar, opcionesDesdeRespuestas, textoRespuesta } from "./src/cotizador.js";
import * as almacen from "./src/almacen.js";
import * as pagos from "./src/pagos.js";
import { generarProducto } from "./src/generador.js";
import { armarMuestra } from "./src/muestra.js";
import { cargarTablas, disponibilidad, estadoTabla } from "./src/tablas.js";
import * as correo from "./src/correo.js";
import { confirmacionTexto, numeroPedido } from "./public/confirmacion.js";
import { armarPedido } from "./src/prompts.js";
import { guiasDe } from "./src/guias.js";

const catalogo = cargarCatalogo();
const PUERTO = Number(process.env.PORT || 3000);
const URL_BASE = (process.env.PUBLIC_URL || `http://localhost:${PUERTO}`).replace(/\/$/, "");
const TIPOS_ADJUNTO = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const subir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 8 },
  fileFilter: (_req, f, cb) => cb(null, TIPOS_ADJUNTO.has(f.mimetype)),
});

const igual = (a = "", b = "") => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

function pedidoConClave(req, res) {
  const pedido = almacen.leerPedido(req.params.id);
  if (!pedido || !igual(req.query.clave, pedido.clave)) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return null;
  }
  return pedido;
}

// ---------- Catálogo y cotización ----------

const NOMBRES_TABLAS = {
  comisiones: "comisiones de cobro",
  escala_comercio: "sueldos de Comercio",
  normativa_precios: "norma de exhibición de precios",
};

// Las tablas se releen en cada consulta: al verificarlas, el servicio se habilita sin reiniciar.
const conDisponibilidad = () => {
  const tablas = cargarTablas();
  return {
    ...catalogo,
    servicios: catalogo.servicios.map(({ instrucciones, ...s }) => ({ ...s, ...disponibilidad(s, tablas) })),
    tablas: Object.values(tablas).map((t) => ({
      nombre: NOMBRES_TABLAS[t.id] ?? t.titulo, fecha: t.fecha, verificado: estadoTabla(t).ok,
    })),
  };
};

app.get("/api/catalogo", (_req, res) => res.json(conDisponibilidad()));

app.post("/api/cotizar", (req, res) => {
  try {
    const { servicio, opciones, respuestas, urgente } = req.body ?? {};
    const s = buscarServicio(catalogo, servicio);
    const elegidas = respuestas && s ? opcionesDesdeRespuestas(s, respuestas) : opciones;
    res.json(cotizar(catalogo, servicio, elegidas, { urgente: Boolean(urgente) }));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---------- Pedidos ----------

app.post("/api/pedidos", subir.array("adjuntos", 8), async (req, res) => {
  try {
    const datos = JSON.parse(req.body.datos ?? "{}");
    const servicio = buscarServicio(catalogo, datos.servicio);
    if (!servicio) return res.status(400).json({ error: "Elegí un servicio" });
    const disp = disponibilidad(servicio, cargarTablas());
    if (!disp.disponible) return res.status(409).json({ error: "Este servicio todavía no está disponible." });

    const faltan = [];
    if (!datos.negocio?.nombre) faltan.push("nombre del negocio");
    // El mail es obligatorio: ahí le llegan la confirmación, la muestra y el link de pago.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.contacto?.email ?? "")) faltan.push("tu email");
    for (const c of servicio.campos) if (c.requerido && !textoRespuesta(datos.respuestas?.[c.id])) faltan.push(c.etiqueta);
    const adjuntos = servicio.adjuntos ? (req.files ?? []) : [];
    if (servicio.fotos_obligatorias && !adjuntos.length) {
      return res.status(400).json({ error: "Faltan las fotos: la marquesina, un folleto viejo, el menú o lo que tengas." });
    }
    // Si mandó archivos, los campos del servicio pueden venir en ellos; nombre y email siempre son obligatorios.
    const faltanDatosBasicos = faltan.some((f) => !servicio.campos.some((c) => c.etiqueta === f));
    if (faltan.length && (faltanDatosBasicos || !adjuntos.length)) {
      return res.status(400).json({ error: `Faltan datos: ${faltan.join(", ")}` });
    }

    // La cotización se recalcula en el servidor: nunca se confía en el precio del navegador.
    // Los adicionales salen de lo que tildó el cliente; lo que mande el navegador solo puede sumar.
    const minimas = opcionesDesdeRespuestas(servicio, datos.respuestas ?? {});
    const opciones = Object.fromEntries(Object.entries(minimas).map(([k, v]) => {
      const c = datos.opciones?.[k];
      return [k, typeof v === "boolean" ? v || c === true : Math.max(v, Math.floor(Number(c) || 0))];
    }));
    const cotizacion = cotizar(catalogo, servicio.id, opciones, { urgente: Boolean(datos.urgente) });

    const pedido = almacen.crearPedido({
      servicio: servicio.id,
      nombreServicio: servicio.nombre,
      negocio: { nombre: datos.negocio.nombre, rubro: datos.negocio.rubro ?? "", barrio: datos.negocio.barrio ?? "" },
      contacto: { nombre: datos.contacto.nombre ?? "", email: datos.contacto.email ?? "", telefono: datos.contacto.telefono ?? "" },
      respuestas: datos.respuestas ?? {},
      opciones,
      urgente: Boolean(datos.urgente),
      cotizacion,
      cantidadAdjuntos: adjuntos.length,
    });
    almacen.guardarAdjuntos(pedido.id, adjuntos.map((f) => ({ tipo: f.mimetype, nombre: f.originalname, base64: f.buffer.toString("base64") })));

    // Primero la muestra; el pago se habilita cuando el cliente la ve.
    await recibirPedido(pedido);
    res.json({ id: pedido.id, clave: pedido.clave, cotizacion, urlPedido: linkCliente(pedido) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No pudimos crear el pedido. Probá de nuevo en un rato." });
  }
});

// ---------- Circuito ----------
// recibido -> generando -> muestra (con marca de agua; se habilita el pago) -> pagado (descargas)
// Si algo falla: error. El cliente no paga nada hasta ver la muestra.

app.get("/api/pedidos/:id", (req, res) => {
  const p = pedidoConClave(req, res);
  if (!p) return;
  res.json({
    id: p.id,
    estado: p.estado,
    servicio: p.nombreServicio,
    negocio: p.negocio.nombre,
    email: p.contacto.email,
    cotizacion: p.cotizacion,
    urlPago: p.estado === "muestra" ? p.urlPago : undefined,
    resumen: p.resumen,
    // Antes de pagar se listan para ver la muestra; después, para descargar.
    archivos: p.archivos ?? [],
    descargable: p.estado === "pagado",
    error: p.estado === "error" ? "Hubo un problema armando tu pedido. Ya nos avisaron y lo resolvemos." : undefined,
  });
});

app.get("/api/pedidos/:id/muestra/*", async (req, res) => {
  const p = pedidoConClave(req, res);
  if (!p) return;
  const ruta = almacen.rutaArchivoEntrega(p.id, req.params[0]);
  if (!ruta) return res.status(404).send("Archivo no encontrado");
  // La muestra se sirve en una caja de arena: sin scripts y con origen propio.
  res.set("Content-Security-Policy", "sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline' https:; font-src data: https:");
  res.type("html").send(await armarMuestra(ruta, req.params[0]));
});

app.get("/api/pedidos/:id/archivos/*", (req, res) => {
  const p = pedidoConClave(req, res);
  if (!p) return;
  if (p.estado !== "pagado") return res.status(403).send("Los archivos se descargan después de pagar.");
  const ruta = almacen.rutaArchivoEntrega(p.id, req.params[0]);
  if (!ruta) return res.status(404).send("Archivo no encontrado");
  // Se descarga siempre como adjunto: el HTML generado no se sirve en nuestro dominio.
  res.download(ruta);
});

// Pedido confirmado: confirmación al cliente, prompt a la casilla y, si no hay que revisar, a Claude.
async function recibirPedido(pedido) {
  const revisar = process.env.REVISAR_ANTES === "1";
  await correo.enviar({
    para: pedido.contacto.email,
    asunto: `Recibimos tu pedido N° ${numeroPedido(pedido.id)}`,
    texto: confirmacionTexto({
      numero: numeroPedido(pedido.id), servicio: pedido.nombreServicio, negocio: pedido.negocio.nombre,
      total: pedido.cotizacion.total, email: pedido.contacto.email,
    }) + `\n\nTu pedido, cuando quieras mirarlo: ${linkCliente(pedido)}`,
  });
  await avisarPedidoNuevo(pedido, { revisar });
  if (!revisar) generar(pedido.id);
}

async function procesarPago(pedidoId, pagoId) {
  const p = almacen.leerPedido(pedidoId);
  if (!p || p.estado !== "muestra") return; // idempotente: el webhook llega más de una vez
  almacen.actualizar(pedidoId, { estado: "pagado", pagoId, pagado: new Date().toISOString() });
  await correo.enviar({
    para: p.contacto.email,
    asunto: `Pago recibido: ya podés descargar tu ${p.nombreServicio}`,
    texto: `Hola! Recibimos el pago de ${pesosTexto(p.cotizacion.total)} por el pedido N° ${numeroPedido(p.id)}.
Descargá los archivos desde acá: ${linkCliente(p)}
Empezá por LEEME.md: ahí te explicamos cómo usar cada archivo.

Gracias!
De Barrio`,
  });
  await correo.enviar({ para: correo.casilla(), asunto: `Cobrado: ${titulo(p)}`, texto: `Pago ${pagoId} acreditado. El cliente ya puede descargar.\n\n${linkCliente(p)}` });
}

// ---------- Correos ----------
const pesosTexto = (n) => "$ " + Math.round(n).toLocaleString("es-AR");
const titulo = (p) => `${p.nombreServicio} para ${p.negocio.nombre} (${pesosTexto(p.cotizacion.total)})`;
const linkCliente = (p) => `${URL_BASE}/pedido.html?id=${p.id}&clave=${p.clave}`;
// Firma del link «Mandar a Claude» del correo: sirve solo para ese pedido.
const firmaPedido = (id) => createHmac("sha256", process.env.ADMIN_TOKEN || "sin-admin").update(`generar:${id}`).digest("hex").slice(0, 32);
const linkWhatsApp = (tel, texto) => {
  let n = String(tel ?? "").replace(/\D/g, "").replace(/^0/, "");
  if (!n) return "";
  if (!n.startsWith("54")) n = `549${n}`;
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
};

async function avisarPedidoNuevo(p, { revisar }) {
  const adjuntos = almacen.leerAdjuntos(p.id);
  const servicio = buscarServicio(catalogo, p.servicio);
  const bloques = armarPedido(catalogo, { ...p, adjuntos: [] }, { tablas: cargarTablas(), guias: guiasDe(servicio.id) });
  const prompt = bloques.at(-1).text;
  const respuestas = servicio.campos.map((c) => `- ${c.etiqueta} ${textoRespuesta(p.respuestas?.[c.id]) || "(sin respuesta)"}`).join("\n");
  const accion = revisar
    ? `Para mandarlo a Claude, entrá acá y confirmá:\n${URL_BASE}/api/pedidos/${p.id}/generar?firma=${firmaPedido(p.id)}`
    : "Ya se lo pasamos a Claude. Cuando esté la muestra, le llega al cliente y a vos.";
  await correo.enviar({
    para: correo.casilla(),
    asunto: `Pedido nuevo N° ${numeroPedido(p.id)}: ${titulo(p)}`,
    texto: `${p.negocio.nombre} pagó ${pesosTexto(p.cotizacion.total)} por ${p.nombreServicio}.
Contacto: ${[p.contacto.telefono, p.contacto.email].filter(Boolean).join(" · ")}

${respuestas}

${accion}

El prompt completo va adjunto (prompt.txt), junto con las fotos que mandó.`,
    adjuntos: [
      { filename: "prompt.txt", content: prompt },
      ...adjuntos.map((a) => ({ filename: a.nombre, content: Buffer.from(a.base64, "base64"), contentType: a.tipo })),
    ],
  });
}

async function avisarListo(p) {
  const aviso = `Hola! Ya está la muestra de tu ${p.nombreServicio} para ${p.negocio.nombre}.
Mirala acá: ${linkCliente(p)}
Si te gusta, la pagás ahí mismo con Mercado Pago (${pesosTexto(p.cotizacion.total)}) y se habilitan las descargas.
Si no te gusta, no pagás nada. Y si querés algún cambio, respondé este mail.`;
  await correo.enviar({ para: p.contacto.email, asunto: `Tu muestra está lista: ${p.nombreServicio}`, texto: `${aviso}\n\nDe Barrio` });
  const wa = linkWhatsApp(p.contacto.telefono, aviso);
  await correo.enviar({
    para: correo.casilla(),
    asunto: `Muestra lista: ${titulo(p)}`,
    texto: `Claude terminó el pedido: ${(p.archivos ?? []).join(", ")}.
${p.avisos?.length ? `\nAvisos:\n${p.avisos.map((a) => `- ${a}`).join("\n")}\n` : ""}
Al cliente ya le llegó el mail con la muestra y el link de pago (${p.contacto.email}).
${wa ? `Avisale por WhatsApp con un toque (el mensaje ya va escrito):\n${wa}` : ""}

Link del cliente: ${linkCliente(p)}`,
  });
}

// Link del correo: muestra una página con un botón. Se confirma con POST para que los antivirus del
// correo, que abren los links solos, no lo disparen.
app.get("/api/pedidos/:id/generar", (req, res) => {
  const p = almacen.leerPedido(req.params.id);
  if (!p || !igual(req.query.firma, firmaPedido(req.params.id))) return res.sendStatus(404);
  res.type("html").send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/estilos.css"><main class="ancho pedido"><h1>${titulo(p).replace(/[<>&]/g, "")}</h1>
<p>Estado: ${p.estado}.</p>${p.estado === "recibido" ? `<form method="post"><button class="boton">Mandar a Claude</button></form>` : ""}</main>`);
});
app.post("/api/pedidos/:id/generar", (req, res) => {
  const p = almacen.leerPedido(req.params.id);
  if (!p || !igual(req.query.firma, firmaPedido(req.params.id))) return res.sendStatus(404);
  if (p.estado === "recibido") generar(p.id);
  res.type("html").send(`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/estilos.css"><main class="ancho pedido"><h1>En marcha</h1><p>Cuando esté la muestra, le llega al cliente y a vos.</p></main>`);
});

async function generar(pedidoId) {
  const pedido = almacen.actualizar(pedidoId, { estado: "generando" });
  try {
    const entrega = await generarProducto(
      catalogo,
      { ...pedido, adjuntos: almacen.leerAdjuntos(pedidoId) },
      { tablas: cargarTablas() },
    );
    const archivos = almacen.guardarEntrega(pedidoId, entrega.archivos);
    const urlPago = await pagos.crearLinkDePago(almacen.leerPedido(pedidoId), URL_BASE);
    almacen.actualizar(pedidoId, {
      estado: "muestra", urlPago, listo: new Date().toISOString(), resumen: entrega.resumen, archivos, avisos: entrega.avisos, uso: entrega.uso, modelo: entrega.modelo,
    });
    console.log(`Pedido ${pedidoId} listo: ${archivos.length} archivos`);
    await avisarListo(almacen.leerPedido(pedidoId));
  } catch (e) {
    console.error(`Pedido ${pedidoId} falló:`, e);
    const p = almacen.actualizar(pedidoId, { estado: "error", detalleError: String(e.message ?? e) });
    correo.enviar({ para: correo.casilla(), asunto: `Se trabó: ${titulo(p)}`, texto: `Error: ${p.detalleError}\n\nSe puede reintentar desde la administración.` });
  }
}

app.post("/api/webhooks/mercadopago", async (req, res) => {
  const tipo = req.body?.type ?? req.query.type ?? req.query.topic;
  const dataId = req.body?.data?.id ?? req.query["data.id"] ?? req.query.id;
  if (tipo !== "payment" || !dataId) return res.sendStatus(200);
  if (!pagos.firmaValida(req.headers, req.query["data.id"] ?? dataId)) return res.sendStatus(401);
  try {
    const pago = await pagos.consultarPago(dataId);
    const pedido = pago.pedidoId && almacen.leerPedido(pago.pedidoId);
    if (pedido && pago.estado === "approved" && pago.moneda === "ARS" && pago.monto >= pedido.cotizacion.total) {
      await procesarPago(pedido.id, pago.id);
    }
    res.sendStatus(200);
  } catch (e) {
    console.error("Webhook:", e);
    res.sendStatus(500); // Mercado Pago reintenta
  }
});

app.get("/api/pago-simulado/:id", async (req, res) => {
  if (!pagos.modoSimulado()) return res.sendStatus(404);
  const p = pedidoConClave(req, res);
  if (!p) return;
  await procesarPago(p.id, `simulado-${Date.now()}`);
  res.redirect(`/pedido.html?id=${p.id}&clave=${p.clave}`);
});

// ---------- Administración ----------

const esAdmin = (req) => process.env.ADMIN_TOKEN && igual(req.get("authorization"), `Bearer ${process.env.ADMIN_TOKEN}`);

app.get("/api/admin/pedidos", (req, res) => {
  if (!esAdmin(req)) return res.sendStatus(401);
  res.json(almacen.listarPedidos().map(({ clave, ...p }) => p));
});

app.post("/api/admin/pedidos/:id/reintentar", (req, res) => {
  if (!esAdmin(req)) return res.sendStatus(401);
  const p = almacen.leerPedido(req.params.id);
  if (!p || !["error", "recibido", "generando"].includes(p.estado)) return res.status(409).json({ error: "No se puede reintentar" });
  generar(p.id);
  res.json({ ok: true });
});

// Si el servidor se reinició a mitad de una generación, la retoma.
for (const p of almacen.listarPedidos()) {
  if ((p.estado === "recibido" && process.env.REVISAR_ANTES !== "1") || p.estado === "generando") generar(p.id);
}

app.use((_req, res) => res.status(404).sendFile("404.html", { root: "public" }));

if (process.env.NODE_ENV !== "test") {
  app.listen(PUERTO, () => {
    console.log(`De Barrio en ${URL_BASE}`);
    if (pagos.modoSimulado()) console.log("Pagos en modo SIMULADO (falta MP_ACCESS_TOKEN)");
  });
}

export default app;
