// Recorre el circuito completo en modo demo: cotizar, pedir, pagar (simulado), descargar.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.NODE_ENV = "test";
process.env.GENERADOR = "demo";
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "vecino-"));
delete process.env.MP_ACCESS_TOKEN;

const { default: app } = await import("../server.js");
const servidor = app.listen(0);
const base = `http://localhost:${servidor.address().port}`;
test.after(() => servidor.close());

test("pedido pagado genera archivos descargables", async () => {
  const datos = {
    servicio: "promos",
    negocio: { nombre: "Almacén Don Tito", rubro: "almacén" },
    contacto: { email: "tito@example.com" },
    respuestas: { oferta: "Fideos 500 g a $ 1.200, 2x1 hasta el domingo" },
    opciones: { piezas_extra: 1 },
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
  form.append("datos", JSON.stringify({ servicio: "cobros", negocio: { nombre: "X" }, contacto: { email: "a@b.c" }, respuestas: { medios: "MP", montos: "100" } }));
  const r = await fetch(`${base}/api/pedidos`, { method: "POST", body: form });
  assert.equal(r.status, 409);
});
