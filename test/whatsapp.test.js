// El mensaje que manda el cliente no deja ver cómo se arma el pedido, y el dueño puede
// reconstruir de ese mensaje exactamente lo que se marcó y el total.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cotizar, opcionesDesdeRespuestas } from "../public/cotizar.js";
import { mensajeCliente, leerMensaje, promptClaude } from "../public/pedido-texto.js";

const catalogo = JSON.parse(readFileSync(new URL("../data/catalogo.json", import.meta.url)));

function respuestasDePrueba(servicio) {
  const r = {};
  for (const c of servicio.campos) {
    if (c.tipo === "elegir") r[c.id] = c.valores.at(-1);
    else if (c.tipo === "varios") r[c.id] = c.valores.slice(0, 2);
    else if (c.tipo === "si_no") r[c.id] = true;
    else r[c.id] = c.tipo === "texto_largo" ? "Tornillos\nClavos" : "Lunes a sábado 8 a 13";
  }
  return r;
}

for (const servicio of catalogo.servicios) {
  test(`ida y vuelta por WhatsApp: ${servicio.id}`, () => {
    const respuestas = respuestasDePrueba(servicio);
    const datos = { negocio: { nombre: "Ferretería López" }, respuestas };
    const cotizacion = cotizar(catalogo, servicio.id, opcionesDesdeRespuestas(servicio, respuestas));
    const mensaje = mensajeCliente({ servicio, datos, cotizacion });
    assert.doesNotMatch(mensaje, /claude|prompt|<|instrucciones/i);
    // Como lo copia WhatsApp: con fecha y nombre adelante de cada renglón.
    const copiado = mensaje.split("\n").map((l) => `[16/11 10:20] Juan: ${l}`).join("\n");
    for (const texto of [mensaje, copiado]) {
      const leido = leerMensaje(catalogo, texto);
      assert.equal(leido.servicio.id, servicio.id);
      assert.equal(leido.datos.negocio.nombre, "Ferretería López");
      assert.equal(leido.cotizacion.total, cotizacion.total);
      assert.match(promptClaude(leido), /<respuestas_del_cliente>/);
    }
  });
}
