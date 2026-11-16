---
servicios: [flyer, promos, fidelizacion, precios_regla]
fuente: "Investigación propia de noviembre de 2026 sobre piezas gráficas para comercios de barrio: señales de diseño hecho por IA, gráfica vernácula, impresión casera, formatos de redes, normativa de ofertas (Ley 24.240, Res. SIC 446/2025, Res. SIC 4/2025) y tarjetas de sellos (Nunes y Drèze, 2006). Fuentes al final."
---

# Guía: piezas gráficas para comercios de barrio

Un volante parece hecho por IA cuando nadie decidió nada y el modelo completó con el promedio: fondo oscuro
con letras brillantes, cajitas con íconos, flechas, tildes, negritas sueltas, una explosión de «¡OFERTA!» y
verduras de clip art. En 2026 la gente lo reconoce y lo lee como «no les importó». Una pieza de barrio funciona cuando se parece al negocio (el precio del
tamaño del cartel de la verdulería, el apodo del local, la foto real del mostrador), se lee desde la vereda,
sale bien en una fotocopia y no promete nada que el comercio no cumpla.

## Principios

1. **Una pieza, una acción.** Venir el sábado, pedir por WhatsApp o juntar sellos. Tres mensajes son tres piezas.
2. **Tres segundos.** Mirando solo los textos grandes se entiende qué es, cuánto sale y hasta cuándo.
3. **Lo específico es lo humano.** El dato propio del cliente vale más que cualquier adorno o adjetivo.
4. **Del barrio, no de la plantilla.** La personalidad sale de la gráfica que ya existe en la calle, tomada
   por su lógica y no imitada como disfraz.
5. **Diseñar para el peor caso.** Impresora casera en blanco y negro, fotocopia, celular viejo con poco brillo.
6. **Honestidad comercial.** Una oferta publicada obliga al comercio (Ley 24.240, arts. 7 y 8).
7. **Una decisión fuerte por pieza**, ejecutada con disciplina: un tamaño desmesurado, un color plano, un sello.

## Estrategias por capa

### Referencia vernácula (una sola por cliente)

- **Fibrón sobre papel afiche fluo** (verdulería, carnicería, almacén): producto en mayúsculas gruesas,
  precio gigante, unidad («x kg», «c/u») pegada al precio, un subrayado. Diseñar en negro puro para que el
  comercio lo imprima sobre papel fluo de librería; subrayados y círculos como `<path>` apenas irregulares.
- **Pizarra de tiza** (panadería, dietética, kiosco): solo en digital. Fondo grafito o verde muy oscuro
  plano, texto blanco o amarillo tiza, lista alineada a la izquierda con precios en columna.
- **Letrero pintado, letra de caja** (ferretería, peluquería, almacén con historia): mayúsculas geométricas
  con sombra plana hacia un solo lado y un filete fino de marco. Si el concepto pide fileteado de verdad,
  seguir `fileteado.md`; nunca «un toque de filete» de adorno.
- **Sello de goma** (dietética, panadería, fidelización): una tinta, rotado entre −4° y 4°, con texto real
  («DESDE 1987», «HORNEADO ACÁ»). Uno por pieza, como firma.
- **Etiqueta de góndola o ticket de balanza** (almacén, fiambrería): monoespaciada o condensada, filetes
  punteados, datos en columnas. Ideal para listas y carteles de precios.

Sin kitsch: nada de fuentes «manuscritas» de plantilla ni texturas de papel, tiza o madera simuladas.

### Tipografía

- Una familia en dos pesos muy distintos (400 y 800/900) suele alcanzar; dos como máximo. Tres niveles con
  saltos de 3x o más entre el precio o título y el resto.
- **SVG: solo pilas del sistema** (el SVG no carga fuentes web en todos los visores):
  - Condensada de cartel: `'Avenir Next Condensed','Bahnschrift SemiCondensed','Roboto Condensed','Arial Narrow',sans-serif` en 700–800.
  - Negra para cifras: `Impact,'Arial Black',sans-serif`, solo para el número del precio.
  - Serif de almacén: `Georgia,'Noto Serif','DejaVu Serif',serif`.
  - Etiqueta: `'American Typewriter','Courier New',monospace`.
