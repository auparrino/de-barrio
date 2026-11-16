---
servicios: [margen, cobros, caja, stock, fiado, costo_laboral, luz_alquiler, encontrar]
fuente: "Planillas que un comerciante de barrio pueda usar solo", investigación web (Panko, ICAEW, FAST, ayudas de Google y Microsoft, README de exceljs) y lectura de src/planillas.js, noviembre de 2026
---

# Guía: planillas que el dueño del negocio pueda usar solo

Una planilla hecha por IA falla de formas previsibles cuando la abre un almacenero en el celular: diez
columnas para deslizar de costado, fórmulas que terminan en la fila 5, `#¡DIV/0!` en las filas vacías,
porcentajes que se ven como 0,3333, fechas como texto, celdas combinadas y nada que diga dónde se
escribe. La
investigación sobre errores (Panko) muestra que entre el 1 % y el 5 % de las fórmulas tienen errores
incluso cuando las hacen expertos, y que en auditorías de campo casi todas las planillas grandes tienen
alguno. La defensa no es más ingenio: es estructura simple, entradas separadas de cálculos y fórmulas
cortas que no se rompen con celdas vacías.

## Principios

1. **Una pregunta, una respuesta visible.** Cada planilla contesta algo concreto («¿a cuánto vendo?»,
   «¿cuánto me debe cada uno?»). La respuesta está en una celda con nombre claro, no escondida.
2. **Lo que se escribe, separado de lo que se calcula.** Las columnas de entrada van a la izquierda; las
   calculadas a la derecha y su encabezado termina en «(se calcula)». Los datos fijos (porcentaje de
   gastos, tope de fiado, IVA) van en una hoja de ajustes, una vez, nunca escritos dentro de una fórmula
   (ICAEW, FAST).
3. **Una fila por cosa, una fila de encabezado.** Un producto, un movimiento, un cliente por fila. Sin
   subtotales en el medio, sin filas en blanco, sin celdas combinadas.
4. **La planilla ya está armada para crecer.** Las fórmulas vienen copiadas en todas las filas vacías;
   el dueño nunca arrastra una fórmula.
5. **Vacío se ve vacío.** Una fila sin datos muestra celdas vacías, no ceros ni errores.
6. **Pocas hojas, nombres llanos.** De dos a cuatro hojas: «Cómo usar», una o dos de datos y «Resumen».
7. **Funciones viejas y aburridas.** Solo las que andan igual en Excel 2016, Excel 365 y Google Sheets.
8. **Los datos son del cliente.** Se cargan los productos, clientes y montos que mandó; no se inventan
   filas de ejemplo con números ficticios.

## Estrategias por capa

### Estructura de hojas

- Orden fijo: **Cómo usar** (primera, para que sea lo que se abre), hojas de datos, **Ajustes** si hace
  falta, **Resumen** al final.
