import test from "node:test";
import assert from "node:assert/strict";
import { cargarCatalogo, buscarServicio } from "../src/cotizador.js";

test("las respuestas tildadas definen los adicionales", async () => {
  const { opcionesDesdeRespuestas } = await import("../public/cotizar.js");
  const cat = cargarCatalogo();
  const web = buscarServicio(cat, "sitio_web");
  assert.deepEqual(opcionesDesdeRespuestas(web, { secciones: ["Galería de fotos", "Preguntas frecuentes"], ingles: true }), { secciones: 2, ingles: true });
  const caja = buscarServicio(cat, "caja");
  assert.deepEqual(opcionesDesdeRespuestas(caja, { quien: "También los empleados" }), { empleado: true });
  assert.deepEqual(opcionesDesdeRespuestas(caja, { quien: "Yo" }), { empleado: false });
});

test("cada adicional del catálogo lo define alguna pregunta", () => {
  for (const s of cargarCatalogo().servicios) {
    for (const o of s.opciones) assert.ok(s.campos.some((c) => c.ajusta?.opcion === o.id), `${s.id}.${o.id}`);
  }
});
