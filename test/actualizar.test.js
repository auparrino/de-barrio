import test from "node:test";
import assert from "node:assert/strict";
import { controlar, dominioPermitido, REGLAS } from "../tools/actualizar-tablas.js";

const base = {
  id: "comisiones", fecha: "2026-11-01", verificado: true, vigencia_dias: 45, fuentes: [],
  filas: [{ proveedor: "MP", medio: "QR", plazo: "inmediato", comision_pct: 0.8 }],
};
const oficial = ["https://www.mercadopago.com.ar/costs-section"];

test("dominios oficiales", () => {
  assert.ok(dominioPermitido("https://www.mercadopago.com.ar/ayuda", REGLAS.comisiones.dominios));
  assert.ok(!dominioPermitido("https://yo-facturo.com/blog", REGLAS.comisiones.dominios));
  assert.ok(!dominioPermitido("https://mercadopago.com.ar.trucho.com", REGLAS.comisiones.dominios));
});

test("un cambio chico con fuente oficial se aplica", () => {
  const nueva = structuredClone(base);
  nueva.filas[0].comision_pct = 0.9;
  nueva.filas[0].fuente = oficial[0];
  assert.deepEqual(controlar(base, nueva, REGLAS.comisiones, oficial), []);
});

test("un salto grande, una fuente no oficial o un cambio de estructura se frenan", () => {
  const salto = structuredClone(base);
  salto.filas[0].comision_pct = 5;
  assert.equal(controlar(base, salto, REGLAS.comisiones, oficial).length, 1);
  assert.equal(controlar(base, base, REGLAS.comisiones, ["https://blog.com/x"]).length, 1);
  assert.equal(controlar(base, base, REGLAS.comisiones, []).length, 1);
  const otra = structuredClone(base);
  otra.filas[0].extra = 1;
  assert.ok(controlar(base, otra, REGLAS.comisiones, oficial).some((p) => p.includes("estructura")));
});

test("los salarios no pueden saltar fuera de rango; los null pueden completarse", () => {
  const t = { id: "escala_comercio", categorias: [{ categoria: "Vendedor A", basico: 1000000, no_remunerativo: null }] };
  const ok = structuredClone(t);
  ok.categorias[0].basico = 1050000;
  ok.categorias[0].no_remunerativo = 50000;
  const url = ["https://www.faecys.org.ar/escalas"];
  assert.deepEqual(controlar(t, ok, REGLAS.escala_comercio, url), []);
  const mal = structuredClone(t);
  mal.categorias[0].basico = 2000000;
  assert.equal(controlar(t, mal, REGLAS.escala_comercio, url).length, 1);
});

test("una norma que cambió nunca se aplica sola", () => {
  const t = { id: "normativa_precios", reglas: ["a"] };
  const url = ["https://www.boletinoficial.gob.ar/x"];
  assert.deepEqual(controlar(t, structuredClone(t), REGLAS.normativa_precios, url), []);
  assert.equal(controlar(t, { ...t, reglas: ["b"] }, REGLAS.normativa_precios, url).length, 1);
});
