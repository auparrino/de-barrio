// Arma los .xlsx a partir de la especificación que devuelve Claude.
// Las fórmulas se guardan como fórmulas reales: el cálculo lo hace Excel o
// Google Sheets, no el modelo.
import ExcelJS from "exceljs";

const NUMERO = /^-?\d+(\.\d+)?$/;

export function valorCelda(texto) {
  if (texto === "" || texto == null) return null;
  const t = String(texto);
  if (t.startsWith("=")) return { formula: t.slice(1) };
  if (NUMERO.test(t)) return Number(t);
  return t;
}

/** Revisa que las fórmulas no apunten a hojas inexistentes. Devuelve la lista de problemas. */
export function revisarPlanilla(spec) {
  const hojas = new Set(spec.hojas.map((h) => h.nombre));
  const problemas = [];
  for (const h of spec.hojas) {
    h.filas.forEach((fila, i) =>
      fila.forEach((celda, j) => {
        if (!String(celda).startsWith("=")) return;
        for (const m of String(celda).matchAll(/'([^']+)'!|\b([A-Za-zÁÉÍÓÚáéíóúñÑ_][\wÁÉÍÓÚáéíóúñÑ]*)!/g)) {
          const ref = m[1] ?? m[2];
          if (!hojas.has(ref)) problemas.push(`${spec.archivo} › ${h.nombre} fila ${i + 1} col ${j + 1}: la hoja «${ref}» no existe`);
        }
      }));
  }
  return problemas;
}

export async function armarXlsx(spec) {
  const libro = new ExcelJS.Workbook();
  libro.creator = "De Barrio";
  for (const h of spec.hojas) {
    const hoja = libro.addWorksheet(h.nombre.slice(0, 31), { views: [{ state: "frozen", ySplit: 1 }] });
    h.filas.forEach((fila) => hoja.addRow(fila.map(valorCelda)));
    hoja.getRow(1).font = { bold: true };
    hoja.columns.forEach((col, i) => {
      const largo = Math.max(...h.filas.map((f) => String(f[i] ?? "").length), 8);
      col.width = Math.min(largo + 2, 45);
    });
  }
  return Buffer.from(await libro.xlsx.writeBuffer());
}
