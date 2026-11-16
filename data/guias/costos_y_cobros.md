---
servicios: [luz_alquiler, cobros]
fuente: "Investigación propia sobre facturas eléctricas, alquileres comerciales y medios de cobro en Argentina (fuentes oficiales y prensa, consultadas el 16/11/2026; ver Fuentes). Las comisiones no están acá: salen de la tabla verificada 'comisiones'."
---

# Guía: costos del local (luz y alquiler) y costos de cobro

Un diagnóstico de costos hecho por IA falla de cuatro maneras. **Inventa tarifas**: un $/kWh o una comisión
«de memoria». **Supone mal**: da por hecho que el comercio
tiene subsidio, que el IVA es 21%, que el contrato ajusta por ICL o que la heladera gasta su potencia las 24 horas.
**Disfraza asesoramiento legal**: le dice al cliente «podés rescindir sin pagar» o «el aumento es ilegal».
**Da consejos genéricos**: «apagá las luces», «usá LED», sin cuánto ni por qué en este local. La salida: leer solo lo
impreso o lo que contestó el cliente, calcular con fórmulas visibles, fechar cada número que cambia y marcar lo que
no se sabe.

## Principios

1. **El documento manda.** Tarifa, cargos, kWh, impuestos, índice de ajuste y plazos salen de la factura y del
   contrato. Si no se lee, se escribe «no se lee» y no se completa con un promedio.
2. **Todo número que cambia lleva fecha y fuente.** Inflación, índices, comisiones, cuadros tarifarios y datos de
   vacancia vencen en semanas. Sin fecha, no va.
3. **Supuestos a la vista.** Potencia, ciclo de compresor o inflación futura van en celdas editables, marcadas
   «estimación», con su origen; cada total es una fórmula.
4. **Ahorro en pesos y en orden.** Tres cambios, del que más ahorra al que menos, con la cuenta.
5. **Informar no es asesorar.** Se resume el contrato y la norma general; interpretar el caso es de un abogado,
   contador o electricista matriculado.
6. **La condición fiscal cambia todo.** Responsable inscripto, monotributista o exento cambia el IVA de la luz, de
   las comisiones y del alquiler. Si no se sabe, se calculan los dos escenarios.

## 1. Leer la factura de luz

**Categorías.** En el área de Edenor y Edesur (ENRE) el comercio chico suele estar en **T1-G** (pequeñas demandas
generales), subdividida en G1, G2 y G3 por tramos de consumo; los cuadros de 2026 muestran un cargo fijo igual para
los tres tramos y un cargo variable por kWh que cambia por tramo y por resolución. **T2** (medianas demandas) es para
suministros de 10 kW a menos de 50 kW y **T3** para 50 kW o más: además de fijo y variable pagan **potencia
contratada** ($/kW-mes) y recargo por **potencia excedida**. EPEC, EPE y las cooperativas usan sus propias
categorías: se usa el nombre impreso. Los límites de los tramos G1 a G3 se toman de la factura, no de esta guía.

**Subsidios.** Desde enero de 2026 rige el régimen de Subsidios Energéticos Focalizados (SEF, Decreto 943/2025),
que es solo para usuarios **residenciales**; en el cuadro nacional de junio de 2026 la bonificación para T1-G es
cero. Un comercio, entonces, paga tarifa plena. Si la factura muestra subsidio, se informa y se advierte una
posible mala categorización (riesgo, no ahorro).

**Impuestos.** El IVA de la electricidad tiene alícuota incrementada de **27%** cuando el usuario es responsable
inscripto o monotributista que la usa en su actividad, y **21%** para consumidor final o exento (art. 28 de la Ley de
IVA, según fuentes contables; confirmar con lo impreso). A los responsables inscriptos algunas facturas les suman una
**percepción de IVA** (suele verse un 3% adicional). Para el responsable inscripto el IVA es crédito fiscal: el costo
real es el neto. Para el monotributista el IVA es costo. Tasas municipales y fondos provinciales varían (en Buenos
Aires el alumbrado suele figurar como «Ley 10.740»); la Nación prohibió en 2024 cargar conceptos ajenos al servicio y
la provincia lo discute: se informa lo que figura, sin opinar si es legal.

