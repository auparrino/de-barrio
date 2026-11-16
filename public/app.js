const $ = (s) => document.querySelector(s);
const pesos = (n) => (n < 0 ? "- " : "") + "$ " + Math.abs(Math.round(n)).toLocaleString("es-AR");
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fecha = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

import { cotizar, opcionesDesdeRespuestas } from "./cotizar.js";
import { mensajeWhatsApp, linkWhatsApp } from "./pedido-texto.js";

// Versión de prueba (GitHub Pages): sin servidor. El catálogo sale de un archivo, el precio se
// calcula acá con el mismo código que el servidor y el pago muestra un aviso.
const ESTATICO = document.documentElement.hasAttribute("data-estatico");

const catalogo = await (await fetch(ESTATICO ? "api/catalogo.json" : "/api/catalogo")).json();
const porId = Object.fromEntries(catalogo.servicios.map((s) => [s.id, s]));
if (ESTATICO) $("#pagar").textContent = "Enviar pedido por WhatsApp";
let servicio = null;

// ---------- Qué hacemos (sin precios: el precio sale al cotizar) ----------
const COLORES = ["verde", "rosa", "celeste", "ocre", "verde", "rosa"];
$("#catalogo").innerHTML = catalogo.categorias.map((cat, i) => `
  <section class="gondola gondola-${COLORES[i % COLORES.length]}" aria-labelledby="g-${cat.id}">
    <h3 id="g-${cat.id}">${escapar(cat.nombre)}</h3>
    <ul>
      ${catalogo.servicios.filter((s) => s.categoria === cat.id).map((s) => `
        <li>
          <button type="button" class="renglon" data-id="${s.id}" ${s.disponible ? "" : "disabled"}
            aria-describedby="d-${s.id}">
            <span class="nombre">${escapar(s.nombre)}</span>
            ${s.disponible ? `<span class="monto"><small>desde</small> ${pesos(s.precio_base)}</span>` : `<span class="pronto">en preparación</span>`}
          </button>
          <p class="detalle" id="d-${s.id}">${escapar(s.descripcion)}</p>
        </li>`).join("")}
    </ul>
  </section>`).join("");

$("#catalogo").addEventListener("click", (e) => {
  const boton = e.target.closest(".renglon");
  if (boton && !boton.disabled) elegir(boton.dataset.id);
});

$("#volver").addEventListener("click", () => {
  servicio = null;
  $("#formulario").hidden = true;
  $("#lista").hidden = false;
  $("#lista").scrollIntoView();
});

// ---------- Formulario ----------
// Preguntas para tocar: casilleros como los de una boleta. Texto solo donde no hay otra.
let uid = 0;

// Cuánto suma marcar este valor (para mostrarlo en el casillero).
function suma(c, valor) {
  const op = c.ajusta && servicio.opciones.find((o) => o.id === c.ajusta.opcion);
  if (!op) return 0;
  if (c.tipo === "si_no") return op.precio ?? 0;
  if (c.tipo === "varios" && c.ajusta.cuenta) return op.precio_unitario ?? 0;
  const v = c.ajusta.valores?.[valor];
  if (v === true) return op.precio ?? 0;
  return v ? v * (op.precio_unitario ?? 0) : 0;
}
const masPrecio = (n) => (n ? ` <span class="mas">+ ${pesos(n)}</span>` : "");
function campoHtml(c) {
  const nombre = `respuestas.${c.id}`;
  const opcional = c.requerido ? "" : " <em>(si querés)</em>";
  if (c.tipo === "elegir" || c.tipo === "varios") {
    const tipo = c.tipo === "elegir" ? "radio" : "checkbox";
    return `<fieldset class="pregunta" data-campo="${c.id}" ${c.requerido ? "data-requerido" : ""}>
      <legend>${escapar(c.etiqueta)}${c.tipo === "varios" ? " <em>(podés marcar varias)</em>" : opcional}</legend>
      <div class="casilleros">${c.valores.map((v) => {
        const id = `c${++uid}`;
        return `<input type="${tipo}" id="${id}" name="${nombre}" value="${escapar(v)}"><label for="${id}">${escapar(v)}${masPrecio(suma(c, v))}</label>`;
      }).join("")}</div>
    </fieldset>`;
  }
  if (c.tipo === "si_no") {
    const id = `c${++uid}`;
    return `<div class="pregunta pregunta-si"><input type="checkbox" id="${id}" name="${nombre}"><label for="${id}">${escapar(c.etiqueta)}${masPrecio(suma(c, true))}</label></div>`;
  }
  if (c.tipo === "texto_largo") return `<label>${escapar(c.etiqueta)}${opcional}<textarea name="${nombre}" rows="3"></textarea></label>`;
  return `<label>${escapar(c.etiqueta)}${opcional}<input name="${nombre}" placeholder="${escapar(c.ayuda ?? "")}" ${c.requerido ? "required" : ""}></label>`;
}

