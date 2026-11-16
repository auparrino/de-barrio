---
servicios: [margen, stock, caja, fiado, costo_laboral]
fuente: "Métodos estándar de gestión para comercios de barrio (margen, stock, caja, fiado, costo laboral), investigación con fuentes públicas, noviembre de 2026"
---

# Guía: métodos de gestión para planillas de comercios de barrio

Una planilla de gestión hecha por IA falla de formas previsibles: confunde margen con recargo, mezcla
costos con y sin IVA, escribe números dentro de las fórmulas, suma los retiros del dueño como gastos,
inventa precios de proveedores y suma al costo del empleador los aportes que salen del recibo. Esta guía
fija el método de cada cálculo. Lo que no se pueda calcular con los datos del cliente queda vacío y
anotado, nunca estimado en silencio.

## Principios

1. **Un parámetro, una celda.** Tasas, márgenes objetivo, días de seguridad, topes y porcentajes viven en
   una hoja de parámetros con etiqueta; las fórmulas los referencian con `$`. Nada de `*1.21` ni `/0.7`.
2. **Fórmulas en inglés, separador coma.** En el xlsx se guardan `IF`, `SUMIFS`, `ROUNDUP`, `IFERROR`;
   Excel en español las muestra traducidas. Nunca escribir `SI(` ni `;` en el archivo (aunque el catálogo
   lo describa así). Evitar `LET`, `LAMBDA`, `XLOOKUP` y matrices dinámicas: usar `INDEX/MATCH`,
   `SUMIFS`, `SUMPRODUCT`, `MAXIFS` (Excel 2019+, Google Sheets y LibreOffice).
3. **Solo datos del cliente.** Si falta un costo, un precio de proveedor o un valor de tabla, la celda
   queda vacía, la fórmula dependiente devuelve `""` con `IFERROR`/`IF(…="","",…)` y el faltante va a
   LEEME.md.
4. **Base fiscal explícita.** Cada planilla de precios declara si el comercio es monotributista o
   responsable inscripto, y todo el cálculo usa esa base.
5. **Precio a costo de reposición**, no a lo que se pagó.
6. **Lo de la caja no es lo del dueño.** Ventas, gastos, retiros y aportes son tipos distintos.
7. **Trato digno y datos cuidados.** Nada expone a un deudor ante terceros.
8. **Tablas vigentes, no memoria:** `escala_comercio`, `comisiones`, `normativa_precios`.

## 1. Margen, precio sugerido y remarcación (servicio margen)

**Definiciones.** Margen sobre venta `m = (P − C) / P`. Recargo (markup) `k = (P − C) / C`.
Conversión: `m = k / (1 + k)` y `k = m / (1 − m)`. Precio desde margen objetivo: `P = C / (1 − m)`.
Un 30 % de recargo es un 23,1 % de margen; para ganar 30 % de margen hay que recargar 42,9 %.

**Costos variables de venta.** Comisión del medio de cobro (tabla `comisiones`, más el IVA sobre la
comisión que indica esa tabla) e Ingresos Brutos si el cliente lo paga como porcentaje de ventas
(si es monotributo unificado, va como fijo). Con `v` = suma de esos porcentajes:
`P = C / (1 − m − v)`. Si `m + v >= 1` la fórmula devuelve error: mostrar "revisar".

**IVA.**
- *Monotributista:* no computa crédito fiscal; el costo es el total de la factura, IVA incluido, y el
  precio sugerido ya es el precio final.
- *Responsable inscripto:* el costo es el neto sin IVA (el IVA de compra se recupera). Se calcula el precio
  neto y después el final: `P_final = P_neto * (1 + alícuota)`. La alícuota va por producto (21 %, 10,5 %
  en algunos alimentos: preguntar o marcar [verificar alícuota]).
- En ambos casos el cartel muestra el precio final y el precio sin impuestos nacionales según la tabla
  `normativa_precios`.