- **HTML impreso:** hasta dos familias de Fontshare o Google Fonts (`display=swap`, solo los pesos usados),
  con la pila del sistema de respaldo; tiene que verse bien aunque la fuente web no cargue.
- Cifras lineales con 3, 6, 8 y 9 abiertos. Formato argentino: `$ 4.500`, `$ 1.249,50`.

### Color

- Un dominante sacado del local (toldo, fachada, delantal, bolsa) o de lo que dijo el cliente, y un acento
  reservado para el precio o la acción. Neutros: negro y blanco.
- El contraste WCAG mide luminancia: texto con **7:1 o más** sobrevive a la fotocopia. Rojo sobre verde o
  amarillo sobre blanco se vuelven el mismo gris.
- Impreso: color en franjas, marcos o una mancha detrás del precio, hasta 20 % de la superficie; nunca fondo lleno.

### Impresión

- A5 = 148 × 210 mm, A4 = 210 × 297 mm, **sin sangrado**: `@page { size: 148mm 210mm; margin: 8mm }` y nada
  importante a menos de 10 mm del borde. `print-color-adjust: exact`. En el LEEME: imprimir a «tamaño real»;
  si la copiería solo tiene A4, «2 páginas por hoja» y cortar.
- Grises entre 20 % y 60 % (más claros desaparecen, más oscuros se empastan); nunca texto sobre gris; texto
  blanco calado solo desde 14 pt negrita. Planos negros grandes, solo en digital.
- **Distancia:** mínimo 2,5 mm de altura de mayúscula por metro. Vidriera a 2–3 m: título con mayúsculas de
  **15 mm o más** (≈ 60 pt). Mostrador a 1 m: datos de 14 pt. Nada por debajo de 9 pt.
- Tarjetas: cartulina de 180 a 240 g y líneas de corte grises de 0,3 mm.

### Redes y estados de WhatsApp

- Posts de **1080 × 1080**: la grilla del perfil de Instagram es 3:4 y del cuadrado muestra solo el centro de
  **810 px de ancho**; ahí va lo clave.
- Estados **1080 × 1920**: arriba va el nombre y la hora, abajo la barra de respuesta. Zona segura
  **x 64–1016, y 250–1500**.
- El celular muestra el lienzo a un tercio: título ≥ 96 px, texto ≥ 40 px, nada bajo 32 px. Hasta 15
  palabras en un post y 20 en un estado; el resto, en `textos.md`.

### Promociones honestas

- **Jerarquía:** precio final o beneficio («2x1») › producto y presentación › vigencia › condiciones. Precio
  anterior más chico, tachado, en la misma unidad, y solo si es el que se cobraba de verdad.
- Precios y porcentajes: los del cliente o `<calculos>`; nunca hacer la cuenta.
- «Llevá 2, pagá 1», aclarando el producto y si se mezclan variedades.
- **Fechas exactas de inicio y fin** («del lunes 3 al domingo 9 de noviembre»): la oferta obliga mientras
  dure y tiene que decir cuándo empieza y termina (art. 7). Stock en cantidad («hasta agotar 30 docenas»).
- Lo publicado integra el contrato (art. 8) y la publicidad que confunde está prohibida (Decreto 274/2019,
  art. 11): nada de «el más barato del barrio», urgencias sin fecha ni asteriscos con letra chica.
- Res. SIC 446/2025 (desde el 3/12/2025): vigencia, quién ofrece, condiciones y límite de stock tienen que
  poder consultarse. En la pieza de barrio van a la vista; si no entran, franja inferior a todo el ancho, en
  negrita, de al menos 4 mm y 5 % de la altura: «Más información y condiciones: WhatsApp …».
- Si hay precio, rige también la tabla `normativa_precios`: precio final con impuestos y, más chico, el
  precio sin impuestos nacionales cuando viene en `<calculos>`. Cuotas, solo con contado, cuotas y CFT dados.
- Sorteos: «sin obligación de compra» dentro de la pieza.

### Tarjeta de sellos

