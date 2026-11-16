// Arma docs/proyecto-claude/: lo que se carga UNA vez en un proyecto de claude.ai para trabajar los
// pedidos a mano (modo de prueba): las instrucciones del proyecto y las guías como conocimiento.
//   node tools/proyecto-claude.js
import { mkdirSync, rmSync, writeFileSync, copyFileSync, readdirSync } from "node:fs";
import { SISTEMA } from "../src/prompts.js";

const DIR = "docs/proyecto-claude";
rmSync(DIR, { recursive: true, force: true });
mkdirSync(`${DIR}/conocimiento`, { recursive: true });

const chat = `${SISTEMA}

Cómo trabajamos en este proyecto (pedidos que llegan por WhatsApp):
- Cada mensaje trae un pedido: el servicio, sus instrucciones, las tablas vigentes si hacen falta y las
  respuestas del cliente; las fotos o PDF del cliente vienen adjuntas.
- Las guías de producción están en el conocimiento del proyecto. El mensaje dice cuáles aplican: leelas y
  seguilas, completando su plantilla para este cliente antes de producir.
- Entregá cada archivo como archivo descargable, usando la herramienta de código: las planillas como
  .xlsx con fórmulas reales (openpyxl), los HTML y SVG como archivos, y LEEME.md.
- Donde las instrucciones hablan de {{QR:...}} o {{FOTO:n}}, generá el QR con código (librería qrcode) y
  poné las fotos del cliente dentro del HTML (base64).
- Las cuentas (precio por unidad, precio sin impuestos, descuentos) hacelas con código, nunca de cabeza.
`;
writeFileSync(`${DIR}/instrucciones-del-proyecto.md`, chat);
for (const f of readdirSync("data/guias").filter((f) => f.endsWith(".md"))) {
  copyFileSync(`data/guias/${f}`, `${DIR}/conocimiento/${f}`);
}
writeFileSync(`${DIR}/LEEME.md`, `# Proyecto de Claude para los pedidos de De Barrio

Mientras el sitio funciona en modo de prueba (GitHub Pages), los pedidos no van directo a Claude:
llegan por WhatsApp con el prompt armado. Para trabajarlos:

1. En claude.ai, creá un proyecto llamado «De Barrio».
2. En «Instrucciones del proyecto», pegá el contenido de \`instrucciones-del-proyecto.md\`.
3. En «Conocimiento», subí los archivos de \`conocimiento/\` (las guías de producción).
4. Por cada pedido: abrí un chat nuevo en el proyecto, pegá el bloque «PROMPT PARA CLAUDE» del
   WhatsApp y adjuntá las fotos o PDF que mandó el cliente.

Este paquete se regenera con \`node tools/proyecto-claude.js\` cuando cambian las guías o el prompt.
`);
console.log(`${DIR} listo`);
