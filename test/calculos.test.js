import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { precioPorUnidad, precioPromo, EXTRACCIONES } from "../src/calculos.js";
import { estadoTabla, disponibilidad } from "../src/tablas.js";
import { armarXlsx, revisarPlanilla, valorCelda } from "../src/planillas.js";
import { insertarQrs } from "../src/generador.js";

test("precio por unidad de medida", () => {
  assert.deepEqual(precioPorUnidad(4500, 1, "kg"), { valor: 4500, por: "kg" });
  assert.deepEqual(precioPorUnidad(1200, 500, "g"), { valor: 2400, por: "kg" });
  assert.deepEqual(precioPorUnidad(900, 1500, "ml"), { valor: 600, por: "l" });
  assert.deepEqual(precioPorUnidad(300, 30, "g"), { valor: 100, por: "10 g" });
  assert.equal(precioPorUnidad(300, 0, ""), null);
});

test("precio de promo", () => {
  assert.equal(precioPromo(10000, 15), 8500);
  assert.equal(precioPromo(10000, 0), null);
  const r = EXTRACCIONES.precio_promo.calcular({ items: [{ producto: "Asado", precio_normal: 12000, descuento_pct: 10 }] });
  assert.equal(r[0].precio_promo, "$ 10.800");
});

test("una tabla sin verificar o vencida apaga el servicio", () => {
  const hoy = new Date("2026-11-15");
  const t = { titulo: "X", fecha: "2026-11-01", vigencia_dias: 30, verificado: true };
  assert.ok(estadoTabla(t, hoy).ok);
  assert.ok(!estadoTabla({ ...t, verificado: false }, hoy).ok);
  assert.ok(!estadoTabla({ ...t, fecha: "2026-09-01" }, hoy).ok);
  assert.equal(disponibilidad({ tablas: ["x"] }, { x: t }, hoy).disponible, true);
  assert.equal(disponibilidad({ tablas: ["x"] }, {}, hoy).disponible, false);
  assert.equal(disponibilidad({ tablas: [] }, {}, hoy).disponible, true);
});

test("las planillas guardan fórmulas reales y números", async () => {
  assert.deepEqual(valorCelda("=SUM(A1:A2)"), { formula: "SUM(A1:A2)" });
  assert.equal(valorCelda("1234.5"), 1234.5);
  assert.equal(valorCelda("1.234"), 1.234);
  assert.equal(valorCelda("Yerba"), "Yerba");
  const spec = { archivo: "a.xlsx", hojas: [{ nombre: "Datos", filas: [["A"], ["2"], ["3"], ["=SUM(A2:A3)"]] }] };
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(await armarXlsx(spec));
  assert.equal(libro.getWorksheet("Datos").getCell("A4").formula, "SUM(A2:A3)");
  assert.equal(libro.getWorksheet("Datos").getCell("A2").value, 2);
});

test("detecta fórmulas que apuntan a hojas que no existen", () => {
  const spec = { archivo: "a.xlsx", hojas: [{ nombre: "Datos", filas: [["=Otra!A1", "='Gastos fijos'!B2", "=Datos!A1"]] }] };
  const problemas = revisarPlanilla(spec);
  assert.equal(problemas.length, 2);
});

test("reemplaza los marcadores de QR por un SVG real", async () => {
  const html = await insertarQrs('<div>{{QR:https://wa.me/541100000000}}</div>');
  assert.match(html, /<svg[^>]*viewBox/);
  assert.doesNotMatch(html, /\{\{QR/);
});
