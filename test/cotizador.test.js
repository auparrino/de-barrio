import test from "node:test";
import assert from "node:assert/strict";
import { cargarCatalogo, cotizar } from "../src/cotizador.js";
import { rutaSegura } from "../src/almacen.js";

const catalogo = cargarCatalogo();

test("ningún servicio supera el tope, ni con todos los adicionales y urgencia", () => {
  for (const s of catalogo.servicios) {
    const opciones = Object.fromEntries(s.opciones.map((o) => [o.id, o.tipo === "cantidad" ? o.max : true]));
    const c = cotizar(catalogo, s.id, opciones, { urgente: true });
    assert.ok(c.total <= catalogo.tope, `${s.id}: ${c.total}`);
    assert.ok(s.precio_base <= catalogo.tope);
  }
});

test("suma base, adicionales y recargo", () => {
  const c = cotizar(catalogo, "flyer", { variantes: 2, dorso: true }, { urgente: true });
  assert.equal(c.total, Math.round((25000 + 16000 + 7000) * 1.2));
});

test("las cantidades se limitan al máximo y no aceptan negativos", () => {
  assert.equal(cotizar(catalogo, "flyer", { variantes: 99 }).total, 25000 + 3 * 8000);
  assert.equal(cotizar(catalogo, "flyer", { variantes: -5 }).total, 25000);
});

test("servicio desconocido falla", () => {
  assert.throws(() => cotizar(catalogo, "nada"));
});

test("las rutas generadas no escapan de la carpeta", () => {
  assert.equal(rutaSegura("/x", "../etc/passwd"), null);
  assert.equal(rutaSegura("/x", "a/../../b"), null);
  assert.equal(rutaSegura("/x", "/sitio/index.html"), "/x/sitio/index.html");
});
