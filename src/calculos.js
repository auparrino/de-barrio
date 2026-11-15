// Cuentas que hace el código y no el modelo. Claude solo extrae los datos
// (producto, precio, contenido); acá se calcula.

const A_BASE = { g: ["kg", 1000], kg: ["kg", 1], ml: ["l", 1000], cc: ["l", 1000], cm3: ["l", 1000], l: ["l", 1], lt: ["l", 1], m: ["m", 1], cm: ["m", 100], u: ["unidad", 1], unidad: ["unidad", 1], unidades: ["unidad", 1] };

export const pesos = (n) => "$ " + Math.round(n).toLocaleString("es-AR");

/**
 * Precio por unidad de medida según Res. 4/2025: por kg / l / m, y cada 10 g o 10 ml
 * para presentaciones de hasta 50 g o 50 ml.
 */
export function precioPorUnidad(precio, contenido, unidad) {
  const u = String(unidad ?? "").toLowerCase().replace(/\.$/, "");
  const conv = A_BASE[u];
  if (!conv || !(precio > 0) || !(contenido > 0)) return null;
  const [base, factor] = conv;
  if ((u === "g" || u === "ml" || u === "cc" || u === "cm3") && contenido <= 50) {
    const unidad10 = u === "g" ? "10 g" : "10 ml";
    return { valor: Math.round((precio / contenido) * 10 * 100) / 100, por: unidad10 };
  }
  return { valor: Math.round((precio / (contenido / factor)) * 100) / 100, por: base };
}

/** Precio sin IVA (Res. 4/2025, art. 2 inc. c). Solo con la alícuota que dio el cliente; no contempla impuestos internos. */
export function precioSinImpuestos(precio, alicuotaIva) {
  if (!(precio > 0) || !(alicuotaIva > 0)) return null;
  return Math.round((precio / (1 + alicuotaIva / 100)) * 100) / 100;
}

export function precioPromo(precioNormal, descuentoPct) {
  if (!(precioNormal > 0) || !(descuentoPct > 0) || descuentoPct >= 100) return null;
  return Math.round(precioNormal * (1 - descuentoPct / 100));
}

// Esquemas de extracción (salida estructurada) y cálculo para cada tipo.
export const EXTRACCIONES = {
  precio_por_unidad: {
    instruccion: "Extraé cada producto con su precio final, su contenido neto y la alícuota de IVA si el cliente la indicó. Si el contenido no figura claramente, dejá contenido en 0 y unidad vacía; si no indicó la alícuota, poné 0. No calcules nada.",
    esquema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              producto: { type: "string" },
              precio: { type: "number", description: "Precio final en pesos, sin separadores de miles" },
              contenido: { type: "number", description: "Contenido neto, por ejemplo 500" },
              unidad: { type: "string", enum: ["g", "kg", "ml", "l", "m", "cm", "unidad", ""] },
              alicuota_iva: { type: "number", description: "Alícuota de IVA del producto SOLO si el cliente la indicó (21, 10.5, 27, 0); si no la dijo, 0" },
            },
            required: ["producto", "precio", "contenido", "unidad", "alicuota_iva"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
    calcular: ({ items }) =>
      items.map((i) => {
        const r = precioPorUnidad(i.precio, i.contenido, i.unidad);
        const sinImp = precioSinImpuestos(i.precio, i.alicuota_iva);
        return {
          producto: i.producto,
          precio_final: pesos(i.precio),
          precio_por_unidad: r ? `${pesos(r.valor)} por ${r.por}` : null,
          precio_sin_impuestos_nacionales: sinImp ? pesos(sinImp) : null,
        };
      }),
  },
  precio_promo: {
    instruccion: "Extraé cada producto en promoción con su precio normal y el porcentaje de descuento. Si la promo no es un porcentaje (por ejemplo 2x1), poné descuento_pct en 0. No calcules nada.",
    esquema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              producto: { type: "string" },
              precio_normal: { type: "number" },
              descuento_pct: { type: "number" },
            },
            required: ["producto", "precio_normal", "descuento_pct"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
    calcular: ({ items }) =>
      items.map((i) => {
        const p = precioPromo(i.precio_normal, i.descuento_pct);
        return { producto: i.producto, precio_normal: pesos(i.precio_normal), descuento: `${i.descuento_pct}%`, precio_promo: p ? pesos(p) : null };
      }),
  },
};