**Redondeo.** Siempre hacia arriba a un múltiplo de la familia (parámetro `Redondeo`, por ejemplo 10, 50
o 100): `=CEILING(P, Familias!$C$2)`. Nunca `ROUND` (puede bajar el margen) ni redondear el costo.

**Fórmulas tipo (hoja Productos, fila 2; C costo, D precio actual, B familia):**
- Margen %: `=IF(OR(C2="",D2=""),"",(D2-C2)/D2)`; margen $: `=IF(OR(C2="",D2=""),"",D2-C2)`.
- Margen objetivo: `=INDEX(Familias!$B:$B,MATCH(B2,Familias!$A:$A,0))`.
- Sugerido: `=IF(C2="","",CEILING(C2/(1-G2-Parametros!$B$3),INDEX(Familias!$C:$C,MATCH(B2,Familias!$A:$A,0))))`.
  Para RI, multiplicar por `(1+alícuota)` antes del `CEILING`.
- Diferencia con el actual: `=IF(H2="","",H2/D2-1)`.

**Ejemplo.** Factura de un producto: $1.000 + IVA 21 % = $1.210. Margen objetivo 30 %, cobro con QR
v = 1 %, redondeo 50.
- Monotributista: `1210/(1−0,30−0,01) = 1.753,6` → **$1.800**.
- RI: neto `1000/0,69 = 1.449,3`; final `×1,21 = 1.753,6` → **$1.800** (margen real sobre neto
  `(1800/1,21 − 1000)/(1800/1,21) = 32,8 %`).

**Remarcación.** Columna costo de reposición (último precio del proveedor) junto al costo anterior.
Regla: `=IF(C2="","",IF(ABS(Creposicion/Canterior-1)>=Parametros!$B$4,"REMARCAR",""))`, con umbral
editable (por ejemplo 3 %). Al remarcar se recalcula todo el stock existente, no solo lo que entra: si no,
lo vendido no alcanza para reponer. En diagnostico.md, la regla en una frase con el umbral.

**Errores comunes.** `C*(1+m)` creyendo que da margen m; olvidar la comisión; redondear para abajo.

## 2. Margen de contribución y punto de equilibrio (servicio margen)

**Margen de contribución** por producto o familia: `MC = P_neto − C − v·P_neto`; en %: `MC% = MC / P_neto`.
**Costos fijos (CF):** los del mes que no dependen de lo vendido (alquiler, luz, sueldos con cargas,
contador, internet, cuota fija del monotributo). Agregar una línea separada "sueldo del dueño" con el
retiro que necesita: el equilibrio se muestra **sin** y **con** esa línea.

**Multiproducto:** se pondera por la participación de cada familia en las ventas en pesos, no por
unidades ni por promedio simple.
`MC%_pond = SUMPRODUCT(ventas_familia, MC%_familia) / SUM(ventas_familia)` y
`Venta de equilibrio = CF / MC%_pond`. En Excel: `='Gastos fijos'!B20/SUMPRODUCT(Equilibrio!B2:B6,Equilibrio!C2:C6)*SUM(Equilibrio!B2:B6)`
(o calcular el ponderado en una celda aparte). Sin ventas por familia, usar la mezcla de la lista y anotar el
supuesto. Margen de seguridad:
`(venta actual − venta de equilibrio) / venta actual`.

**Ejemplo.** CF $2.000.000 (+ sueldo dueño $1.200.000). Mezcla: almacén 60 % de las ventas con MC 25 %,
fiambrería 25 % con MC 35 %, bebidas 15 % con MC 20 %. Ponderado `0,15 + 0,0875 + 0,03 = 26,75 %`.
Equilibrio sin dueño `2.000.000 / 0,2675 = $7.476.636`; con dueño `3.200.000 / 0,2675 = $11.962.617` al mes.

**Errores comunes.** Usar el margen del producto estrella; meter la mercadería en los costos fijos.

