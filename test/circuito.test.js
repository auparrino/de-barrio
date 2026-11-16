// Recorre el circuito completo en modo demo: cotizar, pedir, pagar (simulado), descargar.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.NODE_ENV = "test";
process.env.GENERADOR = "demo";
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "vecino-"));
delete process.env.MP_ACCESS_TOKEN;
delete process.env.SMTP_URL;
process.env.CORREO_CASILLA = "pedidos@debarrio.test";
process.env.ADMIN_TOKEN = "admin-de-prueba";

// Copia de las tablas con la de comisiones sin verificar, para probar que su servicio se apaga.
const tablasDir = mkdtempSync(join(tmpdir(), "tablas-"));
for (const f of readdirSync("data/tablas").filter((f) => f.endsWith(".json"))) {
  const t = JSON.parse(readFileSync(join("data/tablas", f), "utf8"));
  if (t.id === "comisiones") t.verificado = false;
  writeFileSync(join(tablasDir, f), JSON.stringify(t));
}
process.env.TABLAS_DIR = tablasDir;

const { default: app } = await import("../server.js");
const { enviados } = await import("../src/correo.js");
const servidor = app.listen(0);
const base = `http://localhost:${servidor.address().port}`;
// Una foto de la marquesina (PNG de 1x1): los servicios gráficos no arrancan sin fotos.
const FOTO = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const conFoto = (form) => (form.append("adjuntos", new Blob([FOTO], { type: "image/png" }), "marquesina.png"), form);
test.after(() => servidor.close());

test("pedido pagado genera archivos descargables", async () => {
  const datos = {
    servicio: "promos",
    negocio: { nombre: "Almacén Don Tito", rubro: "almacén" },
    contacto: { email: "tito@example.com" },
    respuestas: { producto: "Fideos 500 g", precio: "1200", promo: "2x1", cuando: "Esta semana", piezas: "10" },
  };
  const form = new FormData();
  conFoto(form);
  form.append("datos", JSON.stringify(datos));
  const r = await fetch(`${base}/api/pedidos`, { method: "POST", body: form });
  const pedido = await r.json();
  assert.equal(r.status, 200, JSON.stringify(pedido));
  assert.equal(pedido.cotizacion.total, 70000);

  const pago = await fetch(pedido.urlPago.replace(/^http:\/\/localhost:\d+/, base), { redirect: "manual" });
  assert.equal(pago.status, 302);

  let estado;
  for (let i = 0; i < 20; i++) {
    estado = await (await fetch(`${base}/api/pedidos/${pedido.id}?clave=${pedido.clave}`)).json();
    if (estado.estado === "listo") break;
    await new Promise((res) => setTimeout(res, 50));
  }
  assert.equal(estado.estado, "listo");
  assert.deepEqual(estado.archivos.sort(), ["LEEME.md", "cartel.html", "ejemplo.xlsx"]);

  const antes = await fetch(`${base}/api/pedidos/${pedido.id}/archivos/LEEME.md?clave=${pedido.clave}`);
  assert.equal(antes.status, 403, "no se descarga antes de aprobar la muestra");
  const muestra = await fetch(`${base}/api/pedidos/${pedido.id}/muestra/ejemplo.xlsx?clave=${pedido.clave}`);
  assert.match(muestra.headers.get("content-security-policy"), /sandbox/);
  assert.match(await muestra.text(), /MUESTRA/);
  await fetch(`${base}/api/pedidos/${pedido.id}/conformidad?clave=${pedido.clave}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conforme: true }),
  });
  const archivo = await fetch(`${base}/api/pedidos/${pedido.id}/archivos/LEEME.md?clave=${pedido.clave}`);
  assert.match(await archivo.text(), /entrega de prueba/);
  assert.match(archivo.headers.get("content-disposition"), /attachment/);

  // Correos: pedido nuevo a la casilla (con el prompt), listo al cliente y a la casilla, aprobado.
  const asuntos = enviados.map((c) => `${c.to} · ${c.subject}`);
  assert.ok(asuntos.some((a) => a.startsWith("pedidos@debarrio.test · Pedido nuevo: ")), asuntos.join("\n"));
  const nuevo = enviados.find((c) => c.subject.startsWith("Pedido nuevo"));
  assert.match(nuevo.attachments.find((a) => a.filename === "prompt.txt").content, /respuestas_del_cliente/);
  const alCliente = enviados.find((c) => c.to === "tito@example.com");
  assert.match(alCliente.text, new RegExp(`pedido.html\\?id=${pedido.id}&clave=${pedido.clave}`));
  assert.doesNotMatch(alCliente.text, /claude|prompt/i, "el cliente no ve cómo se arma");
  assert.ok(asuntos.some((a) => a.includes("Aprobado: ")));

  const sinClave = await fetch(`${base}/api/pedidos/${pedido.id}?clave=mal`);
  assert.equal(sinClave.status, 404);
});

test("falta un dato obligatorio", async () => {
  const form = new FormData();
  form.append("datos", JSON.stringify({ servicio: "promos", negocio: { nombre: "X" }, contacto: { email: "a@b.c" } }));
  const r = await fetch(`${base}/api/pedidos`, { method: "POST", body: form });
  assert.equal(r.status, 400);
});

test("un servicio con tablas sin verificar no se puede contratar", async () => {
  const catalogo = await (await fetch(`${base}/api/catalogo`)).json();
  const cobros = catalogo.servicios.find((s) => s.id === "cobros");
  assert.equal(cobros.disponible, false);
  assert.equal(cobros.instrucciones, undefined, "las instrucciones internas no se publican");
  const form = new FormData();
  conFoto(form);
  form.append("datos", JSON.stringify({ servicio: "cobros", negocio: { nombre: "X" }, contacto: { email: "a@b.c" }, respuestas: { medios: ["Efectivo"], posnet: "Getnet", acreditacion: "En el momento", monto: "2 a 5 millones", tarjeta: "La mitad", provincia: "CABA" } }));
  const r = await fetch(`${base}/api/pedidos`, { method: "POST", body: form });
  assert.equal(r.status, 409);
});

test("las páginas que no existen devuelven la 404 propia", async () => {
  const r = await fetch(`${base}/no-existe`);
  assert.equal(r.status, 404);
  assert.match(await r.text(), /salió a buscar cambio/);
});

test("cotizar: lo que tildó el cliente fija los adicionales y el precio lo calcula el servidor", async () => {
  const r = await fetch(`${base}/api/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ servicio: "stock", respuestas: { productos: "Más de 150", etiquetas: true } }),
  });
  const res = await r.json();
  assert.equal(r.status, 200);
  assert.equal(res.total, 150000 + 30000 + 15000);
});