function elegir(id) {
  servicio = porId[id];
  $("#f-titulo").textContent = servicio.nombre;
  $("#f-precio").innerHTML = `<small>desde</small> ${pesos(servicio.precio_base)}`;
  $("#f-descripcion").textContent = servicio.descripcion;
  $("#f-entregables").textContent = servicio.entregables.join(" · ");
  $("#f-campos").innerHTML = servicio.campos.map(campoHtml).join("");
  $("#f-adjuntos").hidden = !servicio.adjuntos;
  $("#f-adjuntos-ayuda").textContent = servicio.adjuntos_ayuda ?? "";
  $("#pedido").reset();
  $("#error").hidden = true;
  $("#ticket").hidden = true;
  $("#lista").hidden = true;
  $("#formulario").hidden = false;
  opcionesAgente = {};
  alMomento();
  $("#formulario").scrollIntoView();
  $("#f-titulo").setAttribute("tabindex", "-1");
  $("#f-titulo").focus({ preventScroll: true });
}

function leerFormulario() {
  const datos = { servicio: servicio.id, negocio: {}, contacto: {}, respuestas: {}, opciones: { ...opcionesAgente } };
  for (const c of servicio.campos) if (c.tipo === "varios") datos.respuestas[c.id] = [];
  for (const el of $("#pedido").elements) {
    if (!el.name || el.type === "file") continue;
    const [grupo, clave] = el.name.split(".");
    const campo = grupo === "respuestas" ? servicio.campos.find((c) => c.id === clave) : null;
    if (campo?.tipo === "varios") { if (el.checked) datos[grupo][clave].push(el.value); }
    else if (campo?.tipo === "elegir") { if (el.checked) datos[grupo][clave] = el.value; }
    else if (el.type === "radio") { if (el.checked) datos[grupo][clave] = el.value; }
    else if (el.type === "checkbox") datos[grupo][clave] = el.checked;
    else datos[grupo][clave] = el.value;
  }
  return datos;
}

// Lo que ajustó el cotizador (solo puede sumar a lo que se tildó).
let opcionesAgente = {};

// ---------- Presupuesto ----------
let ultimoTotal = null;
function mostrarTicket(cot, agente) {
  const ticket = $("#ticket");
  ticket.hidden = false;
  $("#cot-lineas").innerHTML = cot.lineas.map((l) => `<tr><td>${escapar(l.concepto)}</td><td>${pesos(l.importe)}</td></tr>`).join("");
  $("#cot-total").textContent = pesos(cot.total);

  if (agente) {
    $("#ticket-nota").textContent = agente.explicacion;
    $("#ticket-nota").hidden = !agente.explicacion;
    const extra = [
      ...agente.preguntas.map((p) => `<li><b>Una pregunta:</b> ${escapar(p)}</li>`),
      ...agente.sugerencias.map((s) => porId[s.servicio]
        ? `<li><b>${escapar(porId[s.servicio].nombre)}:</b> ${escapar(s.motivo)} <button type="button" class="enlace" data-id="${s.servicio}">Ver</button></li>`
        : ""),
    ].join("");
    $("#ticket-extra").innerHTML = extra;
    $("#ticket-extra").hidden = !extra;
  }
  // El único movimiento del sitio: el papel avanza cuando cambia el total.
  if (cot.total !== ultimoTotal) {
    ticket.classList.remove("imprime");
    void ticket.offsetWidth;
    ticket.classList.add("imprime");
  }
  ultimoTotal = cot.total;
}

$("#ticket-extra").addEventListener("click", (e) => {
  const id = e.target.dataset?.id;
  if (id) elegir(id);
});

function sanear(opciones) {
  const limpio = {};
  for (const o of servicio.opciones) {
    const v = opciones[o.id];
    limpio[o.id] = o.tipo === "cantidad" ? Math.max(0, Math.min(o.max ?? 1, Math.floor(Number(v) || 0))) : v === true;
  }
  return limpio;
}

function opcionesFinales(datos) {
  const base = opcionesDesdeRespuestas(servicio, datos.respuestas);
  for (const [k, v] of Object.entries(opcionesAgente)) base[k] = typeof v === "boolean" ? base[k] || v : Math.max(base[k], v);
  return base;
}

async function precio(opciones) {
  if (ESTATICO) return cotizar(catalogo, servicio.id, sanear(opciones));
  const r = await fetch("/api/cotizar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ servicio: servicio.id, opciones }),
  });
  return r.json();
}