## 3. Costeo por receta / escandallo (opción recetas)

Por ingrediente: `rendimiento = peso neto útil / peso bruto` (1 − merma de limpieza o cocción).
`Cantidad bruta = cantidad neta de la receta / rendimiento`;
`costo de la línea = (precio de compra / cantidad comprada) * cantidad bruta`.
`Costo por unidad = SUM(costo de líneas) / unidades vendibles`, donde
`unidades vendibles = unidades que rinde * (1 − merma de producción)` (rotas, quemadas, degustación).
Precio con costo de materia prima objetivo `fc`: `P = costo por unidad / fc`, redondeado hacia arriba.
Envases como línea; energía como porcentaje parámetro marcado [estimado].

**Ejemplo (48 empanadas).** Carne: 2 kg netos, rendimiento 90 % → 2,222 kg × $9.000 = $20.000. Cebolla:
1 kg neto, rendimiento 85 % → 1,176 kg × $1.200 = $1.412. Tapas: 4 docenas × $2.500 = $10.000. Otros:
$1.500. Total $32.912. Merma de producción 4 % → 46 vendibles → **$715,5 por unidad**. Con fc 35 %:
`715,5/0,35 = 2.044` → **$2.100**.

**Errores comunes.** Peso bruto como neto; dividir por lo que rinde y no por lo vendible.

## 4. Stock mínimo, punto de pedido y compras (servicio stock)

**Definiciones (días corridos).** `venta diaria d = venta semanal / 7`. `L` = demora del proveedor en
días; `R` = días entre visitas o compras. `stock de seguridad SS = d * días de seguridad` (parámetro por
producto, por defecto 2 a 3 días; más si el proveedor falla). **Stock mínimo = SS.**
`Punto de pedido PP = d*L + SS`. `Stock máximo = d*(R + L) + SS`.
`Cantidad a pedir = CEILING(máximo − stock actual, bulto)`.
Columna PEDIR: `=IF(J2<=I2,CEILING(K2-J2,M2),"")` (J actual, I PP, K máximo, M bulto, 1 si no hay).

**Estadístico (solo con 8 o más semanas de ventas registradas):** `SS = Z * σd * √L`, con σd el desvío de
la venta diaria y Z 1,65 para 95 % de servicio: `=1.65*STDEV.S(rango)*SQRT(L)`. Sin historial, usar días de
cobertura y explicarlo: inventar σ es peor que no tenerlo.

**Ejemplo.** Yerba 1 kg: 35/semana → d = 5. L = 2, R = 7, 3 días de seguridad → SS = 15, PP = 25,
máximo = 60. Stock 22 ≤ 25 → pedir `60 − 22 = 38` → bulto de 10 → **40**. Estadístico con σd = 2:
`1,65 × 2 × √2 = 4,7` → 5.

**Stock desde Movimientos.** El stock actual no se tipea: se calcula.
`=SUMIFS(Movimientos!$D:$D,Movimientos!$B:$B,A2,Movimientos!$C:$C,"entrada")-SUMIFS(Movimientos!$D:$D,Movimientos!$B:$B,A2,Movimientos!$C:$C,"salida")`.
El conteo inicial se carga como entrada "conteo inicial"; las diferencias de conteo, como ajuste.

**ABC.** Valor = venta semanal × costo. Ordenar de mayor a menor y acumular %: A hasta 80 % del valor, B
hasta 95 %, C el resto. Contar A cada semana, B cada mes, C cada trimestre (práctica habitual, no norma).

**Perecederos.** Tope de pedido por vida útil:
`cantidad <= d * (días de vida útil − días de margen para vender)`; rotación FEFO (sale primero lo que
vence primero). Columna "vence".

