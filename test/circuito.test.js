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

// Copia de las tablas con la de comisiones sin verificar, para probar que su servicio se apaga.
const tablasDir = mkdtempSync(join(tmpdir(), "tablas-"));
for (const f of readdirSync("data/tablas").filter((f) => f.endsWith(".json"))) {
  const t = JSON.parse(readFileSync(join("data/tablas", f), "utf8"));
  if (t.id === "comisiones") t.verificado = false;
  writeFileSync(join(tablasDir, f), JSON.stringify(t));
}
process.env.TABLAS_DIR = tablasDir;

const { default: app } = await import("../server.js");
const servidor = app.listen(0);
const base = `http://localhost:${servidor.address().port}`;
test.after(() => servidor.close());

test("pedido pagado genera archivos descargables", async () => {
  const datos = {
    servicio: "promos",
    negocio: { nombre: "Almacén Don Tito", rubro: "almacén" },
    contacto: { email: "tito@example.com" },
    respuestas: { producto: "Fideos 500 g", precio: "1200", promo: "2x1", cuando: "Esta semana", piezas: "10" },
  };
  const form = new FormData();
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

  const archivo = await fetch(`${base}/api/pedidos/${pedido.id}/archivos/LEEME.md?clave=${pedido.clave}`);
  assert.match(await archivo.text(), /entrega de prueba/);
  assert.match(archivo.headers.get("content-disposition"), /attachment/);

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
  const r = await fetch(`${base}/api/cotizar-agente`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ servicio: "stock", respuestas: { productos: "Más de 150", etiquetas: true }, opciones: { productos_extra: 0 } }),
  });
  const res = await r.json();
  assert.equal(r.status, 200);
  assert.equal(res.opciones.productos_extra, 2);
  assert.equal(res.cotizacion.total, 150000 + 30000 + 15000);
  assert.equal(res.agente, false);
});