**Hoja 'Factura' del xlsx.** Una fila por concepto impreso, columna de importe y columna «peso %» =
`importe / total`. Agregar dos filas calculadas: `$/kWh efectivo = total / kWh` y `$/kWh variable = cargo variable
total / kWh`. El primero sirve para valorizar ahorros (cada kWh menos ahorra aproximadamente el variable más los
impuestos proporcionales, no el fijo).

**Potencia contratada (T2/T3).** La Secretaría de Energía recomienda alinearla con la demandada según el historial
y pedir la reducción a la distribuidora. Si la contratada supera a la registrada en varios períodos:
`ahorro mensual ≈ (kW contratados − kW propuestos) × $/kW-mes impreso`, con la advertencia del recargo por exceso y
sin fijar el número sin 12 meses de datos.

## 2. Equipos: de vatios a kWh

**Fórmula base:** `kWh/mes = W × horas/día × días/mes × factor de uso / 1000`.

- **Refrigeración:** el compresor no funciona todo el tiempo. Si hay etiqueta de eficiencia o ficha con consumo en
  kWh/año, usar `kWh/año / 12` y listo (es mejor dato). Si solo hay potencia, usar 24 h × un **ciclo de compresor**
  estimado; las calculadoras de uso doméstico usan 35-45% para equipos modernos y 55-70% para viejos (fuente de baja
  calidad, marcar como estimación). Local caluroso o vitrina abierta: extremo alto.
- **Control obligatorio:** la suma de equipos tiene que quedar cerca de los kWh de la factura (columna «% de la
  factura» = `kWh equipo / kWh factura`). Si la suma da más de 110% o menos de 70%, se ajustan los supuestos o se dice
  que faltan equipos o datos; no se presenta un reparto que no cierra.

**Ejemplo (supuestos, no datos medidos):** exhibidora vertical de 400 W, 24 h, 30 días, ciclo 60%:
`400 × 24 × 30 × 0,6 / 1000 = 172,8 kWh/mes`. Diez tubos LED de 18 W, 12 h, 26 días: `10 × 18 × 12 × 26 / 1000 =
56,2 kWh/mes`.

**Pesos típicos** (guía de la Secretaría de Energía para comercios y servicios, junio 2024): la refrigeración puede
llegar al 50% del consumo eléctrico en algunos comercios; la iluminación, hasta el 40% en comercios y oficinas; otros
equipos (informática, expendedoras, cocina), hasta 15%.

## 3. Ahorros con respaldo

Valorizar cada uno como `kWh ahorrados × $/kWh variable con impuestos`, en pesos por mes y por año.

| Medida | Ahorro estimado | Fuente |
|---|---|---|
| Reemplazar tubos fluorescentes por LED | ~64% de la energía de esa iluminación (halógenas/incandescentes: ~90%) | Secretaría de Energía, 2024 |
| Sensores, temporizadores, responsable de apagado | 10-30% del consumo de iluminación | Secretaría de Energía, 2024 |
| Reparar burletes y mantenimiento (limpiar condensador, revisar escarcha) | el mantenimiento deficiente sube el consumo hasta 10% | Secretaría de Energía, 2024 |
| Alejar heladeras de fuentes de calor y corrientes de aire | en vitrinas abiertas el aire puede sumar hasta 95% de consumo | Secretaría de Energía, 2024 |
| Cortinas o tapas nocturnas en exhibidoras abiertas | ~20% con 8 h de uso por noche, si están bien colocadas | US DOE 1996, citado por guías del Reino Unido |
| Puertas o paneles en muebles abiertos | hasta 30% | Oficina Federal de Energía de Suiza |
| Aire acondicionado a 24-25 °C en verano, 18-21 °C en invierno, horarios y filtros limpios | 2-15% según medida | Secretaría de Energía, 2024 |
| Recambio por equipo certificado (Energy Star, EE. UU.) | heladera comercial de puerta de vidrio ~400 kWh/año; freezer ~900 kWh/año | EPA Energy Star |