**Comparación de proveedores.** Precio comparable por unidad de medida (`precio / contenido`), con la
misma base de IVA, descuentos y flete incluidos. Más barato: `=MIN(C2:E2)`; quién:
`=INDEX($C$1:$E$1,MATCH(MIN(C2:E2),C2:E2,0))`; diferencia `=MAX(C2:E2)/MIN(C2:E2)-1`. Solo precios que
dio el cliente; hoja vacía si no hay.

**Errores comunes.** Mezclar días corridos y hábiles; inventar la desviación; no redondear al bulto.

## 5. Caja diaria, arqueo, retiros y billeteras (servicio caja)

**Diario.** Importes siempre positivos; el signo sale del tipo:
`=IF(OR(C2="venta",C2="aporte"),E2,-E2)`. Tipos: venta, gasto, retiro del dueño, aporte, y
**traspaso** (efectivo depositado en el banco, retiro de Mercado Pago a efectivo: dos líneas, una
negativa en el medio de origen y una positiva en el de destino; no cuenta en ganancia). Si se agrega
traspaso, explicarlo en LEEME.md. Saldo acumulado por medio (columna por medio):
`=SUMIFS($F$2:F2,$D$2:D2,"Efectivo")`.

**Retiros vs gastos.** Todo lo que el dueño saca para su casa, incluso un gasto personal pagado con la
caja, es **retiro**. Gasto es solo lo del negocio. Ganancia de caja del mes = ventas − gastos (sin
retiros, sin aportes, sin traspasos). Es flujo, no resultado contable: si se compró más mercadería de
la que se vendió, sale menor.

**Arqueo (hoja Cierre).** Efectivo esperado
`= fondo inicial + ventas efectivo + aportes efectivo − gastos efectivo − retiros efectivo − traspasos salientes`.
Contado por denominación: `=SUMPRODUCT(B5:B14,C5:C14)` (valor × cantidad de billetes y monedas).
Diferencia `= contado − esperado`: positiva sobrante, negativa faltante. La diferencia se registra como
línea propia ("diferencia de caja"), nunca se corrige el diario para que cierre. Tolerancia como
parámetro; sobre ella, alerta. **Fondo de cambio:** monto fijo que queda para el día siguiente; el resto
se retira o deposita. El fondo no es venta.

**Ejemplo.** Fondo $50.000; ventas efectivo $380.000; flete $25.000; retiro $100.000. Esperado
`50.000 + 380.000 − 25.000 − 100.000 = $305.000`. Contado $302.500 → faltante $2.500. Quedan $50.000 de
fondo y se depositan $252.500.

**Billeteras y banco.** Por medio: `neto acreditado = bruto − comisión − IVA sobre comisión − retenciones`
(comisión según tabla `comisiones` y el plazo elegido). La venta se anota bruta; la comisión, como gasto
"comisiones". Conciliar cada semana planilla contra app o resumen; las diferencias típicas son dinero
a liberar, retenciones, contracargos y devoluciones: van en una línea "conciliación" con su explicación.

**Errores comunes.** Saldos que se rompen al insertar filas (usar rangos completos); contar el fondo
como venta.

## 6. Fiado (servicio fiado)

**Saldo:** `=SUMIFS(Movimientos!$D:$D,Movimientos!$B:$B,A2)-SUMIFS(Movimientos!$E:$E,Movimientos!$B:$B,A2)`.
**Días desde el último pago:**
`=IF(COUNTIFS(Movimientos!$B:$B,A2,Movimientos!$E:$E,">0")=0,TODAY()-MINIFS(Movimientos!$A:$A,Movimientos!$B:$B,A2),TODAY()-MAXIFS(Movimientos!$A:$A,Movimientos!$B:$B,A2,Movimientos!$E:$E,">0"))`.
**Estado** (precedencia: el peor gana):
`=IF(D2<=0,"OK",IF(D2>C2,"pasado de tope",IF(E2>30,"más de 30 días",IF(D2>=Parametros!$B$2*C2,"cerca del tope","OK"))))`,
con "cerca" = 80 % del tope (parámetro).

