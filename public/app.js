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
if (ESTATICO) $("#pagar").textContent = "Enviar pedido";
let servicio = null;

// ---------- Lista: cada servicio con su precio base ----------
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
  if (c.tipo === "texto_largo") {
    return `<details class="plegado"><summary>${escapar(c.etiqueta)}</summary><textarea name="${nombre}" rows="3" aria-label="${escapar(c.etiqueta)}"></textarea></details>`;
  }
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
  $("#lista").hidden = true;
  $("#formulario").hidden = false;
  actualizarPresupuesto();
  $("#formulario").scrollIntoView();
  $("#f-titulo").setAttribute("tabindex", "-1");
  $("#f-titulo").focus({ preventScroll: true });
}

function leerFormulario() {
  const datos = { servicio: servicio.id, negocio: {}, contacto: {}, respuestas: {} };
  for (const c of servicio.campos) if (c.tipo === "varios") datos.respuestas[c.id] = [];
  for (const el of $("#pedido").elements) {
    if (!el.name || el.type === "file") continue;
    const [grupo, clave] = el.name.split(".");
    const campo = grupo === "respuestas" ? servicio.campos.find((c) => c.id === clave) : null;
    if (campo?.tipo === "varios") { if (el.checked) datos[grupo][clave].push(el.value); }
    else if (el.type === "radio") { if (el.checked) datos[grupo][clave] = el.value; }
    else if (el.type === "checkbox") datos[grupo][clave] = el.checked;
    else datos[grupo][clave] = el.value;
  }
  datos.opciones = opcionesDesdeRespuestas(servicio, datos.respuestas);
  return datos;
}

// ---------- Total: en la barra, se actualiza mientras se tilda ----------
function actualizarPresupuesto() {
  const cot = cotizar(catalogo, servicio.id, leerFormulario().opciones);
  $("#barra-total-monto").textContent = pesos(cot.total);
}
$("#pedido").addEventListener("change", (e) => {
  if (servicio && e.target.name?.startsWith("respuestas.")) actualizarPresupuesto();
});

// ---------- Envío ----------
function validar() {
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
    const vacio = el.required && !el.value.trim() && !(conArchivos && esCampoDelServicio);
    const malEmail = el.type === "tel" && el.value && el.value.replace(/\D/g, "").length < 8;
    const mal = vacio || malEmail;
    el.setAttribute("aria-invalid", String(mal));
    if (mal && !primero) primero = el;
  }
  return primero;
}

$("#pedido").addEventListener("submit", async (e) => {
  e.preventDefault();
  const error = $("#error");
  const falta = validar();
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
      cotizacion: cotizar(catalogo, servicio.id, datos.opciones),
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
