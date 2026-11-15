const $ = (s) => document.querySelector(s);
const pesos = (n) => (n < 0 ? "- " : "") + "$ " + Math.abs(Math.round(n)).toLocaleString("es-AR");

const catalogo = await (await fetch("/api/catalogo")).json();
let servicio = null;

// ---------- Catálogo ----------
$("#catalogo").innerHTML = catalogo.categorias.map((cat) => `
  <h2>${cat.nombre}</h2>
  <p class="cat-desc">${cat.descripcion}</p>
  <div class="tarjetas">
    ${catalogo.servicios.filter((s) => s.categoria === cat.id).map((s) => `
      <article class="tarjeta${s.disponible ? "" : " apagada"}">
        <h3>${s.nombre}</h3>
        <p>${s.descripcion}</p>
        <p class="precio">desde <strong>${pesos(s.precio_base)}</strong></p>
        ${s.disponible
          ? `<button type="button" data-id="${s.id}">Lo quiero</button>`
          : `<span class="pronto">Muy pronto</span>`}
      </article>`).join("")}
  </div>`).join("");

$("#catalogo").addEventListener("click", (e) => {
  const id = e.target.dataset?.id;
  if (id) elegir(id);
});
$("#volver").addEventListener("click", () => {
  $("#formulario").hidden = true;
  $("#catalogo").hidden = false;
});

// ---------- Formulario ----------
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function campoHtml(c) {
  const nombre = `respuestas.${c.id}`;
  const req = c.requerido && !servicio.adjuntos ? "required" : "";
  if (c.tipo === "texto_largo") return `<label>${escapar(c.etiqueta)}<textarea name="${nombre}" rows="4" ${req}></textarea></label>`;
  if (c.tipo === "opciones") return `<label>${escapar(c.etiqueta)}<select name="${nombre}">${c.valores.map((v) => `<option>${escapar(v)}</option>`).join("")}</select></label>`;
  return `<label>${escapar(c.etiqueta)}<input name="${nombre}" ${req}></label>`;
}

function opcionHtml(o) {
  if (o.tipo === "si_no") return `<label class="check"><input type="checkbox" name="opciones.${o.id}"> ${escapar(o.nombre)} <em>+${pesos(o.precio)}</em></label>`;
  return `<label>${escapar(o.nombre)} <em>${pesos(o.precio_unitario)} c/u</em>
    <input type="number" name="opciones.${o.id}" min="0" max="${o.max}" value="0"></label>`;
}

function elegir(id) {
  servicio = catalogo.servicios.find((s) => s.id === id);
  $("#f-titulo").textContent = servicio.nombre;
  $("#f-descripcion").textContent = servicio.descripcion;
  $("#f-entregables").textContent = "Recibís: " + servicio.entregables.join(" · ");
  $("#f-campos").innerHTML = servicio.campos.map(campoHtml).join("");
  $("#f-opciones").innerHTML = servicio.opciones.map(opcionHtml).join("");
  const urgente = catalogo.recargos?.urgente;
  $("#f-urgente").textContent = urgente ? `${urgente.nombre} (+${urgente.porcentaje}%)` : "";
  $("#f-urgente").parentElement.hidden = !urgente;
  $("#f-opciones-caja").hidden = !urgente && servicio.opciones.length === 0;
  $("#f-adjuntos").hidden = !servicio.adjuntos;
  $("#f-adjuntos-ayuda").textContent = servicio.adjuntos_ayuda ?? "Fotos o PDF (listas de precios, facturas, la libreta, etc.; hasta 8)";
  $("#pedido").reset();
  $("#error").hidden = true;
  $("#catalogo").hidden = true;
  $("#formulario").hidden = false;
  window.scrollTo(0, 0);
  recotizar();
}

function leerFormulario() {
  const datos = { servicio: servicio.id, negocio: {}, contacto: {}, respuestas: {}, opciones: {}, urgente: false };
  for (const el of $("#pedido").elements) {
    if (!el.name || el.type === "file") continue;
    const valor = el.type === "checkbox" ? el.checked : el.value;
    if (el.name === "urgente") { datos.urgente = valor; continue; }
    const [grupo, clave] = el.name.split(".");
    datos[grupo][clave] = valor;
  }
  return datos;
}

async function recotizar() {
  const { servicio: id, opciones, urgente } = leerFormulario();
  const r = await fetch("/api/cotizar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ servicio: id, opciones, urgente }),
  });
  const cot = await r.json();
  $("#cot-lineas").innerHTML = cot.lineas.map((l) => `<tr><td>${escapar(l.concepto)}</td><td>${pesos(l.importe)}</td></tr>`).join("");
  $("#cot-total").textContent = pesos(cot.total);
}

$("#pedido").addEventListener("change", (e) => {
  if (e.target.name?.startsWith("opciones.") || e.target.name === "urgente") recotizar();
});

$("#pedido").addEventListener("submit", async (e) => {
  e.preventDefault();
  const boton = $("#pagar");
  boton.disabled = true;
  boton.textContent = "Preparando el pago…";
  $("#error").hidden = true;
  try {
    const cuerpo = new FormData();
    cuerpo.append("datos", JSON.stringify(leerFormulario()));
    for (const f of $("#pedido").elements.adjuntos.files) cuerpo.append("adjuntos", f);
    const r = await fetch("/api/pedidos", { method: "POST", body: cuerpo });
    const res = await r.json();
    if (!r.ok) throw new Error(res.error);
    localStorage.setItem(`pedido-${res.id}`, res.clave);
    location.href = res.urlPago;
  } catch (err) {
    $("#error").textContent = err.message;
    $("#error").hidden = false;
    boton.disabled = false;
    boton.textContent = "Pagar y generar";
  }
});