**Antigüedad (aging) por primero en entrar:** los pagos cancelan lo más viejo, así que el saldo es lo más
nuevo. Para cada cliente: `0–30 = MIN(saldo, cargos de los últimos 30 días)`;
`31–60 = MIN(saldo − tramo1, cargos de 31 a 60 días)`; `61–90` igual; `+90 = saldo − suma de tramos`.
Cargos 0–30: `=SUMIFS(Movimientos!$D:$D,Movimientos!$B:$B,A2,Movimientos!$A:$A,">"&TODAY()-30)`.
Resumen = suma de cada tramo.

**Ejemplo.** Tope $60.000. Cargos: 10/9 $20.000, 20/10 $25.000, 5/11 $15.000; pago 1/11 $22.000. Al
16/11: saldo $38.000 (63 % del tope); 0–30: `MIN(38.000; 25.000+15.000) = 38.000`. Estado: 15 días desde
el pago → OK.

**Topes.** Los fija el comerciante; sugerencia: cerca de lo que el cliente compra en una quincena, y total
en la calle no mayor a lo que se vende en X días (parámetro).

**Recargos.** Por defecto, el fiado **sin interés**. Cobrar interés o recargo lo convierte en crédito al
consumo: la Ley 24.240 art. 36 exige informar por escrito tasa efectiva anual y costo financiero total, bajo
pena de nulidad, y la Res. 4/2025 pide mostrar el precio de contado. Actualizar la deuda al precio del día
del pago es una forma de indexación: no proponerlo; si el cliente lo pide, [consultar con un abogado].

**Cobranza y trato digno (Ley 24.240 art. 8 bis).** Prohibido poner a alguien en situación vergonzante,
vejatoria o intimidatoria: nada de listas de deudores en el local, mensajes a familiares, vecinos o
grupos, amenazas, ni nombrar la deuda frente a otros clientes. Mensajes privados, en horario
razonable, con monto exacto y una salida. Escalón: recordatorio amable → monto y fecha → plan de pagos →
aviso de suspensión del fiado (sin amenazas).

**Datos (Ley 25.326).** Nombre, teléfono y deuda son datos personales: solo para la cuenta, con
consentimiento, sin compartirlos ni publicarlos; borrarlos si lo pide y la cuenta está saldada; planilla
con clave. El cartel habla de reglas, nunca de personas.

**Errores comunes.** Inventar montos ilegibles (va "Revisar = SI"); aging sin aplicar pagos.

## 7. Costo laboral y turnos (servicio costo_laboral)

**Fuente única.** Todo valor sale de la hoja Parámetros, copia de `escala_comercio` con su fecha. Si un
valor es `null` o `verificado` es false, la celda queda vacía con "[completar con contador]" y las fórmulas
se arman igual; no se completa con números de memoria ni de esta guía.

**Componentes (R = remunerativo):**
- Básico `B` por categoría; jornada parcial: `B * horas semanales / jornada_completa_horas_semana`.
- Antigüedad `= B * antiguedad_pct_por_anio/100 * años`.
- Presentismo `= (B + antigüedad) * presentismo_pct/100`.
- `R = B + antigüedad + presentismo`. Sumas no remunerativas (NR) con su propia antigüedad y
  presentismo, si la tabla las trae [verificar: las liquidaciones de 2026 las calculan así].
- Contribuciones = `R * contribuciones_seguridad_social`; obra social con la base de la tabla (en 2026
  incluye las NR [verificar]); ART = % + fijo; seguros de vida, INACAP y aportes fijos por persona (no se
  prorratean en jornada parcial).
- Provisión de aguinaldo `= R * aguinaldo_pct/100`, **más sus contribuciones**.
- Provisión de vacaciones: si la tabla trae `vacaciones_pct`, usarlo; si no, calcular en Parámetros
  `= días * (1/25 − 1/30) / 12` como % de R (arts. 150 y 155 LCT: 14 días hasta 5 años, 21, 28 y 35),
  marcado [calculado], más sus contribuciones.