Los porcentajes **no se suman**: se aplican en cadena. Un recambio de equipo va solo con repago
(`precio / ahorro mensual`), con el precio que dé el cliente o [completar].

## 4. El contrato de alquiler

**Marco desde el DNU 70/2023** (vigente desde fines de diciembre de 2023; derogó la Ley 27.551 y modificó el Código
Civil y Comercial):

- **Plazo libre** (art. 1198). Si el contrato no dice plazo, se entiende 2 años para vivienda y 3 años para otros
  destinos, como un local. Máximo 50 años para destino no habitacional.
- **Ajuste libre**: las partes eligen índice y frecuencia; se puede pactar en moneda extranjera (arts. 765, 766 y
  1199).
- **Garantías** libres (art. 1196).
- **Rescisión anticipada del inquilino** (art. 1221): puede resolver pagando el **10% del saldo de alquileres
  futuros**, desde la notificación hasta el fin pactado. El DNU no fija preaviso ni plazo para pagar ese 10%. Si el
  contrato es anterior al DNU, cuál texto rige es discutido: decirlo y derivar al abogado.
- **Impuestos y expensas:** lo que diga el contrato; como regla general (art. 1209) el inquilino paga lo que nace
  del destino del local. Si el contrato calla, no afirmar quién paga ABL o expensas extraordinarias.
- Si el dueño es responsable inscripto, el alquiler de un local suele llevar **IVA 21%** (verificar en el recibo).

**Estado judicial a noviembre de 2026:** el DNU sigue vigente. Hubo fallos contra otros capítulos (laboral,
prepagas) y la Corte rechazó planteos generales por falta de caso; no se encontró sentencia contra el capítulo de
alquileres. Citarlo con fecha.

**Índices:**
- **ICL** (BCRA): se sigue publicando a diario; lo usan los contratos de la Ley 27.551 y los que lo pactaron.
- **IPC INDEC**: mensual, se publica a mediados del mes siguiente. Último dato confirmado al cerrar esta guía:
  septiembre de 2026, 1,9% mensual (publicado el 13/10/2026); el de octubre salía el 12/11/2026 y hay que leerlo en
  indec.gob.ar. CABA midió 1,9% para octubre.
- **Coeficiente Casa Propia**: basado en salarios (CVS), pensado para créditos; no se confirmó su publicación en
  2026: si el contrato lo usa, marcarlo y pedir el último valor. Otro índice pactado se reproduce tal cual.

**Proyección a 12 meses (hoja 'Alquiler').** Columnas: mes, ¿ajusta este mes?, índice mensual supuesto (editable,
precargado), factor acumulado, alquiler, IVA si corresponde, total. Fórmula por período de ajuste de `k` meses:
`alquiler nuevo = alquiler anterior × Π(1 + π_m)` sobre los `k` meses del período, o con índices publicados
`alquiler × I_actual / I_base`. Recordar el **rezago**: el ajuste de un mes usa el último índice publicado, no el del
mes en curso. Precargar `π` con el último IPC publicado y su fecha, y agregar dos filas de sensibilidad (π − 0,5 y
π + 0,5 puntos).

**Ejemplo (supuesto de 2% mensual):** alquiler $1.000.000, ajuste trimestral por IPC. Factores: 1,0612; 1,1262;
1,1951. Total de 12 meses: `3 × (1 + 1,0612 + 1,1262 + 1,1951) × 1.000.000 ≈ $13.147.000`, sin IVA ni expensas.

## 5. Argumentos para renegociar

Se entregan como argumentos, no como derechos:

- **Vacancia, con fecha y zona:** la Cámara Argentina de Comercio contó 291 locales vacíos en las principales
  avenidas porteñas en mayo-junio de 2026 y 284 en julio-agosto (+4% interanual). Solo vale para CABA; fuera de ahí,
  pedir al cliente carteles de «se alquila» de su cuadra o publicaciones de la zona.
