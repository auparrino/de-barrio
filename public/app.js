const $ = (s) => document.querySelector(s);
const pesos = (n) => (n < 0 ? "- " : "") + "$ " + Math.abs(Math.round(n)).toLocaleString("es-AR");
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fecha = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

const catalogo = await (await fetch("/api/catalogo")).json();
let servicio = null;

// ---------- Lista de precios ----------
$("#catalogo").innerHTML = catalogo.categorias.map((cat) => `
  <section class="gondola" aria-labelledby="g-${cat.id}">
    <h3 id="g-${cat.id}">${escapar(cat.nombre)}</h3>
    <p>${escapar(cat.descripcion)}</p>
    <ul>
      ${catalogo.servicios.filter((s) => s.categoria === cat.id).map((s) => `
        <li>
          <button type="button" class="renglon" data-id="${s.id}" ${s.disponible ? "" : "disabled"}
            aria-describedby="d-${s.id}">
            <span class="nombre">${escapar(s.nombre)}</span>
            <span class="puntos" aria-hidden="true"></span>
            <span class="monto">${s.disponible ? `<small>desde</small>${pesos(s.precio_base)}` : "llega pronto"}</span>
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
  mostrarTicket(null);
  $("#lista").scrollIntoView();
});

// Pie: cuándo se verificaron los datos que usan los servicios
const tablas = catalogo.tablas ?? [];
if (tablas.length) {
  $("#pie-tablas").textContent = "Datos verificados: " + tablas
    .map((t) => `${t.nombre} ${t.verificado ? `al ${fecha(t.fecha)}` : "(en revisión)"}`)
    .join("; ") + ".";
}

// ---------- Formulario ----------
function campoHtml(c) {
  const nombre = `respuestas.${c.id}`;
  const req = c.requerido ? "required" : "";
  const marca = c.requerido ? "" : " <em>(opcional)</em>";
  if (c.tipo === "texto_largo") return `<label>${escapar(c.etiqueta)}${marca}<textarea name="${nombre}" rows="4" ${req}></textarea></label>`;
  if (c.tipo === "opciones") return `<label>${escapar(c.etiqueta)}<select name="${nombre}">${c.valores.map((v) => `<option>${escapar(v)}</option>`).join("")}</select></label>`;
  return `<label>${escapar(c.etiqueta)}${marca}<input name="${nombre}" ${req}></label>`;
}

function opcionHtml(o) {
  if (o.tipo === "si_no") {
    return `<label class="check"><input type="checkbox" name="opciones.${o.id}"> ${escapar(o.nombre)} <em>+${pesos(o.precio)}</em></label>`;
  }
  return `<label>${escapar(o.nombre)} <em>${pesos(o.precio_unitario)} cada uno, hasta ${o.max}</em>
    <input type="number" name="opciones.${o.id}" min="0" max="${o.max}" value="0" inputmode="numeric"></label>`;
}

function elegir(id) {
  servicio = catalogo.servicios.find((s) => s.id === id);
  $("#f-titulo").textContent = servicio.nombre;
  $("#f-descripcion").textContent = servicio.descripcion;
  $("#f-entregables").textContent = servicio.entregables.join(" · ");
  $("#f-campos").innerHTML = servicio.campos.map(campoHtml).join("");
  $("#f-opciones").innerHTML = servicio.opciones.map(opcionHtml).join("");
  $("#f-opciones-caja").hidden = servicio.opciones.length === 0;
  $("#f-adjuntos").hidden = !servicio.adjuntos;
  $("#f-adjuntos-ayuda").textContent = servicio.adjuntos_ayuda
    ?? "Fotos o PDF que ayuden: listas de precios, facturas, la libreta (hasta 8). Si los subís, podés dejar en blanco lo que ya esté ahí.";
  $("#pedido").reset();
  $("#error").hidden = true;
  $("#lista").hidden = true;
  $("#formulario").hidden = false;
  $("#formulario").scrollIntoView();
  $("#f-titulo").setAttribute("tabindex", "-1");
  $("#f-titulo").focus({ preventScroll: true });
  recotizar();
}

function leerFormulario() {
  const datos = { servicio: servicio.id, negocio: {}, contacto: {}, respuestas: {}, opciones: {} };
  for (const el of $("#pedido").elements) {
    if (!el.name || el.type === "file" || el.name === "urgente") continue;
    const [grupo, clave] = el.name.split(".");
    datos[grupo][clave] = el.type === "checkbox" ? el.checked : el.value;
  }
  return datos;
}

// ---------- Ticket ----------
let ultimoTotal = null;
function mostrarTicket(cot) {
  const ticket = $("#ticket");
  const hay = Boolean(cot);
  ticket.classList.toggle("activo", hay);
  $("#ticket-vacio").hidden = hay;
  $("#ticket-total").hidden = !hay;
  $("#pagar").hidden = !hay;
  $("#ticket-pie").hidden = !hay;
  $("#cot-lineas").innerHTML = hay
    ? cot.lineas.map((l) => `<tr><td>${escapar(l.concepto)}</td><td>${pesos(l.importe)}</td></tr>`).join("")
    : "";
  if (!hay) { ultimoTotal = null; return; }
  $("#cot-total").textContent = pesos(cot.total);
  // El único movimiento del sitio: el papel avanza cuando cambia el total.
  if (cot.total !== ultimoTotal) {
    ticket.classList.remove("imprime");
    void ticket.offsetWidth;
    ticket.classList.add("imprime");
  }
  ultimoTotal = cot.total;
}

async function recotizar() {
  const { servicio: id, opciones } = leerFormulario();
  const r = await fetch("/api/cotizar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ servicio: id, opciones }),
  });
  mostrarTicket(await r.json());
}

$("#pedido").addEventListener("change", (e) => {
  if (e.target.name?.startsWith("opciones.")) recotizar();
});

// ---------- Envío ----------
function validar() {
  const conArchivos = servicio.adjuntos && $("#pedido").elements.adjuntos.files.length > 0;
  let primero = null;
  for (const el of $("#pedido").elements) {
    if (!el.name) continue;
    const esCampoDelServicio = el.name.startsWith("respuestas.");
    const vacio = el.required && !el.value.trim() && !(conArchivos && esCampoDelServicio);
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
  const falta = validar();
  if (falta) {
    error.textContent = "Falta completar un dato: te lo marcamos en rojo.";
    error.hidden = false;
    falta.focus();
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