- Los aportes del empleado (jubilación, obra social, sindicato, FAECYS) se descuentan del bruto: **no** se
  suman al costo. Si una contribución FAECYS o un seguro de retiro corre por el empleador, va como
  parámetro aparte [verificar con contador].
- `Costo mensual = R + NR + contribuciones + ART + fijos + provisiones`. `Costo por hora = costo
  mensual / (horas semanales * 52/12)`.

**Ejemplo con números de juguete (no son de la escala).** B = $1.000.000, 3 años, 1 %/año, presentismo
8,33 %: antigüedad $30.000; presentismo `1.030.000/12 = $85.833`; R = $1.115.833; aguinaldo
`$92.986/mes`; vacaciones 14 días `1.115.833 × 14 × (1/25−1/30)/12 = $8.678/mes`. Las cargas se aplican
con los % de Parámetros. Media jornada de 24 h: B proporcional $500.000, pero los fijos enteros: el costo
por hora sube.

**Turnos.** Grilla semanal con franjas de una hora y una persona por celda. Horas por persona
`=COUNTIF(Turnos!$B$2:$H$30,"Ana")*Parametros!$B$9` (duración de franja). Alertas: semana > 48 h
(Ley 11.544, y la tabla); día > 9 h (distribución desigual permitida) o > 8 h si no se pactó
[verificar: la Ley 27.802 permite hasta 12 h diarias con acuerdo escrito, sin pasar 48 semanales];
menos de 12 h entre fin y comienzo de jornada (LCT art. 197); sin un descanso semanal de 35 h corridas
(LCT art. 204, sábado 13 h a domingo 24 h o franco compensatorio en comercio). Jornada parcial: desde la
Ley 27.802 es parcial toda jornada menor a la completa y no admite horas extra [verificar el texto vigente
y el convenio]. Contrastar personas por franja con las horas pico declaradas.

**Errores comunes.** Olvidar cargas sobre aguinaldo y vacaciones; prorratear fijos; sumar aportes del
empleado.

## Plantilla por cliente (se completa antes de armar la planilla)

**A. Comercio:** rubro; monotributo o RI y alícuotas; IIBB; días de apertura; ventas y mezcla por familia;
medios de cobro y plazos.
**B. Datos recibidos:** productos (cuántos sin costo); gastos fijos; proveedores (visita, demora, bulto);
líneas dudosas del fiado; equipo, horas y antigüedad.
**C. Parámetros elegidos:** margen objetivo y redondeo por familia; umbral de remarcación; días de
seguridad; fondo de cambio y tolerancia; tope y "cerca del tope"; tabla laboral usada y fecha.
**D. Supuestos y faltantes:** cada uno, con dónde está la celda vacía.

## Prohibidos por defecto y qué usar en su lugar

| No | En su lugar |
|---|---|
| Números tipeados dentro de fórmulas (`*1.21`, `/0.7`, `>30`) | Celda de parámetro con etiqueta y referencia absoluta |
| `SI(`, `;`, `LET`, `XLOOKUP` en el xlsx | `IF`, comas, `INDEX/MATCH`, `SUMIFS` |
| Precio = costo × (1 + margen) | `costo / (1 − margen − variables)` |
| Margen sobre costo con IVA en un RI, o sin IVA en un monotributista | Base fiscal declarada y aplicada a toda la hoja |
| Remarcar solo lo que entra | Costo de reposición para todo el stock |
| Promedio simple de márgenes en el equilibrio | `SUMPRODUCT` ponderado por ventas en pesos |
| Stock actual tipeado; precios de proveedor inventados | `SUMIFS` desde Movimientos; hoja vacía con encabezado |
| Retiros del dueño como gasto; corregir el diario para que cierre | Tipo retiro; línea "diferencia de caja" |
| Intereses o actualización del fiado sin aviso; listas de deudores | Fiado sin interés; mensajes privados y respetuosos |
| Valores laborales de memoria; aportes del empleado en el costo | Hoja Parámetros desde `escala_comercio`; solo contribuciones del empleador |