- 85 × 55 mm, 10 por A4 (2 × 5: 170 × 275 mm, márgenes de 20 mm a los lados y 11 mm arriba y abajo).
- **Progreso regalado** (Nunes y Drèze, 2006): con 8 compras necesarias en los dos casos, la tarjeta de 10
  casilleros con 2 ya sellados se completó casi el doble que la de 8 vacía (34 % contra 19 %), y el regalo
  funciona mejor con un motivo. Por defecto: 10 casilleros, los 2 primeros impresos como sellados con
  «2 de regalo por estrenar la tarjeta».
- Casilleros de 12 mm, 3 mm de separación, dos filas de 5; el último distinto (el premio). Renglón para el nombre.
- Antifraude simple: sello o rúbrica del local (no una tilde), número de tarjeta (`Nº 001`…) y fecha si hay
  vencimiento.
- Al pie o al dorso: premio, cada cuántas compras, compra mínima y vencimiento solo si el cliente los dio,
  «no canjeable por dinero». Con la voz del dueño: «La 10.ª va por nuestra cuenta».
- Cartel de mostrador A5: tres renglones grandes y una tarjeta en tamaño real.

### Carteles de precios

- A4 con 8 carteles de 105 × 74 mm, horizontales (Res. 4/2025), negro sobre blanco para imprimir en papel
  fluo o corregir a mano. Jerarquía fija:
  1. **Precio final**: cifras de 22 mm o más (≈ 90 pt), negrita; `$` al 60 % sobre la misma línea base.
  2. **Producto y presentación** («Yerba X 1 kg»): 14–18 pt negrita, arriba.
  3. **Precio por unidad** («$ 4.500 x kg», de `<calculos>`): 10–12 pt, siempre menor que el final.
  4. **«PRECIO SIN IMPUESTOS NACIONALES $ …»**: 8–9 pt debajo; si es null, la leyenda con «$ ______».
- En la lista para celular, cifras tabulares alineadas a la derecha en la misma línea que el producto.

### SVG y HTML escritos a mano

- SVG con `xmlns`, `viewBox="0 0 1080 1080"` (o `0 0 1080 1920`) y `width`/`height` iguales. Sin
  `foreignObject`, imágenes ni emojis. `&` como `&amp;`.
- **El SVG no corta líneas.** Ancho ≈ caracteres × tamaño × factor (0,55 minúsculas, 0,72 mayúsculas
  negritas, 0,5 condensada, 0,56 cifras), calculado con la fuente de respaldo más ancha; por debajo del 90 %
  del ancho disponible o partir con `<tspan x dy>`. `textLength` solo como último recurso, con `lengthAdjust="spacing"`.
- Fotos: solo en HTML, `<img src="{{FOTO:n}}">` con `object-fit: cover` en un contenedor fijo. En SVG no hay
  fotos: la pieza se sostiene con tipografía.
- QR: solo en HTML, `{{QR:https://wa.me/549…}}` en un `div` de 30 mm como mínimo (25 mm en tarjetas), con
  margen blanco y la acción al lado («Escaneá para pedir»). Nunca dibujarlo. En SVG, el número escrito grande.

## Plantilla de dirección de arte (se completa antes de dibujar)

**A. Uso:** qué acción pide; dónde vive (vidriera, mostrador, góndola, estado, difusión); distancia de
lectura; cómo se imprime (casa B/N, copiería color, papel fluo, cartulina).

**B. Concepto:** el dato propio del cliente; mensaje del nivel 1 en 8 palabras o menos, como habla el dueño;
la referencia vernácula y por qué le corresponde; qué NO es (3 cosas); la única decisión fuerte.

**C. Decisiones:** familias, pila de respaldo y pesos; tamaños de los tres niveles por formato; dominante
(origen y hex), acento y su uso, contraste verificado; márgenes y zona segura; ancho estimado de cada línea larga.

**D. Datos:** precios del cliente o de `<calculos>`, precio por unidad y sin impuestos; vigencia; condiciones,
stock y quién ofrece; lo que falta como [completar] y en «Revisá esto» del LEEME.

## Prohibidos por defecto y qué usar en su lugar

