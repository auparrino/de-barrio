import test from "node:test";
import assert from "node:assert/strict";
import { sanear } from "../src/cotizador-agente.js";
import { cargarCatalogo, buscarServicio } from "../src/cotizador.js";

test("el agente solo puede devolver adicionales válidos del catálogo", () => {
  const s = buscarServicio(cargarCatalogo(), "stock");
  assert.deepEqual(sanear(s, { productos_extra: 7, etiquetas: "si", inventado: 3 }), { productos_extra: 2, etiquetas: false });
  assert.deepEqual(sanear(s, { productos_extra: -1, etiquetas: true }), { productos_extra: 0, etiquetas: true });
});
