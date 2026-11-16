import express from "express";
import multer from "multer";
import { timingSafeEqual } from "node:crypto";
import { cargarCatalogo, buscarServicio, cotizar, opcionesDesdeRespuestas, textoRespuesta } from "./src/cotizador.js";
import * as almacen from "./src/almacen.js";
import * as pagos from "./src/pagos.js";
import { generarProducto } from "./src/generador.js";
import { armarMuestra } from "./src/muestra.js";
import { cargarTablas, disponibilidad, estadoTabla } from "./src/tablas.js";

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
    if (!datos.contacto?.telefono && !datos.contacto?.email) faltan.push("WhatsApp");
    for (const c of servicio.campos) if (c.requerido && !textoRespuesta(datos.respuestas?.[c.id])) faltan.push(c.etiqueta);
    const adjuntos = servicio.adjuntos ? (req.files ?? []) : [];
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

    const urlPago = await pagos.crearLinkDePago(pedido, URL_BASE);
    almacen.actualizar(pedido.id, { urlPago });
    res.json({ id: pedido.id, clave: pedido.clave, cotizacion, urlPago, simulado: pagos.modoSimulado() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No pudimos crear el pedido. Probá de nuevo en un rato." });
  }
});

// ---------- Muestra, aprobación y devolución ----------
// Después de pagar, el cliente ve una muestra con marca de agua. Recién al aprobarla se habilitan las
// descargas; si no le sirve, se le devuelve el pago mientras no haya aprobado. Pasadas 48 horas sin
// respuesta, el pedido se aprueba solo para que la plata no quede trabada.
const HORAS_PARA_APROBAR = 48;

function aprobarSiVencio(p) {
  const listo = p.estado === "listo" && p.listo;
  if (listo && Date.now() - new Date(p.listo).getTime() > HORAS_PARA_APROBAR * 36e5) {
    return almacen.actualizar(p.id, { estado: "conforme", conforme: new Date().toISOString(), aprobadoSolo: true });
  }
  return p;
}

app.get("/api/pedidos/:id", (req, res) => {
  let p = pedidoConClave(req, res);
  if (!p) return;
  p = aprobarSiVencio(p);
  res.json({
    id: p.id,
    estado: p.estado,
    servicio: p.nombreServicio,
    negocio: p.negocio.nombre,
    cotizacion: p.cotizacion,
    urlPago: p.estado === "cotizado" ? p.urlPago : undefined,
    resumen: p.resumen,
    // Antes de aprobar se listan para ver la muestra; después, para descargar.
    archivos: p.estado === "devuelto" ? [] : (p.archivos ?? []),
    descargable: p.estado === "conforme",
    aprobarAntesDe: p.estado === "listo" && p.listo ? new Date(new Date(p.listo).getTime() + HORAS_PARA_APROBAR * 36e5).toISOString() : undefined,
    error: p.estado === "error" ? "Hubo un problema armando tu pedido. Ya nos avisaron y lo resolvemos." : undefined,
  });
});

app.get("/api/pedidos/:id/muestra/*", async (req, res) => {
  const p = pedidoConClave(req, res);
  if (!p) return;
  if (p.estado === "devuelto") return res.status(410).send("Este pedido fue devuelto.");
  const ruta = almacen.rutaArchivoEntrega(p.id, req.params[0]);
  if (!ruta) return res.status(404).send("Archivo no encontrado");
  // La muestra se sirve en una caja de arena: sin scripts y con origen propio.
  res.set("Content-Security-Policy", "sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline' https:; font-src data: https:");
  res.type("html").send(await armarMuestra(ruta, req.params[0]));
});

app.get("/api/pedidos/:id/archivos/*", (req, res) => {
  let p = pedidoConClave(req, res);
  if (!p) return;
  p = aprobarSiVencio(p);
  if (p.estado === "devuelto") return res.status(410).send("Este pedido fue devuelto.");
  if (p.estado !== "conforme") return res.status(403).send("Aprobá la muestra para descargar los archivos.");
  const ruta = almacen.rutaArchivoEntrega(p.id, req.params[0]);
  if (!ruta) return res.status(404).send("Archivo no encontrado");
  // Se descarga siempre como adjunto: el HTML generado no se sirve en nuestro dominio.
  res.download(ruta);
});

app.post("/api/pedidos/:id/conformidad", async (req, res) => {
  let p = pedidoConClave(req, res);
  if (!p) return;
  p = aprobarSiVencio(p);
  if (!["listo", "error"].includes(p.estado)) return res.status(409).json({ error: "Este pedido ya no se puede cambiar." });
  if (req.body?.conforme === true) {
    almacen.actualizar(p.id, { estado: "conforme", conforme: new Date().toISOString() });
    return res.json({ estado: "conforme" });
  }
  try {
    const devolucion = await pagos.devolverPago(p.pagoId);
    almacen.actualizar(p.id, { estado: "devuelto", devolucion, motivoDevolucion: String(req.body?.motivo ?? "").slice(0, 500) });
    res.json({ estado: "devuelto" });
  } catch (e) {
    console.error("Devolución:", e);
    res.status(502).json({ error: "No pudimos hacer la devolución. Escribinos y lo resolvemos." });
  }
});

// ---------- Pago y generación ----------

async function procesarPago(pedidoId, pagoId) {
  const pedido = almacen.leerPedido(pedidoId);
  if (!pedido || pedido.estado !== "cotizado") return; // idempotente: el webhook llega más de una vez
  almacen.actualizar(pedidoId, { estado: "pagado", pagoId, pagado: new Date().toISOString() });
  generar(pedidoId);
}

async function generar(pedidoId) {
  const pedido = almacen.actualizar(pedidoId, { estado: "generando" });
  try {
    const entrega = await generarProducto(
      catalogo,
      { ...pedido, adjuntos: almacen.leerAdjuntos(pedidoId) },
      { tablas: cargarTablas() },
    );
    const archivos = almacen.guardarEntrega(pedidoId, entrega.archivos);
    almacen.actualizar(pedidoId, {
      estado: "listo", listo: new Date().toISOString(), resumen: entrega.resumen, archivos, avisos: entrega.avisos, uso: entrega.uso, modelo: entrega.modelo,
    });
    console.log(`Pedido ${pedidoId} listo: ${archivos.length} archivos`);
  } catch (e) {
    console.error(`Pedido ${pedidoId} falló:`, e);
    almacen.actualizar(pedidoId, { estado: "error", detalleError: String(e.message ?? e) });
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
  if (!p || !["error", "pagado", "generando"].includes(p.estado)) return res.status(409).json({ error: "No se puede reintentar" });
  generar(p.id);
  res.json({ ok: true });
});

// Si el servidor se reinició a mitad de una generación, la retoma.
for (const p of almacen.listarPedidos()) {
  if (p.estado === "pagado" || p.estado === "generando") generar(p.id);
}

app.use((_req, res) => res.status(404).sendFile("404.html", { root: "public" }));

if (process.env.NODE_ENV !== "test") {
  app.listen(PUERTO, () => {
    console.log(`De Barrio en ${URL_BASE}`);
    if (pagos.modoSimulado()) console.log("Pagos en modo SIMULADO (falta MP_ACCESS_TOKEN)");
  });
}

export default app;