| No | En su lugar |
|---|---|
| Fondo oscuro con texto neón en impresos | Negro sobre blanco o papel de color; lo oscuro, solo en digital |
| Degradados, brillos, sombras suaves | Colores planos; una sombra plana si la referencia la tiene |
| Cajitas con íconos, flechas, tildes, líneas decorativas | Jerarquía por tamaño y peso; un subrayado de fibrón |
| Negritas y subrayados repartidos | Un solo énfasis por pieza |
| Explosión con «¡OFERTA!», «SALE», «Black Friday» | El precio gigante y el producto, en castellano |
| Emojis como íconos o viñetas | Texto, cifras o un sello |
| Clip art, ilustraciones genéricas, imágenes generadas | Fotos del cliente con `{{FOTO:n}}` o pura tipografía |
| Fuentes manuscritas falsas, texturas simuladas | La lógica del cartel real: mayúsculas gruesas, cifras grandes |
| Filete suelto como adorno | Fileteado completo según `fileteado.md`, solo si el concepto lo pide |
| Todo centrado, tres columnas iguales, mockups de celular | Alineación a la izquierda o la composición del cartel real |
| «Imperdible», «premium», «el mejor del barrio», «últimas horas» | El hecho: precio, cantidad, fecha, desde qué año |
| Asteriscos, «unidades limitadas», precio anterior inventado | Condiciones a la vista, stock en cantidad, precio anterior real |
| Precio sin unidad, sin vigencia o sin impuestos | Precio final, unidad, vigencia y la leyenda según la tabla |
| Fondos llenos de color en impresos | Franjas o marcos hasta 20 % de la hoja |
| QR dibujado, foto de internet | `{{QR:...}}` y `{{FOTO:n}}` en HTML |

## Checklist antes de entregar

- Si tapo el nombre, ¿se sabe de qué negocio es? ¿Está su dato propio?
- Solo con el nivel 1, ¿se entiende qué, cuánto y hasta cuándo?
- Impreso: margen de 10 mm, título de vidriera ≥ 15 mm, nada bajo 9 pt, contraste ≥ 7:1, se lee en gris, sin fondos llenos.
- Redes: post con lo clave en el centro de 810 px; estado dentro de la zona segura; tamaños mínimos; pocas palabras.
- SVG: `viewBox`, pilas de sistema, anchos estimados bajo el 90 %, sin fotos ni emojis.
- Promo: precios tal cual, fechas de inicio y fin, condiciones y stock visibles, ninguna promesa que no se cumpla.
- Tarjeta y carteles: medidas, casilleros regalados con motivo, jerarquía de precios, null como «$ ______».
- Cero palabras prohibidas; castellano rioplatense con «vos».

## Instrucciones para el modelo

<graphic_direction>
You tend to produce generic "AI flyer" graphics (dark background with bright text, icon boxes, arrows,
checkmarks, scattered bold, starbursts, clip art, emojis). Do not.
1. Before drawing, fill the art-direction sheet from the client's answers and photos only; put it in
   LEEME.md under "Dirección de arte".
2. Pick ONE vernacular reference and use its logic, not a costume: marker on fluo paper (pure black, bold
   caps, huge price, unit beside it, one slightly irregular underline), chalkboard (digital only), painted
   block letters, one rubber stamp, shelf-label type. Fileteado only via fileteado.md when the concept asks.
3. SVG: exact viewBox, system font stacks above, no foreignObject, images or emojis. SVG does not wrap:
   width = chars × size × factor (0.55 lowercase, 0.72 bold caps, 0.5 condensed, 0.56 digits) with the
   widest fallback, under 90% of the space, else tspan. Squares: key message in the central 810 px.
   1080x1920: content in x 64-1016, y 250-1500. Title ≥ 96 px, text ≥ 40 px, ≤ 15-20 words.
4. Print HTML: @page exact size, 8 mm margin, no bleed, 10 mm safe edge, print-color-adjust: exact, color
   ≤ 20% of the area, text contrast ≥ 7:1, nothing under 9 pt, window titles ≥ 15 mm cap height.
   Photos only as <img src="{{FOTO:n}}">; QR only as {{QR:...}} in a box ≥ 30 mm (25 mm on cards).