- **Costo de que el local quede vacío para el dueño:** `meses estimados sin inquilino × (alquiler + expensas + ABL) +
  comisión inmobiliaria`. Compararlo con la concesión pedida.
- **Intercambios:** más plazo a cambio de ajuste menos frecuente o con tope; índice por IPC en vez de uno más alto;
  meses de gracia por mejoras que hace el inquilino; historial de pago al día.
- **Peso sobre las ventas:** `alquiler / ventas mensuales`, si el cliente las dio.

## Plantilla

**luz-y-alquiler.xlsx:** 'Factura' (conceptos leídos, importe, peso % y $/kWh); 'Equipos' (equipo, cantidad, W
estimados, horas, ciclo, kWh/mes, % de la factura, fila de control); 'Alquiler' (12 meses, índice editable, fórmulas,
sensibilidad); 'Supuestos' (cada supuesto con fecha y fuente).

**informe.md:** 1) Dónde se va la plata (3 renglones con %); 2) Los 3 cambios con más ahorro, en $ por mes y año, con
la cuenta; 3) Resumen del contrato: partes, destino, plazo y vencimiento, precio, índice y frecuencia, garantías,
quién paga impuestos y expensas, rescisión; 4) Cuánto vas a pagar en 12 meses y con qué supuesto; 5) Argumentos para
negociar; 6) Lo que no se pudo leer; 7) Aviso: «Esto no es asesoramiento legal, contable ni técnico eléctrico».

**comparativa-cobros.xlsx y recomendacion.md:** según el método de la sección 6 y las instrucciones del catálogo.

## 6. Costo de cobro: el método

Las comisiones salen **solo** de la tabla `comisiones` que llega en `<tablas_vigentes>`, con su fecha. Esta guía no
repite valores.

**Costo efectivo de un medio** (por cada $100 cobrados):

`costo % = comisión × (1 + IVA de la comisión) + otros descuentos % + costo de demora % + abono prorrateado %`

- **IVA de la comisión** (el porcentaje está en la tabla): para el **monotributista** es costo; para el **responsable
  inscripto** es crédito fiscal, así que su costo económico es la comisión sin IVA (pero igual sale de la caja). Si la
  fila de la tabla aclara que la comisión ya incluye IVA, no se suma otra vez.
- **Ingresos Brutos sobre acreditaciones:** los bancos (SIRCREB, cuentas CBU) y las billeteras (SIRCUPA, cuentas
  CVU, en las provincias adheridas) retienen un porcentaje que depende del padrón de cada CUIT; puede llegar a 5% a
  quien no está inscripto o tiene deuda. **No es comisión**: es un pago a cuenta del impuesto. Solo es costo si se
  acumula saldo a favor que no se puede usar. El porcentaje real se consulta en el padrón de la Comisión Arbitral o
  en el resumen; nunca se supone.
- **Retenciones de IVA y Ganancias** de procesadores y billeteras: derogadas desde el 1/9/2024 (RG 5554/2024). Si un
  resumen muestra una, se informa y se deriva al contador.
- **Costo de demora** (la plata que llega más tarde vale menos): con inflación mensual `π` y `d` días corridos de
  espera, `demora % = 1 − 1 / (1 + π)^(d/30)`. Con π = 2%: 2 días ≈ 0,13%; 10 días ≈ 0,66%. Los días hábiles se
  pasan a corridos (8 hábiles ≈ 11-12 corridos). `π` es editable, con el último IPC
  publicado y su fecha; si el cliente necesita la plata en el día, decirlo como condición.
- **Abono de terminal:** `abono % = abono mensual × (1 + IVA) / monto mensual cobrado con esa terminal`. Volumen de
  equilibrio para que convenga una terminal con abono frente a otra opción sin abono: `V = abono con IVA /
  (costo % alternativa − costo % terminal)`. Tener en cuenta bonificaciones con fecha de fin.