- Nombres de hoja cortos, en castellano llano, sin `[]:*?/\` ni signos raros: «Productos», «Ventas»,
  «Clientes», «Gastos fijos». Hasta 31 caracteres. Si llevan espacio, en las fórmulas van entre
  comillas simples: `='Gastos fijos'!B2`.
- La hoja Ajustes es una tabla de tres columnas: `Dato | Valor | Para qué sirve`, un dato por fila. Las
  fórmulas lo toman con referencia absoluta: `Ajustes!$B$2`.
- Los totales van en Resumen, no en la última fila de la hoja de datos (si el dueño agrega filas abajo,
  el total queda en el medio y deja afuera lo nuevo).

### Entrada de datos

- Encabezados con la unidad: `Costo ($)`, `Margen (%)`, `Consumo (kWh por mes)`, `Horas por semana`.
  Máximo unas 22 letras; el ancho de la columna se calcula con el texto más largo.
- La primera columna es la que identifica la fila (producto, cliente, fecha) porque es la que se ve en
  el celular al deslizar.
- En hojas de entrada, cuatro a seis columnas para escribir como máximo; lo demás, calculado a la derecha.
- Sin listas desplegables disponibles todavía: si una columna acepta pocas opciones (medio de pago,
  tipo de movimiento), listarlas en el encabezado o en «Cómo usar» y hacer las fórmulas tolerantes a
  mayúsculas (SUMIFS y COUNTIFS no distinguen mayúsculas, sirve). Usar palabras cortas y únicas:
  `Venta`, `Gasto`, `Retiro`; `Efectivo`, `QR`, `Débito`, `Crédito`, `Transferencia`.
- Fechas: el dueño las escribe con barras (`16/11/2026`) y Sheets o Excel en español las reconocen como
  fecha. El generador no puede escribir fechas reales hoy: no precargar fechas como texto.
- Teléfonos, CUIT y códigos: el generador convierte en número todo lo que son solo dígitos (se pierde el
  0 inicial y un código de barras de 13 dígitos se ve como 7,79E+12). Escribirlos con un espacio o guion:
  `11 2345-6789`, `20-12345678-9`.

### Fórmulas

- Cada fórmula hace una sola cosa y tiene menos de unos 80 caracteres. Si hace falta más, una columna
  auxiliar con encabezado claro.
- Siempre protegida contra vacío: `=IF(B2="","",ROUND((C2-B2)/C2*100,1))`. Contra división por cero:
  `=IF(OR(B2="",C2=0),"",...)`. IFERROR solo alrededor de búsquedas, con un mensaje:
  `=IFERROR(VLOOKUP(A2,Productos!A:C,3,FALSE),"no está en Productos")`. No envolver todo en IFERROR:
  esconde errores de verdad.
- Las fórmulas por fila se escriben en todas las filas preparadas (de la 2 hasta la última), con el
  número de fila correcto en cada una.
- Referencias a columna entera (`Ventas!D:D`) solo desde otra hoja; nunca en la misma columna o fila
  donde está el resultado (referencia circular). SUM y SUMIFS ignoran el texto del encabezado.
- Alertas en palabras, porque no hay colores condicionales: `=IF(B2="","",IF(C2<=D2,"PEDIR","ok"))`,
  `"PASÓ EL TOPE"`, `"REMARCAR"`. Sin signos de exclamación dentro de la fórmula (el revisor del
  generador confunde `algo!` con el nombre de una hoja).
- Redondear lo que se muestra: plata con `ROUND(x,0)`; porcentajes como número de 0 a 100 con
  `ROUND(x*100,1)` y `(%)` en el encabezado, porque hoy no hay formato de porcentaje.
- Fechas en cuentas: días entre fechas con resta (`=IF(B2="","",TODAY()-B2)`), mes con `MONTH(B2)`. No
  usar `TEXT(B2,"dd/mm/yyyy")`: el código de formato cambia según el idioma («aaaa» en Excel en español).

### Formato y legibilidad

- Lo único que pone el generador hoy: fila 1 en negrita y congelada, ancho de columnas por largo del
  texto (tope 45). Todo lo demás se resuelve con palabras: encabezados explícitos, «(se calcula)»,
  alertas en mayúsculas.
- En «Cómo usar», una instrucción por fila, frases de menos de 90 caracteres, en columnas `Paso | Qué
  hacer`. No hay ajuste de texto: una frase larga se corta.

### Celular

- Google Sheets en Android y iPhone edita .xlsx, pero sin macros ni protección. Diseñar para tocar una
  celda y escribir: columnas de entrada primero, pocas, con nombres que se entiendan sin ver el resto.
- La respuesta principal arriba de todo en Resumen (filas 2 a 6), para no tener que buscarla.
- Avisar en «Cómo usar» que se abre con la app Google Sheets o Excel, no con la vista previa de WhatsApp
  o de Drive (puede no mostrar los resultados de las fórmulas, porque el archivo los trae sin calcular).
- Al escribir números: sin puntos de miles ni signo $, con coma para decimales si el teléfono está en
  español (`1500` o `1500,50`). Ponerlo en «Cómo usar».

### Compatibilidad Excel / Google Sheets

- Las fórmulas se guardan en inglés con coma (`=SUMIFS(D:D,B:B,"Venta")`); Excel y Sheets en
  español-Argentina las muestran como `=SUMAR.SI.CONJUNTO(D:D;B:B;"Venta")` solos. En el archivo nunca
  van en castellano ni con punto y coma, y los decimales dentro de una fórmula van con punto: `0.21`.
- Funciones seguras: SUM, SUMIF, SUMIFS, COUNT, COUNTA, COUNTIF, COUNTIFS, AVERAGE, AVERAGEIFS, IF, AND,
  OR, NOT, IFERROR, ROUND, ROUNDUP, ROUNDDOWN, MAX, MIN, ABS, VLOOKUP con FALSE, INDEX, MATCH con 0,
  TODAY, DATE, DAY, MONTH, YEAR, EOMONTH, WEEKDAY.
- Evitar: XLOOKUP, IFS, SWITCH, MAXIFS, MINIFS, TEXTJOIN, CONCAT, FILTER, SORT, UNIQUE, SEQUENCE, LET,
  LAMBDA. Son funciones nuevas que en el archivo necesitan el prefijo `_xlfn.` (el generador no lo pone,
  y Excel puede mostrar `#¿NOMBRE?`), o desbordan en rangos dinámicos, o no existen en Excel 2016, que
  sigue siendo común. En su lugar: IF anidado (máximo tres niveles), INDEX/MATCH, columna auxiliar.