## Checklist antes de entregar

- ¿Toda celda calculada tiene fórmula y toda constante está en Parámetros o Familias?
- ¿Las fórmulas están en inglés con coma, y abren sin `#NAME?` en Excel y Google Sheets?
- ¿Base fiscal declarada? ¿`CEILING`, no `ROUND`? ¿Comisión incluida? ¿Ventas anotadas brutas?
- ¿Equilibrio con y sin sueldo del dueño, con mezcla ponderada?
- ¿PEDIR redondea al bulto y respeta vencimientos?
- ¿Arqueo con fondo, denominaciones y diferencia registrada? ¿Retiros separados?
- ¿Aging aplicando pagos a lo más viejo? ¿Líneas dudosas en "Revisar"? ¿Mensajes sin exponer a nadie?
- ¿Costo laboral solo desde Parámetros, con fecha y "[completar con contador]" donde falte?
- ¿Filas EJEMPLO marcadas? ¿Faltantes y supuestos en LEEME.md?

## Instrucciones para el modelo

<methods_direction>
You tend to improvise business formulas and fill gaps with plausible numbers. Do not.
1. Before building any sheet, fill the per-client template (fiscal status, VAT rates, payment methods,
   sales mix, suppliers, parameters chosen, missing data). Use only the client's data and the provided
   tables (escala_comercio, comisiones, normativa_precios); never numbers from memory or from the
   examples in this guide.
2. Write every formula in English function names with comma separators (IF, SUMIFS, INDEX/MATCH,
   SUMPRODUCT, CEILING, MAXIFS, MINIFS, IFERROR). Never write Spanish function names or semicolons into
   the xlsx. Avoid LET, LAMBDA, XLOOKUP and dynamic arrays. Put every constant in a labelled parameter
   cell referenced absolutely; no literals inside formulas except 0, 1 and "".
3. Apply the methods of sections 1 to 7 exactly, including their definitions (margin on price, VAT
   basis, CEILING rounding, sales-weighted break-even with and without the owner's salary, FIFO credit
   aging, employer-only contributions with provisions). Do not substitute a simpler or different method.
4. Missing or null values: leave the cell blank, make dependent formulas return "", and list them in
   LEEME.md. Never guess an amount from a photo; mark the row Revisar = SI.
5. Legal floor: no interest or indexation on fiado by default; private, respectful collection messages
   (Ley 24.240 art. 8 bis); debtor data never published (Ley 25.326); shift alerts for weekly and daily
   hours, 12 h rest and 35 h weekly rest. State that the accountant registers the employee and that labor
   figures are estimates as of the table date.
6. Keep items marked [verificar] visible as notes in LEEME.md; do not present them as settled.
7. After building, self-audit against the Prohibidos table and the Checklist, and report any hit in
   LEEME.md under "Control de método".
</methods_direction>

## Fuentes

