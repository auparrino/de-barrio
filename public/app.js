const $ = (s) => document.querySelector(s);
const pesos = (n) => (n < 0 ? "- " : "") + "$ " + Math.abs(Math.round(n)).toLocaleString("es-AR");
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fecha = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

import { cotizar, opcionesDesdeRespuestas } from "./cotizar.js";
import { leerMensaje, mensajeCliente, promptClaude } from "./pedido-texto.js";
import { confirmacionHtml, confirmacionTexto, numeroPedido } from "./confirmacion.js";

// Versión de prueba (GitHub Pages): sin servidor. El catálogo sale de un archivo, el precio se
// calcula acá con el mismo código que el servidor y el pago muestra un aviso.
const ESTATICO = document.documentElement.hasAttribute("data-estatico");

const catalogo = await (await fetch(ESTATICO ? "api/catalogo.json" : "/api/catalogo")).json();
const porId = Object.fromEntries(catalogo.servicios.map((s) => [s.id, s]));

// Pantalla de confirmación (versión de prueba): vuelve acá después de mandar el pedido.
function mostrarConfirmacion(datos, aviso = "") {
  $("#lista").hidden = true;
  $("#formulario").hidden = true;
  $("#confirmado").innerHTML = confirmacionHtml(datos) + (aviso ? `<p class="aclaracion">${escapar(aviso)}</p>` : "")
    + `<p><a class="volver" href="${location.pathname}">Volver a la lista</a></p>`;
  $("#confirmado").hidden = false;
  $("#confirmado").scrollIntoView();
}
const confirmadoEnLink = new URLSearchParams(location.search).get("confirmado");
if (confirmadoEnLink) {
  try { mostrarConfirmacion(JSON.parse(decodeURIComponent(escape(atob(confirmadoEnLink))))); } catch { /* link roto: queda la lista */ }
}
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
  $("#f-campos").innerHTML = servicio.campos.map(campoHtml).join("");
  // Fotos: en la versión de prueba se mandan por WhatsApp; con servidor se suben acá.
  $("#f-adjuntos").hidden = !servicio.adjuntos;
  $("#f-adjuntos").classList.remove("falta");
  $("#f-adjuntos .fotos-titulo").textContent = servicio.fotos_obligatorias ? "Fotos (sin fotos no arrancamos)" : "Fotos (si tenés)";
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
    const malEmail = (el.type === "tel" && el.value && el.value.replace(/\D/g, "").length < 8)
      || (el.type === "email" && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
    const mal = vacio || malEmail;
    el.setAttribute("aria-invalid", String(mal));
    if (mal && !primero) primero = el;
  }
  if (servicio.fotos_obligatorias) {
    const sinFotos = !$("#pedido").elements.adjuntos.files.length;
    $("#f-adjuntos").classList.toggle("falta", sinFotos);
    if (sinFotos && !primero) primero = $("#pedido").elements.adjuntos;
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
    enviarPrueba(leerFormulario());
    return;
  }
  const boton = $("#pagar");
  boton.disabled = true;
  boton.textContent = "Enviando…";
  error.hidden = true;
  try {
    const cuerpo = new FormData();
    cuerpo.append("datos", JSON.stringify(leerFormulario()));
    for (const f of $("#pedido").elements.adjuntos.files) cuerpo.append("adjuntos", f);
    const r = await fetch("/api/pedidos", { method: "POST", body: cuerpo });
    const res = await r.json();
    if (!r.ok) throw new Error(res.error);
    location.href = res.urlPedido;
  } catch (err) {
    error.textContent = err.message || "No pudimos crear el pedido. Probá de nuevo en un rato.";
    error.hidden = false;
    boton.disabled = false;
    boton.textContent = "Confirmar pedido";
  }
});

// ---------- Versión de prueba (sin servidor) ----------
// El pedido sale por mail con FormSubmit: a nosotros con el prompt y las fotos, y al
// cliente una respuesta automática con la confirmación. Sin casilla configurada, solo se muestra
// la confirmación en pantalla.
function enviarPrueba(datos) {
  const cotizacion = cotizar(catalogo, servicio.id, datos.opciones);
  const numero = Date.now().toString(36).slice(-6).toUpperCase();
  const conf = {
    numero, servicio: servicio.nombre, negocio: datos.negocio.nombre, total: cotizacion.total,
    email: datos.contacto.email.trim(),
  };
  if (!catalogo.correo_pedidos) {
    mostrarConfirmacion(conf, "Versión de prueba: falta configurar la casilla, así que no se mandó ningún mail.");
    return;
  }
  const leido = leerMensaje(catalogo, mensajeCliente({ servicio, datos, cotizacion }));
  const campos = {
    _subject: `Pedido N° ${numero}: ${servicio.nombre} para ${datos.negocio.nombre} (${pesos(cotizacion.total)})`,
    _template: "box",
    _captcha: "false",
    _autoresponse: confirmacionTexto(conf),
    _next: `${location.origin}${location.pathname}?confirmado=${btoa(unescape(encodeURIComponent(JSON.stringify(conf))))}`,
    email: conf.email,
    "Pedido": `N° ${numero}`,
    "Servicio": servicio.nombre,
    "Negocio": datos.negocio.nombre,
    "WhatsApp": datos.contacto.telefono || "(no dejó)",
    "Total": pesos(cotizacion.total),
    "Respuestas": mensajeCliente({ servicio, datos, cotizacion }),
    "Prompt para Claude": promptClaude({ ...leido, telefono: datos.contacto.telefono }),
  };
  const envio = document.createElement("form");
  envio.method = "POST";
  envio.enctype = "multipart/form-data";
  envio.action = `https://formsubmit.co/${catalogo.correo_pedidos}`;
  envio.hidden = true;
  for (const [nombre, valor] of Object.entries(campos)) {
    const el = document.createElement("textarea");
    el.name = nombre;
    el.value = valor;
    envio.append(el);
  }
  const fotos = $("#pedido").elements.adjuntos;
  if (fotos.files.length) { fotos.name = "attachment"; envio.append(fotos); }
  document.body.append(envio);
  $("#pagar").disabled = true;
  $("#pagar").textContent = "Enviando…";
  envio.submit();
}
