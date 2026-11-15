// Guarda pedidos y entregas en disco (data/pedidos/<id>/). Simple a propósito:
// para muchos pedidos por día conviene pasar a una base de datos.
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, normalize, dirname, sep } from "node:path";
import { randomBytes } from "node:crypto";

const RAIZ = process.env.DATA_DIR || new URL("../data/pedidos/", import.meta.url).pathname;

const carpeta = (id) => {
  if (!/^[a-z0-9]{12}$/.test(id)) throw new Error("id inválido");
  return join(RAIZ, id);
};

export function crearPedido(datos) {
  const id = randomBytes(6).toString("hex");
  const pedido = {
    id,
    clave: randomBytes(16).toString("hex"), // da acceso al cliente a su pedido
    estado: "cotizado", // cotizado -> pagado -> generando -> listo | error
    creado: new Date().toISOString(),
    ...datos,
  };
  mkdirSync(carpeta(id), { recursive: true });
  guardar(pedido);
  return pedido;
}

export function leerPedido(id) {
  let dir;
  try { dir = carpeta(id); } catch { return null; }
  const archivo = join(dir, "pedido.json");
  if (!existsSync(archivo)) return null;
  return JSON.parse(readFileSync(archivo, "utf8"));
}

export function guardar(pedido) {
  pedido.actualizado = new Date().toISOString();
  writeFileSync(join(carpeta(pedido.id), "pedido.json"), JSON.stringify(pedido, null, 2));
}

export function actualizar(id, cambios) {
  const pedido = leerPedido(id);
  if (!pedido) throw new Error(`No existe el pedido ${id}`);
  Object.assign(pedido, cambios);
  guardar(pedido);
  return pedido;
}

/** Evita que una ruta generada por el modelo escape de la carpeta de entrega. */
export function rutaSegura(base, ruta) {
  const limpia = normalize(ruta).replace(/^([/\\])+/, "");
  if (limpia.startsWith("..") || limpia.includes(`..${sep}`) || limpia === "") return null;
  return join(base, limpia);
}

export function guardarEntrega(id, archivos) {
  const base = join(carpeta(id), "entrega");
  const guardados = [];
  for (const a of archivos) {
    const destino = rutaSegura(base, a.ruta);
    if (!destino) continue;
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, a.contenido);
    guardados.push(destino.slice(base.length + 1).split(sep).join("/"));
  }
  return guardados;
}

export function rutaArchivoEntrega(id, ruta) {
  const base = join(carpeta(id), "entrega");
  const destino = rutaSegura(base, ruta);
  return destino && existsSync(destino) && statSync(destino).isFile() ? destino : null;
}

export function listarPedidos() {
  if (!existsSync(RAIZ)) return [];
  return readdirSync(RAIZ).map(leerPedido).filter(Boolean);
}

// Las fotos van aparte para no inflar pedido.json.
export function guardarFotos(id, fotos) {
  writeFileSync(join(carpeta(id), "fotos.json"), JSON.stringify(fotos));
}

export function leerFotos(id) {
  const archivo = join(carpeta(id), "fotos.json");
  return existsSync(archivo) ? JSON.parse(readFileSync(archivo, "utf8")) : [];
}
