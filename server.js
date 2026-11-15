import express from "express";
import multer from "multer";
import { timingSafeEqual } from "node:crypto";
import { cargarCatalogo, buscarServicio, cotizar } from "./src/cotizador.js";
import * as almacen from "./src/almacen.js";
import * as pagos from "./src/pagos.js";
import { generarProducto } from "./src/generador.js";
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
    const { servicio, opciones, urgente } = req.body ?? {};
    res.json(cotizar(catalogo, servicio, opciones, { urgente: Boolean(urgente) }));
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
    if (!datos.contacto?.email) faltan.push("email");
    for (const c of servicio.campos) if (c.requerido && !String(datos.respuestas?.[c.id] ?? "").trim()) faltan.push(c.etiqueta);
    const adjuntos = servicio.adjuntos ? (req.files ?? []) : [];
    // Si mandó archivos, los campos del servicio pueden venir en ellos; nombre y email siempre son obligatorios.
    const faltanDatosBasicos = faltan.some((f) => !servicio.campos.some((c) => c.etiqueta === f));
    if (faltan.length && (faltanDatosBasicos || !adjuntos.length)) {
      return res.status(400).json({ error: `Faltan datos: ${faltan.join(", ")}` });
    }

    // La cotización se recalcula en el servidor: nunca se confía en el precio del navegador.
    const cotizacion = cotizar(catalogo, servicio.id, datos.opciones, { urgente: Boolean(datos.urgente) });

    const pedido = almacen.crearPedido({
      servicio: servicio.id,
      nombreServicio: servicio.nombre,
      negocio: { nombre: datos.negocio.nombre, rubro: datos.negocio.rubro ?? "", barrio: datos.negocio.barrio ?? "" },
      contacto: { nombre: datos.contacto.nombre ?? "", email: datos.contacto.email, telefono: datos.contacto.telefono ?? "" },
      respuestas: datos.respuestas ?? {},
      opciones: datos.opciones ?? {},
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

app.get("/api/pedidos/:id", (req, res) => {
  const p = pedidoConClave(req, res);
  if (!p) return;
  res.json({
    id: p.id,
    estado: p.estado,
    servicio: p.nombreServicio,
    negocio: p.negocio.nombre,
    cotizacion: p.cotizacion,
    urlPago: p.estado === "cotizado" ? p.urlPago : undefined,
    resumen: p.resumen,
    archivos: p.archivos ?? [],
    error: p.estado === "error" ? "Hubo un problema generando tu pedido. Ya nos avisaron y lo resolvemos." : undefined,
  });
});

app.get("/api/pedidos/:id/archivos/*", (req, res) => {
  const p = pedidoConClave(req, res);
  if (!p) return;
  const ruta = almacen.rutaArchivoEntrega(p.id, req.params[0]);
  if (!ruta) return res.status(404).send("Archivo no encontrado");
  // Se descarga siempre como adjunto: el HTML generado no se sirve en nuestro dominio.
  res.download(ruta);
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
      estado: "listo", resumen: entrega.resumen, archivos, avisos: entrega.avisos, uso: entrega.uso, modelo: entrega.modelo,
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
    console.log(`Vecino Digital en ${URL_BASE}`);
    if (pagos.modoSimulado()) console.log("Pagos en modo SIMULADO (falta MP_ACCESS_TOKEN)");
  });
}

export default app;
