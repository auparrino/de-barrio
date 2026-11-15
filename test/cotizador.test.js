import test from "node:test";
import assert from "node:assert/strict";
import { cargarCatalogo, cotizar } from "../src/cotizador.js";
import { rutaSegura } from "../src/almacen.js";
import { cargarTablas } from "../src/tablas.js";

const catalogo = cargarCatalogo();

test("ningún servicio supera el tope, ni con todos los adicionales", () => {
  for (const s of catalogo.servicios) {
    const opciones = Object.fromEntries(s.opciones.map((o) => [o.id, o.tipo === "cantidad" ? o.max : true]));
    const c = cotizar(catalogo, s.id, opciones, { urgente: true });
    assert.ok(c.total <= catalogo.tope, `${s.id}: ${c.total}`);
  }
});

test("catálogo coherente: categorías, tablas e instrucciones", () => {
  const categorias = new Set(catalogo.categorias.map((c) => c.id));
  const tablas = cargarTablas();
  const ids = new Set();
  for (const s of catalogo.servicios) {
    assert.ok(!ids.has(s.id), `id repetido ${s.id}`);
    ids.add(s.id);
    assert.ok(categorias.has(s.categoria), `${s.id}: categoría ${s.categoria}`);
    assert.ok(s.instrucciones?.length > 50, `${s.id}: sin instrucciones`);
    for (const t of s.tablas) assert.ok(tablas[t], `${s.id}: falta la tabla ${t}`);
  }
  for (const c of categorias) assert.ok(catalogo.servicios.some((s) => s.categoria === c), `categoría vacía ${c}`);
});

test("suma base y adicionales", () => {
  const c = cotizar(catalogo, "stock", { productos_extra: 2, etiquetas: true });
  assert.equal(c.total, 150000 + 30000 + 15000);
});

test("las cantidades se limitan al máximo y no aceptan negativos", () => {
  assert.equal(cotizar(catalogo, "promos", { piezas_extra: 99 }).total, 55000 + 2 * 15000);
  assert.equal(cotizar(catalogo, "promos", { piezas_extra: -5 }).total, 55000);
});

test("servicio desconocido falla", () => {
  assert.throws(() => cotizar(catalogo, "nada"));
});

test("las rutas generadas no escapan de la carpeta", () => {
  assert.equal(rutaSegura("/x", "../etc/passwd"), null);
  assert.equal(rutaSegura("/x", "a/../../b"), null);
  assert.equal(rutaSegura("/x", "/sitio/index.html"), "/x/sitio/index.html");
});