**Lógica de recomendación:**
1. Calcular el costo efectivo de lo que el cliente usa hoy, con sus montos.
2. Para cada tipo de pago que recibe (dinero en cuenta o QR, débito, crédito en un pago), buscar en la tabla la opción
   de menor costo efectivo **incluida la demora**, no la de menor comisión a secas.
3. Ahorro mensual = costo actual − costo alternativo, y anual × 12.
4. Ordenar: primero lo que no requiere cambiar de proveedor (elegir otro plazo de acreditación), después lo que
   requiere un alta nueva, al final lo que requiere comprar equipo.

**¿Se puede cobrar recargo o hacer descuento por efectivo?** A noviembre de 2026, el art. 37 inc. c de la Ley 25.065
sigue vigente («no efectuar diferencias de precio entre operaciones al contado y con tarjeta»): el DNU 70/2023
derogó otros artículos de esa ley, no este. La Resolución 51/2017 de la Secretaría de Comercio lo aplica a todo pago
único (débito, crédito, prepaga u otro medio electrónico); y en 2026 se siguieron confirmando multas por recargos.
Un «descuento por pago en efectivo» frente a tarjeta en un pago es la misma diferencia de precio con otro nombre y es
sancionable. Lo que sí se puede: precio distinto en **cuotas**, mostrando precio de contado, cuotas y costo financiero
total (Res. 4/2025, tabla `normativa_precios`); y pedir o promocionar el medio más barato **sin cambiar el precio**.
Incertidumbre: no se encontró una norma de 2025-2026 que derogue la Res. 51/2017; tratarla como vigente.

## Prohibidos por defecto y qué usar en su lugar

| No | En su lugar |
|---|---|
| $/kWh, cargo fijo o comisiones «de memoria» o de un promedio | Lo impreso en la factura; las comisiones de la tabla `comisiones` con su fecha |
| Potencia del equipo × 24 h para heladeras | kWh/año de la etiqueta o ciclo de compresor declarado, y control contra la factura |
| «Pasate a LED y ahorrás mucho» | kWh y pesos ahorrados con la fuente del porcentaje |
| «El aumento es ilegal», «podés irte sin pagar», «el DNU no te alcanza» | Qué dice el contrato, qué dice la norma general y «consultalo con un abogado» |
| Proyectar el alquiler con un número fijo escondido | Índice mensual editable, con fecha y fuente, y sensibilidad ±0,5 puntos |
| Comparar solo comisiones | Costo efectivo: comisión + IVA + demora + abono |
| Tratar la retención de Ingresos Brutos como comisión | Pago a cuenta del impuesto; costo solo si queda saldo inutilizable |
| Recomendar recargo con tarjeta o descuento por efectivo | Precio único en un pago; incentivar el medio barato sin tocar el precio |
| Calcular un medio que no está en la tabla | Decir en LEEME.md que no está y no calcularlo |

## Checklist antes de entregar

- ¿Cada dato se puede señalar en la factura o el contrato? ¿Lo ilegible está listado?
- ¿La suma de equipos cierra entre 70% y 110% de los kWh facturados, o se explica por qué no?
- ¿Los 3 cambios están en pesos por mes y por año, con el cálculo?
- ¿La proyección de alquiler respeta índice, frecuencia y rezago del contrato?
- ¿Las comisiones son las de la tabla, con su fecha, y el aviso de que vencen?
- ¿Aparece el aviso de que no es asesoramiento legal, contable ni técnico eléctrico?
- ¿Cero recomendaciones de recargo o descuento por medio de pago en un pago?

## Instrucciones para el modelo

<diagnostic_direction>
You tend to fill gaps with plausible averages, assume a typical client and slide into legal advice. Do not.
1. Extract only printed values from the bill (category, period, readings, kWh, power, fixed/variable charges, each
   tax) and the lease (term, rent, index and frequency, currency, guarantees, taxes/expensas, termination). List
   anything unreadable under "No se pudo leer" in LEEME.md; never fill it with a typical value.