- Prohibidas: funciones solo de Sheets (ARRAYFORMULA, QUERY, GOOGLEFINANCE, IMPORTRANGE), INDIRECT y
  OFFSET (frágiles y volátiles), fórmulas matriciales, referencias a otros archivos, nombres definidos y
  tablas estructuradas (el generador no los crea).

## Forma recomendada por servicio

| Servicio | Hojas | Clave |
|---|---|---|
| margen | Cómo usar, Productos, Ajustes, Resumen | Margen (%), precio sugerido y «REMARCAR» calculados |
| cobros | Cómo usar, Medios, Resumen | Una fila por medio; costo ($ por mes) calculado |
| caja | Cómo usar, Movimientos, Cierre | Fecha, Tipo, Medio, Monto ($), Detalle; Cierre por día y medio con SUMIFS |
| stock | Cómo usar, Productos, Proveedores | «PEDIR»; un precio por fila producto-proveedor |
| fiado | Cómo usar, Movimientos, Clientes | Fiado ($) y Pago ($) separados; saldo con SUMIFS |
| costo_laboral | Cómo usar, Personas, Turnos, Resumen | Convenio en Ajustes con fuente; franjas en filas |
| luz_alquiler | Cómo usar, Equipos, Alquiler, Resumen | kWh por equipo; 12 filas de meses |
| encontrar | Cómo usar, Catálogo / Pedidos | Fecha, Cliente, Teléfono, Producto, Cantidad, Total ($), Estado |

## Plantilla (se completa antes de escribir las filas)

**A. Para qué:** pregunta que contesta; quién la llena (dueño, empleado) y cada cuánto; en qué la abre
(celular o compu); qué datos reales mandó el cliente y cuántas filas hay que preparar (los productos o
clientes que mandó más un margen de al menos 50 filas, o lo que dice el servicio).

**B. Hojas:** nombre de cada una (máximo cuatro) y para qué es.

**C. Columnas:** por hoja, cada columna con encabezado y unidad; si se escribe o se calcula; tipo (texto,
número, plata, porcentaje 0-100, fecha); fórmula de la fila 2.

**D. Ajustes:** cada dato fijo, su valor, de dónde sale (cliente, `<tablas_vigentes>`, `<calculos>`).

**E. Resumen:** cada pregunta del dueño y la celda que la contesta; alertas y su texto exacto.

**F. Cómo usar:** los pasos en orden, qué columnas no se tocan, cómo agregar filas, cómo escribir
números y fechas, qué significa cada alerta.

## Prohibidos por defecto y qué usar en su lugar

| No | En su lugar |
|---|---|
| Celdas combinadas, títulos arriba de la tabla, dos filas de encabezado | Una sola fila 1 de encabezado; el título va en «Cómo usar» |
| Fórmulas solo en las filas con datos | Fórmulas en todas las filas preparadas, con guarda de vacío |
| `#¡DIV/0!`, `#N/A` o `0` en filas vacías | `IF(B2="","",…)`, `IF(C2=0,"",…)`, IFERROR con mensaje solo en búsquedas |
| Números fijos dentro de fórmulas (`*1.21`, `*0.3`) | Valor en Ajustes y `Ajustes!$B$2` |
| `0.35` mostrado como margen | `ROUND(x*100,1)` y encabezado `Margen (%)` |
| Montos como texto (`"$1.500"`, `"1.500,00"`, `"21%"`) | `1500`, `1500.5`, `21` con la unidad en el encabezado |
| Fechas precargadas como texto | Columna vacía para que el dueño escriba la fecha |
| Teléfonos o códigos solo con dígitos | Con espacio o guion: `11 2345-6789` |
| XLOOKUP, IFS, MAXIFS, TEXTJOIN, FILTER, LET, LAMBDA | IF anidado, INDEX/MATCH, SUMIFS, columna auxiliar |
| Fórmulas en castellano o con `;` | Sintaxis inglesa con coma |
| Una columna por mes o por proveedor | Una fila por mes o por proveedor |
| Total en la última fila de la hoja de datos | Total en Resumen con referencia a columna entera de otra hoja |
| Ocho hojas, nombres como «Hoja1», «Calc_aux», «DB» | Dos a cuatro hojas con nombres llanos |
| Filas de ejemplo inventadas en hojas de datos | Datos reales del cliente; los ejemplos van como texto en «Cómo usar» |
| Confiar en colores o protección para avisar qué no tocar | «(se calcula)» en el encabezado y explicarlo en «Cómo usar» |