test("si la muestra no le sirve, se devuelve el pago y no se puede descargar", async () => {
  const form = new FormData();
  conFoto(form);
  form.append("datos", JSON.stringify({
    servicio: "promos", negocio: { nombre: "Almacén Tito" }, contacto: { telefono: "11 5555 5555" },
    respuestas: { producto: "Yerba 1 kg", precio: "4500", promo: "2x1", piezas: "6" },
  }));
  const pedido = await (await fetch(`${base}/api/pedidos`, { method: "POST", body: form })).json();
  await fetch(pedido.urlPago.replace(/^http:\/\/localhost:\d+/, base), { redirect: "manual" });
  let estado;
  for (let i = 0; i < 20; i++) {
    estado = await (await fetch(`${base}/api/pedidos/${pedido.id}?clave=${pedido.clave}`)).json();
    if (estado.estado === "listo") break;
    await new Promise((r) => setTimeout(r, 50));
  }
  const r = await fetch(`${base}/api/pedidos/${pedido.id}/conformidad?clave=${pedido.clave}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conforme: false }),
  });
  assert.equal((await r.json()).estado, "devuelto");
  const despues = await (await fetch(`${base}/api/pedidos/${pedido.id}?clave=${pedido.clave}`)).json();
  assert.deepEqual(despues.archivos, []);
  const archivo = await fetch(`${base}/api/pedidos/${pedido.id}/archivos/LEEME.md?clave=${pedido.clave}`);
  assert.equal(archivo.status, 410);
});

test("con REVISAR_ANTES, Claude arranca recién cuando se confirma desde el correo", async () => {
  process.env.REVISAR_ANTES = "1";
  try {
    const form = new FormData();
    conFoto(form);
    form.append("datos", JSON.stringify({
      servicio: "promos", negocio: { nombre: "Ferretería López" }, contacto: { telefono: "11 5555 5555" },
      respuestas: { producto: "Tornillos", precio: "500", promo: "2x1", piezas: "10" },
    }));
    const pedido = await (await fetch(`${base}/api/pedidos`, { method: "POST", body: form })).json();
    await fetch(pedido.urlPago.replace(/^http:\/\/localhost:\d+/, base), { redirect: "manual" });
    const correo = enviados.findLast((c) => c.subject.startsWith("Pedido nuevo") && c.subject.includes("López"));
    const link = correo.text.match(/http\S+\/generar\?firma=\w+/)[0].replace(/^http:\/\/localhost:\d+/, base);
    const estado = async () => (await (await fetch(`${base}/api/pedidos/${pedido.id}?clave=${pedido.clave}`)).json()).estado;
    assert.equal(await estado(), "pagado");
    await fetch(link); // abrir el link (o que lo abra un antivirus) no dispara nada
    assert.equal(await estado(), "pagado");
    assert.equal((await fetch(link.replace(/firma=\w+/, "firma=mal"), { method: "POST" })).status, 404);
    await fetch(link, { method: "POST" });
    for (let i = 0; i < 20 && (await estado()) !== "listo"; i++) await new Promise((r) => setTimeout(r, 50));
    assert.equal(await estado(), "listo");
    const listo = enviados.findLast((c) => c.subject.startsWith("Listo:") && c.subject.includes("López"));
    assert.match(listo.text, /wa\.me\/5491155555555\?text=/);
  } finally {
    delete process.env.REVISAR_ANTES;
  }
});

test("un flyer sin fotos no se puede pedir", async () => {
  const form = new FormData();
  form.append("datos", JSON.stringify({ servicio: "flyer", negocio: { nombre: "Ferretería López" }, contacto: { telefono: "1155555555" },
    respuestas: { motivo: "Una oferta", mensaje: "2x1 en tornillos", versiones: "Una" } }));
  const r = await fetch(`${base}/api/pedidos`, { method: "POST", body: form });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /fotos/);
  const conFotos = await fetch(`${base}/api/pedidos`, { method: "POST", body: conFoto(form) });
  assert.equal(conFotos.status, 200);
});