2. Never use a tariff, commission, index or inflation figure from memory. Commissions come only from the
   'comisiones' table, quoting its date. Every changing number carries month and source.
3. Branch on tax status (RI / monotributo / exento): it changes electricity IVA (27% vs 21%), whether commission
   IVA is a cost, and lease IVA. If unknown, compute both. Commercial users get no SEF subsidy.
4. Equipment kWh: label kWh/year if available, else W x h x days x duty cycle / 1000 marked as estimate; reconcile
   with billed kWh (70-110%) or explain. Value savings as kWh x variable $/kWh with taxes, applied sequentially,
   each percentage with its source; pick the top 3 by pesos.
5. Rent: 12 formula rows, editable monthly index prefilled with the latest published value and date, contract
   frequency and lag respected, +/-0.5 point sensitivity.
6. Payments: effective cost = commission x (1 + IVA) + other deductions + delay (1 - 1/(1+pi)^(d/30)) + terminal
   fee share. IIBB withholdings are tax prepayments, not fees. Rank: settlement term, then provider, then hardware.
   A method missing from the table is reported, not computed.
7. Never recommend a card surcharge or a cash discount against single-payment card or electronic payments (Ley
   25.065 art. 37 c, Res. 51/2017, in force as of November 2026).
8. Describe, do not advise. End informe.md and recomendacion.md with "Esto no es asesoramiento legal, contable ni
   técnico eléctrico; antes de firmar o reclamar, consultalo con un profesional." Rioplatense Spanish, "vos".
9. Self-audit against the prohibited table and checklist; report hits in LEEME.md.
</diagnostic_direction>

## Fuentes

Consultadas el 16/11/2026. Las marcadas «prensa» o «secundaria» no son norma oficial.

- Secretaría de Energía, «Guía de eficiencia energética: comercial y servicios», junio 2024:
  https://argentina.gob.ar/sites/default/files/guia_comercial_servicios_enereficiente.pdf
- SSAyEE, «Cómo leer la factura eléctrica»: https://www.argentina.gob.ar/sites/default/files/como_leer_la_factura_electrica_-_ssayee.pdf
- ENRE, cuadro tarifario Edenor 2026 (T1-G, subsidio cero para G):
  https://servicios.infoleg.gob.ar/infolegInternet/anexos/420000-424999/422790/res46-2.pdf
- Decreto 943/2025 (SEF): https://www.argentina.gob.ar/normativa/nacional/decreto-943-2025-422016/texto
- Infobae, nuevos cuadros Edenor/Edesur por el SEF, 29/01/2026 (prensa):
  https://www.infobae.com/economia/2026/01/29/cambios-en-los-valores-de-edenor-y-edesur-actualizaron-los-cuadros-tarifarios-por-el-nuevo-sistema-de-subsidios/
- Régimen tarifario DPEC (definiciones T2/T3): https://dpec.com.ar/es/articulo/2972/descarga/55/Regimen-Tarifario-DPEC-Dto-124-20pdf
- Resolución ENRE 355/2024: https://www.argentina.gob.ar/normativa/nacional/norma-400553/texto
- IVA en servicios públicos por sujeto (secundaria):
  https://blogdelcontador.com.ar/el-iva-en-los-servicios-publicos-alicuotas-segun-sujetos-y-computo-del-credito-fiscal/
- Tasas en boletas: La Nación, 11/10/2024 (prensa):
  https://www.lanacion.com.ar/economia/comenzo-a-regir-la-prohibicion-de-incluir-impuestos-o-tasas-en-las-boletas-de-los-servicios-publicos-nid11102024/
  y La Capital MdP, Ley 10.740 (prensa): https://www.lacapitalmdp.com/ya-empezo-a-cobrarse-la-tasa-de-alumbrado-publico-en-las-facturas-de-luz/