## Checklist antes de entregar

- ¿La primera hoja es «Cómo usar» y alcanza para usar la planilla sin preguntar nada?
- ¿Cada hoja tiene una sola fila de encabezado, con unidades, y ninguna fila vacía en el medio?
- ¿Todas las fórmulas por fila están copiadas hasta la última fila preparada, con la fila correcta?
- Probá mentalmente una fila vacía, una con costo 0 y una con texto donde va un número: ¿qué muestra?
- ¿Cero números fijos dentro de fórmulas? ¿Todo dato fijo en Ajustes con su origen?
- ¿Cero funciones de la lista a evitar? ¿Todas las referencias a hojas usan nombres que existen?
- ¿Ningún monto, porcentaje, teléfono o fecha quedó escrito como texto por error?
- ¿Las columnas de entrada entran en la pantalla de un celular sin deslizar de costado?
- ¿La respuesta principal está en Resumen, arriba, con una etiqueta que la explica?

## Mejoras sugeridas al generador (para desarrollo)

Hoy `src/planillas.js` solo escribe valores y fórmulas, negrita y congelado en la fila 1 y anchos.
exceljs ya permite más; propuesta de extensión del esquema: `hoja.columnas: [{ tipo, entrada, opciones }]`.

1. **Tipos de columna con formato numérico** (`cell.numFmt`): plata `"$" #,##0`, porcentaje `0.0%`,
   fecha `dd/mm/yyyy` (y escribir fechas reales a partir de `AAAA-MM-DD`), texto `@` para teléfonos,
   CUIT y códigos, que hoy se convierten en número.
2. **Listas desplegables** (`dataValidation` tipo `list`) para medio de pago, tipo de movimiento, estado
   de pedido, aplicadas a las filas preparadas.
3. **Relleno de color en celdas de entrada** (amarillo claro) y gris en calculadas, más una leyenda en
   «Cómo usar». La protección de hoja sirve solo en Excel: Google Sheets la descarta al abrir un .xlsx.
4. Otras: congelar también la columna A (`xSplit: 1`); ajuste de texto en «Cómo usar»;
   `calcProperties.fullCalcOnLoad = true`; ancho por encabezado y datos, no por el texto de la fórmula;
   y que `revisarPlanilla` avise de funciones de la lista a evitar y no confunda `texto!` entre comillas
   con una hoja.

## Instrucciones para el modelo

<spreadsheet_direction>
You tend to build spreadsheets for analysts. The user is a neighborhood shop owner, often on a phone.
1. Before writing rows, fill the template (purpose, sheets, columns with unit/type/input-or-calculated
   and the row-2 formula, settings with their source, summary cells, "Cómo usar" steps). Use only the
   client's data and the provided tables; never invent example rows.
2. Sheets: "Cómo usar" first, then 1-2 data sheets, optional "Ajustes" (Dato | Valor | Para qué sirve),
   and "Resumen". At most four sheets, plain Spanish names.
3. Exactly one header row per sheet, with units in the header. No merged cells, no titles above the
   table, no blank rows, no subtotals inside data. Input columns first (4-6 max); calculated columns
   after, with headers ending in "(se calcula)". One record per row; months and suppliers go in rows.
