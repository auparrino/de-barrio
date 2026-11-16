// Recorre el circuito completo en modo demo: pedir, ver la muestra, pagar (simulado), descargar.
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

const esperar = async (pedido, estado) => {
  let p;
  for (let i = 0; i < 40; i++) {
    p = await (await fetch(`${base}/api/pedidos/${pedido.id}?clave=${pedido.clave}`)).json();
    if (p.estado === estado) break;
    await new Promise((res) => setTimeout(res, 50));
  }
  return p;
};

test("primero la muestra, después el pago y recién ahí las descargas", async () => {
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
  assert.equal(pedido.urlPago, undefined, "no se cobra antes de la muestra");

  const estado = await esperar(pedido, "muestra");
  assert.equal(estado.estado, "muestra");
  assert.deepEqual(estado.archivos.sort(), ["LEEME.md", "cartel.html", "ejemplo.xlsx"]);
  assert.ok(estado.urlPago, "con la muestra se habilita el pago");

  const antes = await fetch(`${base}/api/pedidos/${pedido.id}/archivos/LEEME.md?clave=${pedido.clave}`);
  assert.equal(antes.status, 403, "no se descarga antes de pagar");
  const muestra = await fetch(`${base}/api/pedidos/${pedido.id}/muestra/ejemplo.xlsx?clave=${pedido.clave}`);
  assert.match(muestra.headers.get("content-security-policy"), /sandbox/);
  assert.match(await muestra.text(), /MUESTRA/);

  const pago = await fetch(estado.urlPago.replace(/^http:\/\/localhost:\d+/, base), { redirect: "manual" });
  assert.equal(pago.status, 302);
  assert.equal((await esperar(pedido, "pagado")).descargable, true);
  const archivo = await fetch(`${base}/api/pedidos/${pedido.id}/archivos/LEEME.md?clave=${pedido.clave}`);
  assert.match(await archivo.text(), /entrega de prueba/);
  assert.match(archivo.headers.get("content-disposition"), /attachment/);

  // Correos: confirmación al cliente, pedido con el prompt a la casilla, muestra, pago.
  const al = (para, asunto) => enviados.find((c) => c.to === para && c.subject.startsWith(asunto));
  const confirmacion = al("tito@example.com", "Recibimos tu pedido");
  assert.match(confirmacion.text, /\$ 70\.000, se paga después de ver la muestra/);
  assert.match(confirmacion.text, /no pagás nada/);
  const nuevo = al("pedidos@debarrio.test", "Pedido nuevo");
  assert.match(nuevo.attachments.find((a) => a.filename === "prompt.txt").content, /respuestas_del_cliente/);
  assert.ok(nuevo.attachments.some((a) => a.filename === "marquesina.png"));
  const muestraLista = al("tito@example.com", "Tu muestra está lista");
  assert.match(muestraLista.text, new RegExp(`pedido.html\\?id=${pedido.id}&clave=${pedido.clave}`));
  assert.ok(al("tito@example.com", "Pago recibido"));
  assert.ok(al("pedidos@debarrio.test", "Cobrado"));
  for (const c of enviados.filter((c) => c.to === "tito@example.com")) {
    assert.doesNotMatch(c.text, /claude|prompt/i, "el cliente no ve cómo se arma");
  }

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

test("con REVISAR_ANTES, Claude arranca recién cuando se confirma desde el correo", async () => {
  process.env.REVISAR_ANTES = "1";
  try {
    const form = new FormData();
    conFoto(form);
    form.append("datos", JSON.stringify({
      servicio: "promos", negocio: { nombre: "Ferretería López" }, contacto: { telefono: "11 5555 5555", email: "lopez@example.com" },
      respuestas: { producto: "Tornillos", precio: "500", promo: "2x1", piezas: "10" },
    }));
    const pedido = await (await fetch(`${base}/api/pedidos`, { method: "POST", body: form })).json();
    const correo = enviados.findLast((c) => c.subject.startsWith("Pedido nuevo") && c.subject.includes("López"));
    const link = correo.text.match(/http\S+\/generar\?firma=\w+/)[0].replace(/^http:\/\/localhost:\d+/, base);
    const estado = async () => (await (await fetch(`${base}/api/pedidos/${pedido.id}?clave=${pedido.clave}`)).json()).estado;
    assert.equal(await estado(), "recibido");
    await fetch(link); // abrir el link (o que lo abra un antivirus) no dispara nada
    assert.equal(await estado(), "recibido");
    assert.equal((await fetch(link.replace(/firma=\w+/, "firma=mal"), { method: "POST" })).status, 404);
    await fetch(link, { method: "POST" });
    assert.equal((await esperar(pedido, "muestra")).estado, "muestra");
    const listo = enviados.findLast((c) => c.subject.startsWith("Muestra lista:") && c.subject.includes("López"));
    assert.match(listo.text, /wa\.me\/5491155555555\?text=/);
  } finally {
    delete process.env.REVISAR_ANTES;
  }
});

test("un flyer sin fotos no se puede pedir", async () => {
  const form = new FormData();
  form.append("datos", JSON.stringify({ servicio: "flyer", negocio: { nombre: "Ferretería López" }, contacto: { telefono: "1155555555", email: "lopez@example.com" },
    respuestas: { motivo: "Una oferta", mensaje: "2x1 en tornillos", versiones: "Una" } }));
  const r = await fetch(`${base}/api/pedidos`, { method: "POST", body: form });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /fotos/);
  const conFotos = await fetch(`${base}/api/pedidos`, { method: "POST", body: conFoto(form) });
  assert.equal(conFotos.status, 200);
});