// Cotizar: el agente lee lo que contaste y ajusta los adicionales; el precio lo calcula el servidor.
$("#cotizar").addEventListener("click", async () => {
  const error = $("#error");
  error.hidden = true;
  const falta = validar(false);
  if (falta) {
    error.textContent = "Falta completar algo: te lo marcamos en rojo.";
    error.hidden = false;
    falta.focus();
    return;
  }
  const boton = $("#cotizar");
  boton.disabled = true;
  boton.textContent = "Cotizando…";
  try {
    const datos = leerFormulario();
    if (ESTATICO) {
      const opciones = opcionesFinales(datos);
      const res = { opciones, cotizacion: cotizar(catalogo, servicio.id, opciones), preguntas: [], sugerencias: [], explicacion: "" };
      mostrarTicket(res.cotizacion, res);
      $("#ticket").scrollIntoView({ block: "nearest" });
      return;
    }
    const r = await fetch("/api/cotizar-agente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        servicio: datos.servicio,
        respuestas: datos.respuestas,
        adjuntos: $("#pedido").elements.adjuntos.files.length,
      }),
    });
    const res = await r.json();
    if (!r.ok) throw new Error(res.error);
    // Se guarda solo lo que el cotizador sumó por encima de lo tildado.
    const base = opcionesDesdeRespuestas(servicio, datos.respuestas);
    opcionesAgente = Object.fromEntries(Object.entries(res.opciones).filter(([k, v]) => (typeof v === "boolean" ? v && !base[k] : v > base[k])));
    mostrarTicket(res.cotizacion, res);
    $("#ticket").scrollIntoView({ block: "nearest" });
  } catch (err) {
    error.textContent = err.message || "No pudimos cotizar. Probá de nuevo en un rato.";
    error.hidden = false;
  } finally {
    boton.disabled = false;
    boton.textContent = "Volver a cotizar";
  }
});

// El total se ve mientras se tilda: lo calcula acá el mismo código que usa el servidor.
function alMomento() {
  const cot = cotizar(catalogo, servicio.id, opcionesFinales(leerFormulario()));
  $("#al-momento-total").textContent = pesos(cot.total);
}
$("#pedido").addEventListener("change", (e) => {
  if (servicio && e.target.name?.startsWith("respuestas.")) alMomento();
});

// Si después de cotizar cambia una respuesta, el total se actualiza al momento.
$("#pedido").addEventListener("change", async (e) => {
  if (!$("#ticket").hidden && e.target.name?.startsWith("respuestas.")) {
    mostrarTicket(await precio(opcionesFinales(leerFormulario())));
  }
});

// ---------- Envío ----------
function validar(conPago = true) {
  const conArchivos = servicio.adjuntos && $("#pedido").elements.adjuntos.files.length > 0;
  let primero = null;
  // Preguntas de elegir obligatorias: alguna casilla marcada.
  for (const f of document.querySelectorAll(".pregunta[data-requerido]")) {
    const marcada = f.querySelector("input:checked");
    f.classList.toggle("falta", !marcada);
    if (!marcada && !primero) primero = f.querySelector("input");
  }
  for (const el of $("#pedido").elements) {
    if (!el.name || el.type === "file" || el.type === "checkbox") continue;
    const esCampoDelServicio = el.name.startsWith("respuestas.");
    const esContacto = el.name.startsWith("contacto.");
    const vacio = el.required && !el.value.trim() && !(conArchivos && esCampoDelServicio) && (conPago || !esContacto);
    const malEmail = el.type === "email" && el.value && !el.checkValidity();
    const mal = vacio || malEmail;
    el.setAttribute("aria-invalid", String(mal));
    if (mal && !primero) primero = el;
  }
  return primero;
}

$("#pedido").addEventListener("submit", async (e) => {
  e.preventDefault();
  const error = $("#error");
  const falta = validar(true);
  if (falta) {
    error.textContent = "Falta completar algo: te lo marcamos en rojo.";
    error.hidden = false;
    falta.focus();
    return;
  }
  if (ESTATICO) {
    // Versión de prueba: en vez de pagar y mandar a Claude, el pedido va por WhatsApp al dueño.
    const datos = leerFormulario();
    const texto = mensajeWhatsApp({
      servicio,
      datos,
      cotizacion: cotizar(catalogo, servicio.id, opcionesFinales(datos)),
      tablas: servicio.tablas_vigentes,
      guias: servicio.guias,
      adjuntos: $("#pedido").elements.adjuntos.files.length,
    });
    window.open(linkWhatsApp(texto, catalogo.whatsapp), "_blank", "noopener");
    return;
  }
  const boton = $("#pagar");
  boton.disabled = true;
  boton.textContent = "Preparando el pago…";
  error.hidden = true;
  try {
    const cuerpo = new FormData();
    cuerpo.append("datos", JSON.stringify(leerFormulario()));
    for (const f of $("#pedido").elements.adjuntos.files) cuerpo.append("adjuntos", f);
    const r = await fetch("/api/pedidos", { method: "POST", body: cuerpo });
    const res = await r.json();
    if (!r.ok) throw new Error(res.error);
    location.href = res.urlPago;
  } catch (err) {
    error.textContent = err.message || "No pudimos crear el pedido. Probá de nuevo en un rato.";
    error.hidden = false;
    boton.disabled = false;
    boton.textContent = "Pagar con Mercado Pago";
  }
});