4. Pre-fill every per-row formula in every prepared row (the client's rows plus at least 50 empty rows),
   adjusting the row number. Guard every formula: IF(B2="","",...), IF(C2=0,"",...); use IFERROR only
   around lookups, with a Spanish message. Never hard-code constants; reference Ajustes!$B$n.
5. Cell values: numbers with no thousands separator and a dot decimal ("1500.5"); never "$", "%" or
   "1.500,00". Percentages as ROUND(x*100,1) with "(%)" in the header. Money with ROUND(x,0). Do not
   prefill dates; leave date columns for the owner. Write phones, CUIT and codes with a space or dash.
6. Formulas in English syntax with commas. Allowed: SUM, SUMIF(S), COUNT, COUNTA, COUNTIF(S), AVERAGE,
   AVERAGEIFS, IF, AND, OR, NOT, IFERROR, ROUND/ROUNDUP/ROUNDDOWN, MAX, MIN, ABS, VLOOKUP(...,FALSE),
   INDEX, MATCH(...,0), TODAY, DATE, DAY, MONTH, YEAR, EOMONTH, WEEKDAY. Never XLOOKUP, IFS, SWITCH,
   MAXIFS, MINIFS, TEXTJOIN, CONCAT, FILTER, SORT, UNIQUE, SEQUENCE, LET, LAMBDA, TEXT with date
   codes, INDIRECT, OFFSET, ARRAYFORMULA, QUERY, array formulas, named ranges or other files. Keep each
   formula under about 80 characters; use a helper column instead. No "!" inside quoted text.
7. Whole-column references only from another sheet; totals live in Resumen, main answer in rows 2-6.
   Alerts as short uppercase words ("PEDIR", "PASÓ EL TOPE", "REMARCAR").
8. "Cómo usar": Paso | Qué hacer, one short sentence per row: which columns to fill, that "(se
   calcula)" columns are not touched, how to type numbers (no dots, comma decimal) and dates (dd/mm/aaaa),
   how to add rows, what each alert means, open it in the Google Sheets or Excel app.
9. Self-check against the prohibited table and the checklist; report anything doubtful in LEEME.md under
   "Revisá esto".
</spreadsheet_direction>

## Fuentes

- Panko, R. «What We Don't Know About Spreadsheet Errors Today» (2016): https://arxiv.org/pdf/1602.02601
- Panko, R. «Spreadsheet Errors: What We Know. What We Think We Can Do»: https://arxiv.org/pdf/0802.3457
- Revisiting the Panko-Halverson Taxonomy of Spreadsheet Errors: https://arxiv.org/pdf/0809.3613
- EuSpRIG, «Spreadsheets - the Good, the Bad and the Downright Ugly»: https://arxiv.org/abs/1009.5705
- ICAEW, Twenty principles for good spreadsheet practice (edición 2024): https://www.icaew.com/technical/technology/excel-community/20-principles-for-good-spreadsheet-practice-2024-edition
- ICAEW, Financial Modelling Code: https://icaew.com/-/media/corporate/files/technical/technology/excel/financial-modelling-code.ashx
- FAST Standard 02c (2019): https://www.stl-training.co.uk/download/forum/40296_FAST-Standard-02c-July-2019.pdf
- FAST Standard, los 4 principios: https://practicepro.accountingcpd.net/FAST_Standard%3A_The_4_Basic_Principles
- Separación de entradas y cálculos (GoSkills): https://goskills.com/Course/Financial-Modeling-Basics/Lesson/1609/Separation-of-Inputs--Calculations
- Guía de planillas, Universidad de South Australia: https://lo.unisa.edu.au/pluginfile.php/396811/mod_book/chapter/32967/2013/Spreadsheet_Guidelines.pdf
- Google, usar Sheets para editar archivos de Excel (protección no soportada): https://support.google.com/docs/answer/6055139
- Google Workspace Updates, LAMBDA y XLOOKUP en Sheets: https://workspaceupdates.googleblog.com/2023/01/google-sheets-powerful-functions-advanced-analysis.html
- ICAEW, Named functions, LAMBDAs and XLOOKUP in Google Sheets: https://www.icaew.com/technical/technology/excel-community/excel-community-articles/2022/named-functions-lambdas-and-xlookup-in-google-sheets
- Microsoft, prefijo _xlfn y funciones nuevas: https://learn.microsoft.com/en-us/answers/questions/5646692/an-xlfn-prefix-is-displayed-in-front-of-a-function
- Separadores por configuración regional en Sheets: https://bettersheets.co/explained/locale-separators
- Microsoft, convertir fechas guardadas como texto: https://support.microsoft.com/en-us/excel/convert-dates-stored-as-text-to-dates
- Microsoft, sistema de fechas de Excel: https://support.microsoft.com/en-US/excel/change-the-date-system-format-or-two-digit-year-interpretation
- Edición nativa de Office en Sheets para Android: https://www.neowin.net/news/google-docs-sheets-for-android-gain-native-support-for-editing-microsoft-office-files/
- exceljs README (Data Validations, Styles/numFmt, Sheet Protection, Worksheet Views): https://github.com/exceljs/exceljs