- Ley 24.240, art. 8 bis (trato digno), texto transcripto en Tévez y Souto, UBA: https://wtest.derecho.uba.ar/institucional/pacem/pdf/trato-indigno-y-dano-punitivo-aplicacion-del-art-8-bis-de-la-ldc.pdf
- Fallos sobre divulgar deudas frente a terceros (Microjuris): https://aldiaargentina.microjuris.com/2022/07/15/fallos-vergonzante-vejatoria-o-intimidatoria-divulgar-frente-a-terceros-la-supuesta-situacion-de-los-deudores-atenta-contra-la-tranquilidad-y-dignidad-del-consumidor-protegido-por-la-ldc/
- Ley 24.240, art. 36 (crédito para consumo), Juristeca Jusbaires: https://juristeca.jusbaires.gob.ar/defensa-del-consumidor/03c1a13/
- Ley 25.326 de protección de datos personales: https://www2.hcdn.gob.ar/export/hcdn/secparl/dgral_info_parlamentaria/dip/archivos/Ley_25326.pdf
- Reclamo de deudas y datos personales: https://abogados.com.ar/el-reclamo-de-deuda-en-el-ambito-laboral-del-deudor-y-la-ley-de-proteccion-de-datos-personales/30779
- IVA para monotributistas y RI: https://www.tiendanube.com/blog/calcular-iva-tienda-online-monotributo-responsable-inscripto/ y https://evemuriel.com/blog/iva/condiciones-para-computar-iva.html
- Costo de reposición: RT 17 FACPCE https://sfap.facpce.org.ar/normasweb/documentos/105.pdf ; precios en inflación https://base.com/es-AR/blog/?p=18433 y https://mercado.com.ar/estrategia/fijacion-de-precios-errores-habituales-que-afectan-rentabilidad-en-inflacion-y-consumo-digital
- Punto de equilibrio multiproducto: https://espanol.libretexts.org/Bookshelves/Negocio/Contabilidad/Libro%3A_Contabilidad_Gerencial_(Lumen)/05%3A_Comportamiento_de_costos_y_an%C3%A1lisis_costo-volumen-beneficio/5.08%3A_Punto_de_equilibrio_para_m%C3%BAltiples_productos
- Escandallo y merma: https://qamarero.com/blog/como-hacer-un-escandallo/ , https://qamarero.com/blog/fundamentos-de-la-merma-en-productos/ , https://visu.network/es/herramientas/calculadora-de-costos-de-recetas/
- Stock de seguridad y punto de pedido: https://www.cleverence.com/articles/business-blogs-es/how-to-calculate-safety-stock-formula-methods-3958207/ y https://resources.rework.com/es/libraries/manufacturing-growth/safety-stock-calculation
- ABC, conteo y FEFO: https://www.shopify.com/es/blog/analisis-abc , https://www.cleverence.com/articles/business-blogs-es/inventory-classification-methods-examples-best-practices-4927351/
- Arqueo y fondo de cambio: https://yo-facturo.com/blog/arqueo-de-caja-guia/ , https://consejosalta.org.ar/wp-content/uploads/ARQUEO-DE-FONDOS.pdf , https://cursa.app/es/articulo/arqueo-de-caja-como-cuadrar-el-efectivo-al-cerrar-el-turno
- Liquidación de Comercio marzo 2026 (componentes y contribuciones): https://www.ignacioonline.com.ar/liquidacion-marzo-2026-empleados-de-comercio/
- Aporte OSECAC 2026: https://www.iprofesional.com/impuestos/451146-osecac-aumenta-de-8000-a-28000-lo-que-paga-la-empresa-por-cada-empleado-de-comercio
- Vacaciones (arts. 150 y 155 LCT): https://www.iprofesional.com/management/344753-plus-vacacional-asi-se-calcula-el-pago-de-las-vacaciones y https://tributum.news/vacaciones-2026-que-cambio-con-la-reforma-laboral-y-como-se-calculan/
- Tiempo parcial tras la Ley 27.802: https://www.marval.com/publicacion/nuevas-reglas-para-el-contrato-a-tiempo-parcial-17547 y https://estudiovilaplana.com.ar/?p=586
- Jornada, descanso y banco de horas (Ley 27.802): https://www.lagaceta.com.ar/nota/1133953/economia/banco-horas-vacaciones-fraccionadas-nuevo-fondo-reforma-laboral-milei-ya-esta-vigente.html y https://www.cronista.com/economia-politica/jornada-laboral-extendida-que-dice-la-reforma-laboral-y-como-funciona-el-banco-de-horas
- Tablas del proyecto: `data/tablas/escala_comercio.json`, `data/tablas/comisiones.json`, `data/tablas/normativa_precios.json`.