- EPA Energy Star, Commercial Refrigerators & Freezers: https://www.energystar.gov/products/commercial_refrigerators_freezers
- Carbon Trust/Defra, eficiencia en exhibidoras (tapas nocturnas, cortinas): https://grimsby.ac.uk/documents/defra/retl-supermarketefficoptns.pdf
- Oficina Federal de Energía de Suiza (muebles cerrados): https://pubdb.bfe.admin.ch/en/publication/download/11331
- Ciclo de compresor en calculadoras (secundaria, baja calidad): https://hacecuentas.com/calculadora-consumo-heladera-anual-kwh
- DNU 70/2023 y locaciones, F. Robiglio, 09/01/2024:
  https://abogados.com.ar/las-locaciones-inmobiliarias-a-la-luz-del-dnu-n702023-una-breve-reflexion/34130
- Corte Suprema y planteos contra el DNU 70/2023, 2026 (prensa):
  https://www.palabrasdelderecho.com.ar/articulo/4969/La-Corte-Suprema-rechazo-dos-demandas-contra-el-Mega-DNU-por-inexistencia-de-caso
  y prepagas, 05/11/2026: https://www.palabrasdelderecho.com.ar/articulo/7090/Prepagas-declararon-inconstitucionales-los-articulos-del-DNU-70/2023-que-desregularon-las-cuotas-
- ICL, serie diaria BCRA (secundaria): https://indicadores.ar/indicadores-economicos/icl
- IPC septiembre 2026, 1,9% (prensa sobre dato INDEC): https://www.canal26.com/economia/2026/10/13/la-inflacion-de-septiembre-fue-de-19-y-acumula-un-alza-de-236-en-lo-que-va-del-2026/
  e INDEC: https://www.indec.gob.ar
- Inflación CABA octubre 2026 (prensa): https://diariopanorama.com/noticia/572071/caba-registro-inflacion-19porciento-octubre-ya-acumula-261porciento-ano
- Coeficiente Casa Propia (secundaria, sin confirmar): https://calcularsueldo.com.ar/?p=12996
- CAC, locales vacíos CABA julio-agosto 2026 (prensa):
  https://mercado.com.ar/ladrillos-y-proyectos/locales-vacios-en-caba-subieron-4-interanual-y-bajaron-24-bimestral
  y mayo-junio: https://mercado.com.ar/ladrillos-y-proyectos/locales-vacios-en-areas-comerciales-de-la-ciudad-de-buenos-aires-subieron-223
- Ley 25.065, texto actualizado: https://www.argentina.gob.ar/normativa/nacional/ley-25065-55556/actualizacion
- Resolución 51/2017 SC, resumen (secundaria): https://aldiaargentina.microjuris.com/2017/01/25/los-comercios-deberan-exhibir-el-costo-de-los-productos-en-efectivo-y-el-financiamiento-total-si-se-compra-con-pago-en-cuotas/
  y Derecho Fácil: https://www.argentina.gob.ar/justicia/derechofacil/leysimple/precios-transparentes
- Recargos y «descuento por contado», Cadena 3, 2026 (prensa):
  https://www.cadena3.com/noticia/radioinforme-3/la-rebelion-del-billete-por-que-pagar-con-tarjeta-o-qr-es-hasta-un-20-mas-caro_543088
- Derogación de retenciones IVA/Ganancias en cobros electrónicos (RG 5554/2024), La Nación, 04/09/2024 (prensa):
  https://www.lanacion.com.ar/economia/mercado-pago-elimino-el-cobro-de-las-retenciones-de-iva-e-impuesto-a-las-ganancias-nid04092024/
- SIRCUPA/SIRCREB en billeteras (secundaria): https://contablix.ar/blog/sircupa-retencion-ingresos-brutos-billetera
  e iProfesional, 2026: https://www.iprofesional.com/impuestos/466958-como-funciona-retencion-ingresos-brutos-mercado-pago
- CABA y SIRCUPA, noviembre 2026 (prensa): https://www.iproup.com/finanzas/72959-retenciones-ingresos-brutos-caba-sircreb-bancos-billeteras-noviembre-2026