5. Offers: prices exactly as given or from <calculos>, never computed; final price largest; old price
   struck through only if real; exact start and end dates, conditions and stock quantity visible (or a
   bold full-width bottom band ≥ 4 mm and ≥ 5% of the height); no superlatives, fake urgency, asterisks,
   or installments without CFT; apply normativa_precios when a price is shown.
6. Loyalty: 85x55 mm, 10 per A4, 10 circles of 12 mm, first 2 pre-stamped with a stated reason, numbered.
   Price signs: 8 per A4 landscape, final price digits ≥ 22 mm, unit price and "PRECIO SIN IMPUESTOS
   NACIONALES" smaller; null as "$ ______".
7. Rioplatense Spanish with "vos", facts not adjectives, nothing invented; gaps as [completar] listed in
   LEEME.md. Self-audit against the prohibited table and checklist and report hits in LEEME.md.
</graphic_direction>

## Fuentes

- 404 Media, «We are living in a ChatGPT flyer pandemic»: https://www.404media.co/we-are-living-in-a-chatgpt-flyer-pandemic/
- AI Weekly, rasgos de los flyers de ChatGPT: https://aiweekly.co/alerts/404-media-chronicles-a-chatgpt-flyer-pandemic-backlash
- Creative Bloq, diseñadores que corrigen flyers hechos con IA: https://creativebloq.com/design/graphic-design/graphic-designers-are-trying-to-fix-peoples-terrible-ai-flyers
- Venngage, «AI slop in design»: https://venngage.com/blog/ai-slop-in-design/
- Mika Reyes, cómo reconocer diseño hecho con IA: https://mikareyes.com/ai/how-to-spot-ai-made-graphic-design-and-posters
- Axios, comercios que prometen publicidad sin IA (agosto de 2026): https://www.axios.com/local/salt-lake-city/2026/08/03/ai-flyers-utah-businesses-boycott-customer-complaints
- Artswave, «Only Hands»: https://artswave.org/only-hands-a-rising-rejection-of-ai-generated-design/
- Ley 24.240 de Defensa del Consumidor: https://www.argentina.gob.ar/normativa/nacional/ley-24240-638/texto
- Resolución SIC 446/2025, publicidad de ofertas: https://www.argentina.gob.ar/node/486561
- abogados.com.ar sobre la Res. 446/2025: https://abogados.com.ar/index.php/resolucion-4462025-nueva-simplificacion-sobre-legales-en-publicidades-que-ofrezcan-bienes-y-servicios/37885
- Resolución SIC 12/2024 (antecedente derogado): https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-12-2024-398486
- Decreto 274/2019 de Lealtad Comercial: https://www.consejosalta.org.ar/wp-content/uploads/DECRETO-274.pdf
- Resolución SIC 4/2025, exhibición de precios: https://www.argentina.gob.ar/normativa/nacional/norma-408455/texto
- Nunes y Drèze (2006), «The Endowed Progress Effect», Journal of Consumer Research 32(4), resúmenes: https://coglode.com/nuggets/endowed-progress-effect y https://knowledge.wharton.upenn.edu/?p=5630
- Neal Schaffer, grilla 3:4 de Instagram: https://nealschaffer.com/instagram-post-size/
- Sked Social, zonas seguras de historias según Meta: https://skedsocial.com/blog/best-instagram-image-and-video-size-recommendations
- Moda, interfaz de los estados de WhatsApp: https://moda.app/resources/sizes/whatsapp-status
- Superchat, zona segura de WhatsApp: https://help.superchat.com/en/articles/701423-whatsapp-media-sizes-formats
- Admakeai, sobre el origen incierto de las cifras de zona segura: https://admakeai.com/blog/whatsapp-status-ads
- Optsigns, altura de letra y distancia de lectura: https://optsigns.com/es/road-sign-size-visual-distance-readability-guidelines-safety
- Flag & Banner, visibilidad de letras: https://www.flagandbanner.com/customer_service/Letter-Visibility-Chart.asp
- BoD, gráficos y color para impresión (grises mínimos): https://bod.com.es/bodfiles/ES-Storage/documents/Downloads/Graficos_y_gestion_del_color.pdf
- Universidad de Palermo, gráfica popular en el cartel contemporáneo: https://dspace.palermo.edu/ojs/index.php/cdc/article/download/11489/19818
