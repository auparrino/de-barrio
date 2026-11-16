---
servicios: [flyer, promos, fidelizacion, precios_regla]
fuente: "Investigación propia de noviembre de 2026 sobre piezas gráficas para comercios de barrio: señales de diseño hecho por IA, gráfica vernácula, impresión casera, formatos de redes, normativa de ofertas (Ley 24.240, Res. SIC 446/2025, Res. SIC 4/2025) y tarjetas de sellos (Nunes y Drèze, 2006). Fuentes al final."
---

# Guía: piezas gráficas para comercios de barrio

Un volante parece hecho por IA cuando nadie decidió nada y el modelo completó con el promedio: fondo oscuro
con letras brillantes, cajitas con íconos, flechas, tildes, negritas sueltas, una explosión de «¡OFERTA!» y
verduras de clip art. En 2026 la gente ya lo reconoce y lo lee como «no les importó» (hay comercios que
anuncian «sin IA» como ventaja). Una pieza de barrio funciona cuando se parece al negocio: el precio en el
tamaño del cartel de la verdulería, el apodo del local, la foto real del mostrador, y cuando se lee desde la
vereda, sale bien en una fotocopia y no promete nada que el comercio no cumpla.

## Principios

1. **Una pieza, una acción.** Cada pieza pide una sola cosa (venir el sábado, pedir por WhatsApp, juntar
   sellos). Si hay tres mensajes, son tres piezas.
2. **Se lee en tres segundos con los textos grandes.** Mirando solo el nivel 1 se entiende qué es, cuánto
   sale y hasta cuándo.
3. **Lo específico es lo humano.** El dato propio del cliente (desde qué año, quién atiende, el producto que
   todos piden) vale más que cualquier adorno. Nunca adjetivos genéricos.
4. **Del mundo real, no de una plantilla.** La personalidad sale de la gráfica que ya existe en el barrio
   (cartel de fibrón, pizarra, sello, letrero pintado), tomada por su lógica, no imitada como disfraz.
5. **Diseñar para el peor caso de producción.** Impresora casera en blanco y negro, fotocopia de copiería,
   celular viejo con brillo bajo. Si funciona ahí, funciona en todos lados.
6. **Honestidad comercial.** Precio final real, condiciones visibles, fechas exactas. Una oferta publicada
   obliga al comercio (Ley 24.240, arts. 7 y 8).
7. **Una decisión fuerte por pieza.** Un tamaño desmesurado, un color plano, un sello torcido: una sola cosa
   que se recuerde, ejecutada con disciplina.

## Estrategias por capa

### Concepto y referencia vernácula (elegir una sola por cliente)

- **Cartel de fibrón sobre papel afiche fluo** (verdulería, carnicería, almacén). La lógica: nombre del
  producto en mayúsculas gruesas, precio gigante, unidad («x kg», «c/u») pegada al precio, un subrayado.
  Cómo evocarlo sin kitsch: diseñar en negro puro para que el comercio lo imprima sobre papel color fluo de
  librería; trazos gruesos de grosor parejo; subrayados y círculos como `<path>` levemente irregulares (no
  rectas perfectas). Nada de fuentes «manuscritas» falsas ni texturas de papel simuladas.
- **Pizarra de tiza** (panadería, dietética, kiosco, café). Solo en piezas digitales (post, estado): fondo
  verde muy oscuro o grafito plano, texto blanco o tiza amarilla, listas alineadas a la izquierda con
  precios en columna. En impreso no: gasta tóner y se emparcha en la fotocopia.
- **Letrero pintado y letra de caja** (ferretería, peluquería, almacén con historia). Mayúsculas
  geométricas con una sombra plana en una sola dirección y un filete fino de marco. Si el concepto pide
  fileteado de verdad, seguir la guía `fileteado.md`; acá no se adorna «un poquito con filete».
- **Sello de goma** (dietética, panadería, fidelización). Un círculo o rectángulo de una sola tinta, rotado
  entre −4° y 4°, con texto real («DESDE 1987», «HORNEADO ACÁ»). Uno por pieza, como firma.
- **Etiqueta de góndola, ticket de balanza o papel de almacén** (almacén, fiambrería, kiosco). Monoespaciada
  o condensada, filetes punteados, datos en columnas. Ideal para listas y carteles de precios.

### Tipografía

- Máximo dos familias por pieza; casi siempre alcanza una en dos pesos muy distintos (400 y 800/900).
- Saltos de tamaño de 3x o más entre el precio o el título y el resto. Tres niveles, no cinco.
- **SVG: solo pilas de fuentes del sistema** (el SVG no carga fuentes web en todos los visores). Pilas
  probadas en Windows, macOS/iOS y Android:
  - Condensada de cartel: `'Avenir Next Condensed','Bahnschrift SemiCondensed','Roboto Condensed','Arial Narrow',sans-serif` en 700–800.
  - Negra para cifras: `Impact,'Arial Black',sans-serif`, solo para el número del precio, nunca en párrafos.
  - Serif de almacén: `Georgia,'Noto Serif','DejaVu Serif',serif`.
  - Etiqueta o máquina de escribir: `'American Typewriter','Courier New',monospace`.
- **HTML impreso:** puede cargar hasta dos familias (Fontshare o Google Fonts, `display=swap`, solo los
  pesos usados) con la misma pila del sistema como respaldo; la pieza tiene que verse bien aunque la fuente
  web no cargue.
- Cifras de forma lineal (no «de estilo antiguo»), con 3, 6, 8 y 9 abiertos. Formato argentino:
  `$ 4.500` (punto de miles, sin decimales si son ,00; con coma si los hay: `$ 1.249,50`).

### Color

- Un color dominante sacado del local (toldo, fachada, delantal, bolsa, la caja registradora) o de lo que dijo
  el cliente, más un acento usado solo para el precio o la acción. Neutros: negro y blanco.
- El contraste WCAG mide luminancia, así que si texto y fondo superan **7:1** también sobreviven a la
  fotocopia en blanco y negro. Rojo sobre verde, naranja sobre rojo o amarillo sobre blanco se vuelven el
  mismo gris: prohibidos para texto.
- Impreso: el color va en franjas, marcos o una mancha detrás del precio, como máximo 20 % de la superficie;
  nunca fondo lleno (tóner, rayas de la impresora y bordes blancos).

### Impresión (flyer A5, carteles A4, tarjetas)

- A5 = 148 × 210 mm; A4 = 210 × 297 mm. **Sin sangrado**: las impresoras caseras no imprimen al borde.
  `@page { size: 148mm 210mm; margin: 8mm }` y nada importante a menos de 10 mm del borde del papel.
- `-webkit-print-color-adjust: exact; print-color-adjust: exact;` para que salgan los fondos de color, y en
  el LEEME: imprimir al 100 % («tamaño real», no «ajustar a la página»). Si la copiería solo tiene A4,
  explicar «2 páginas por hoja» y cortar al medio.
- Grises: entre 20 % y 60 %; más claros desaparecen en la fotocopia, más oscuros se empastan. Nunca texto
  sobre gris. Texto blanco calado sobre color solo desde 14 pt en negrita.
- Grandes planos negros solo en digital. En impreso, el negro es para letras y filetes.
- **Distancia de lectura:** regla de rotulación de 2,5 mm de altura de mayúscula por metro como mínimo.
  - Vidriera o pared, a 2–3 m: título con mayúsculas de **15 mm o más** (≈ 60 pt).
  - Mostrador, a 1 m: datos de 14 pt o más.
  - Nada impreso por debajo de 9 pt; las condiciones de una oferta, nunca por debajo de 4 mm de alto.
- Tarjetas de sellos: indicar cartulina de 180 a 240 g en la copiería y líneas de corte grises de 0,3 mm.

### Redes y estados de WhatsApp

- El catálogo pide posts de **1080 × 1080**. Instagram muestra la grilla del perfil en 3:4, así que de un
  cuadrado se ve solo el centro de **810 px de ancho**: el mensaje clave va ahí. (Si algún día se pide feed
  vertical, 1080 × 1350 rinde más espacio en pantalla.)
- Estados e historias **1080 × 1920**: arriba va el nombre y la hora, abajo la barra de respuesta. Zona
  segura: **x entre 64 y 1016, y entre 250 y 1500**. Afuera solo color o fondo.
- Un celular muestra el lienzo de 1080 px a unos 360–410 px: todo se ve a un tercio. Título de 96 px o más,
  texto de 40 px o más, nada por debajo de 32 px.
- Poco texto: hasta 15 palabras en un post y 20 en un estado. El resto va en el texto de la publicación
  (`textos.md`).

### Promociones y precios honestos

- **Jerarquía:** 1) precio final de la promo o el beneficio («2x1»), 2) producto y presentación exacta, 3)
  vigencia, 4) condiciones. El precio anterior va más chico, tachado y en la misma unidad, y solo si es el
  precio que el comercio cobró de verdad hasta ese día.
- Porcentajes y precios finales: solo los que dio el cliente o vienen en `<calculos>`; nunca hacer la cuenta.
- **2x1:** escribir «Llevá 2, pagá 1» y aclarar sobre qué producto y si se pueden mezclar variedades.
- **Vigencia con fechas exactas de inicio y fin** («del lunes 3 al domingo 9 de noviembre»), porque la oferta
  obliga mientras dure y tiene que decir cuándo empieza y termina (Ley 24.240, art. 7). Si hay tope de
  stock, en cantidad («hasta agotar 30 docenas»), no «unidades limitadas».
- Lo que se publica forma parte del contrato (art. 8) y la publicidad que confunde está prohibida (Decreto
  274/2019, art. 11): nada de «el más barato del barrio», urgencias falsas ni asteriscos que esconden la
  letra chica.
- Res. SIC 446/2025 (vigente desde el 3/12/2025): vigencia, identidad del oferente, condiciones y límite de
  stock tienen que poder consultarse. En el impreso de barrio se ponen en la pieza; si no entran, una
  franja inferior a todo el ancho, en negrita, de al menos 4 mm y 5 % de la altura: «Más información y
  condiciones: WhatsApp 11 …».
- Si la pieza muestra un precio, aplica también la Res. SIC 4/2025 (tabla `normativa_precios`): precio final
  con impuestos y, más chico, el precio sin impuestos nacionales cuando viene en `<calculos>`. Precios en
  cuotas solo si el cliente dio contado, cuotas y CFT; si no, no se mencionan cuotas.
- Sorteos: «sin obligación de compra» dentro de la pieza.

### Tarjeta de sellos (fidelización)

- 85 × 55 mm, 10 por A4 (2 columnas × 5 filas: 170 × 275 mm, con 20 mm de margen a los costados y 11 mm
  arriba y abajo).
- **Progreso regalado** (Nunes y Drèze, 2006): con 8 compras necesarias en ambos casos, una tarjeta de 10
  casilleros con 2 ya sellados se completó casi el doble que una de 8 vacía (34 % contra 19 %). Diseño por
  defecto: 10 casilleros, los dos primeros impresos como sellados y con un motivo («2 de regalo por
  estrenar la tarjeta»); el regalo explicado funciona, el regalo sin motivo menos.
- Casilleros de 12 mm de diámetro, 3 mm de separación, en dos filas de 5; el último distinto (el premio,
  dibujado o escrito). Lugar para el nombre del cliente.
- Antifraude sin complicar: se sella con el sello o la rúbrica del local (no con una tilde que cualquiera
  copia), cada tarjeta con número (`Nº 001` a `Nº 010` en la hoja) y un espacio para la fecha del último
  sello si el cliente pone vencimiento.
- Texto: qué se gana, cada cuántas compras, compra mínima solo si el cliente la dio, vencimiento si lo hay,
  «no canjeable por dinero». Escrito como habla el dueño: «La 10.ª va por nuestra cuenta», no «Programa de
  fidelización».
- El cartel de mostrador A5 lo explica en tres renglones grandes y muestra una tarjeta en tamaño real.

### Carteles de precios (precios_regla)

- A4 con 8 carteles de 105 × 74 mm (2 × 4), horizontales como pide la Res. 4/2025, en negro sobre blanco
  para que se puedan imprimir en papel fluo o corregir a mano.
- Jerarquía fija de cada cartel:
  1. **Precio final**: cifras de 22 mm de alto o más (≈ 90 pt), negrita, signo `$` al 60 % del tamaño
     sobre la misma línea base.
  2. **Producto y presentación** («Yerba X 1 kg»): 14–18 pt negrita, arriba del precio.
  3. **Precio por unidad de medida** («$ 4.500 x kg»), del valor de `<calculos>`: 10–12 pt, visible, nunca
     más grande que el precio final.
  4. **«PRECIO SIN IMPUESTOS NACIONALES $ …»**: 8–9 pt en mayúsculas, debajo. Si el valor es null, el renglón
     con la leyenda y «$ ______» para completar a mano.
- Cifras tabulares alineadas a la derecha en la lista de precios, para comparar de un vistazo. En la página
  para celular, el precio en la misma línea que el producto.

### Detalles técnicos para SVG y HTML escritos a mano

- SVG con `xmlns`, `viewBox="0 0 1080 1080"` (o `0 0 1080 1920`) y `width`/`height` iguales. Sin
  `foreignObject`, sin imágenes externas, sin emojis (cada teléfono los dibuja distinto). Escapar `&` como
  `&amp;`.
- **El SVG no corta líneas solo.** Ancho estimado = caracteres × tamaño × factor: 0,55 para minúsculas,
  0,72 para mayúsculas en negrita, 0,5 en condensada, 0,56 para cifras. Calcular con la fuente de respaldo
  más ancha de la pila y dejar el resultado por debajo del 90 % del ancho disponible; si no entra, bajar el
  tamaño o partir con `<tspan x="…" dy="…">`. `textLength` solo como último recurso, con
  `lengthAdjust="spacing"`.
- Fotos del cliente: solo en HTML, con `<img src="{{FOTO:n}}">` y `object-fit: cover` en un contenedor de
  tamaño fijo. En SVG, ninguna foto; si no hay fotos, la pieza se sostiene con tipografía.
- QR: solo en HTML, escribiendo `{{QR:https://wa.me/549…}}` dentro de un `div` de 30 × 30 mm como mínimo
  en impreso (25 mm si es una tarjeta), con margen blanco alrededor y la acción escrita al lado («Escaneá
  para pedir»). Nunca dibujar un QR. En los SVG va el número de WhatsApp escrito grande.

## Plantilla de dirección de arte (se completa antes de dibujar)

**A. Pieza y uso:** qué acción pide; dónde vive (vidriera, mostrador, góndola, estado, lista de difusión);
a qué distancia se lee; cómo se imprime (casa en blanco y negro, copiería color, papel fluo, cartulina).

**B. Concepto:** el dato propio del cliente que va en la pieza; mensaje del nivel 1 en 8 palabras o menos,
escrito como habla el dueño; la referencia vernácula elegida y por qué le corresponde a este rubro y barrio;
qué NO es (3 cosas); la única decisión fuerte.

**C. Decisiones:** familias y pila de respaldo con pesos; tamaños de los tres niveles por formato (A5, 1080,
1920); color dominante (origen y hex), acento y su uso exclusivo, contraste verificado ≥ 7:1 en lo impreso;
márgenes y zona segura; ancho estimado de cada línea larga contra el disponible.

**D. Datos y legales:** precios exactos del cliente o de `<calculos>`; precio sin impuestos nacionales y
precio por unidad; vigencia con fechas; condiciones, stock y quién ofrece; qué falta y queda como
[completar] y en «Revisá esto» del LEEME.

## Prohibidos por defecto y qué usar en su lugar

| No | En su lugar |
|---|---|
| Fondo oscuro con texto neón o brillante en impresos | Negro sobre blanco o papel de color; el oscuro, solo en digital |
| Degradados, brillos, sombras suaves, glassmorphism | Colores planos y una sombra plana en una dirección, si la referencia la tiene |
| Cajitas con íconos, flechas, tildes, líneas decorativas sueltas | Jerarquía por tamaño y peso; un subrayado de fibrón como único gesto |
| Negritas y subrayados repartidos por todo el texto | Un solo énfasis por pieza |
| Explosión o estrella con «¡OFERTA!», «SALE», «Black Friday» | El precio gigante y el producto; palabras en castellano |
| Emojis como íconos o viñetas | Texto, cifras o un sello |
| Verduras, panes o herramientas de clip art, ilustraciones genéricas, imágenes generadas | Fotos del cliente con `{{FOTO:n}}` o pura tipografía |
| Fuentes «manuscritas» falsas (Comic Sans, marker de plantilla), texturas de papel o pizarra simuladas | La lógica del cartel real: mayúsculas gruesas, cifras grandes, trazos parejos |
| Filete como adorno suelto en cualquier rubro | Fileteado completo según `fileteado.md`, solo cuando el concepto lo pide |
| Todo centrado, tres columnas iguales, mockups de celular | Alineación a la izquierda o composición del cartel real |
| «Imperdible», «calidad premium», «el mejor del barrio», «últimas horas» sin fecha | El hecho: precio, cantidad, fecha, desde qué año |
| Asteriscos con letra chica, «unidades limitadas», precio anterior inventado | Condiciones a la vista, stock en cantidad, precio anterior solo si es real |
| Precio sin unidad, sin vigencia o sin impuestos incluidos | Precio final, unidad, vigencia y precio sin impuestos nacionales según la tabla |
| Fondos llenos de color en impresos | Franjas o marcos que ocupen hasta 20 % de la hoja |
| QR dibujado o foto de internet | `{{QR:...}}` y `{{FOTO:n}}` en HTML |

## Checklist antes de entregar

- Si tapo el nombre, ¿se sabe de qué negocio es? ¿Está el dato propio del cliente?
- Mirando solo el nivel 1, ¿se entiende qué, cuánto y hasta cuándo en tres segundos?
- Impreso: nada a menos de 10 mm del borde; título de 15 mm o más si va en vidriera; nada por debajo de 9 pt;
  contraste ≥ 7:1; ¿se lee igual en gris? ¿Hay fondos llenos?
- Redes: post con lo clave en el centro de 810 px; estado dentro de x 64–1016, y 250–1500; título ≥ 96 px,
  texto ≥ 40 px; hasta 15–20 palabras.
- SVG: `viewBox` correcto, pilas de sistema, cada línea larga estimada por debajo del 90 % del ancho, sin
  fotos, sin emojis, `&amp;` escapado.
- Promo: precios tal cual los dio el cliente o `<calculos>`; fechas exactas de inicio y fin; condiciones y
  stock visibles; precio anterior real; ninguna promesa que no cumpla.
- Tarjeta: 85 × 55 mm, 10 por A4, casilleros de 12 mm, 2 regalados con motivo, numerada, condiciones en el
  dorso o al pie.
- Carteles de precios: precio final lo más grande; unidad y precio sin impuestos más chicos pero legibles;
  los null con «$ ______» y listados en el LEEME.
- Cero palabras de la lista prohibida; todo en castellano rioplatense, con «vos».

## Instrucciones para el modelo

<graphic_direction>
You tend to produce generic "AI flyer" graphics: dark backgrounds with bright text, icon boxes, arrows,
checkmarks, scattered bold, starbursts, clip-art produce, emojis. Do not.
1. Before drawing, fill the art-direction sheet (piece and use, reading distance, how it will be printed,
   the client's own fact, a level-1 message of 8 words or fewer, ONE vernacular reference with a reason,
   fonts, three type sizes per format, dominant and accent colors with hex and contrast, legal data,
   missing data). Derive it only from the client's answers and photos. Put it in LEEME.md under
   "Dirección de arte".
2. Evoke Argentine shop graphics by their logic, not by costume: marker-on-fluo-paper signs (pure black,
   bold caps, huge price, unit next to it, one slightly irregular underline path), chalkboards (digital
   only), painted block letters, a single rubber stamp, shelf-label typography. For fileteado follow
   fileteado.md only when the concept calls for it. No fake handwriting fonts or simulated textures.
3. SVG: xmlns, exact viewBox, system font stacks only (listed above), no foreignObject, no images, no
   emojis, escape &. SVG does not wrap: estimate width = chars × font-size × factor (0.55 lowercase, 0.72
   bold caps, 0.5 condensed, 0.56 digits) with the widest fallback; keep under 90% of the available
   width or break with tspan. Square posts: key message within the central 810 px. 1080x1920: content
   within x 64-1016, y 250-1500. Title ≥ 96 px, text ≥ 40 px, nothing under 32 px, ≤ 15-20 words.
4. Print HTML: @page with exact size and 8 mm margin, no bleed, nothing important within 10 mm of the edge,
   print-color-adjust: exact, color only in bands or frames (≤ 20% of the area), text contrast ≥ 7:1 so it
   survives a B/W photocopy, grays 20-60%, nothing under 9 pt, window titles ≥ 15 mm cap height. Up to two
   web font families with the system stack as fallback. Photos only as <img src="{{FOTO:n}}">; QR only as
   {{QR:...}} in a box ≥ 30 mm (25 mm on cards); never draw a QR.
5. Offers: use prices exactly as given or from <calculos>; never compute. Final price largest; old price
   smaller and struck through only if the client gave it as the real current price. Exact start and end
   dates, conditions and stock quantity visible on the piece (or a full-width bold bottom band ≥ 4 mm and
   ≥ 5% of the height pointing to the WhatsApp). "Llevá 2, pagá 1" states the product. No superlatives,
   fake urgency, asterisks, installments without CFT. Apply normativa_precios when a price is shown.
6. Loyalty cards: 85x55 mm, 10 per A4 (2x5), 10 circles of 12 mm, first 2 pre-stamped with a stated reason,
   distinct reward circle, card number, name line, conditions in plain rioplatense.
7. Price signs: 8 per A4 (105x74 mm, landscape), final price digits ≥ 22 mm, product and size above, unit
   price and "PRECIO SIN IMPUESTOS NACIONALES" smaller below; null values as "$ ______".
8. Copy in rioplatense Spanish with "vos"; facts instead of adjectives; never invent prices, dates, reviews
   or claims; mark gaps as [completar] and list them in LEEME.md. After building, self-audit against the
   prohibited table and checklist and report any hit in LEEME.md.
</graphic_direction>

## Fuentes

- 404 Media, «We are living in a ChatGPT flyer pandemic»: https://www.404media.co/we-are-living-in-a-chatgpt-flyer-pandemic/
- AI Weekly, resumen de los rasgos de los flyers de ChatGPT: https://aiweekly.co/alerts/404-media-chronicles-a-chatgpt-flyer-pandemic-backlash
- Creative Bloq, diseñadores que corrigen flyers hechos con IA: https://creativebloq.com/design/graphic-design/graphic-designers-are-trying-to-fix-peoples-terrible-ai-flyers
- Venngage, «AI slop in design»: https://venngage.com/blog/ai-slop-in-design/
- Mika Reyes, cómo reconocer diseño hecho con IA: https://mikareyes.com/ai/how-to-spot-ai-made-graphic-design-and-posters
- Axios, comercios de Utah que prometen publicidad sin IA (agosto de 2026): https://www.axios.com/local/salt-lake-city/2026/08/03/ai-flyers-utah-businesses-boycott-customer-complaints
- Artswave, «Only Hands»: https://artswave.org/only-hands-a-rising-rejection-of-ai-generated-design/
- Ley 24.240 de Defensa del Consumidor, texto actualizado: https://www.argentina.gob.ar/normativa/nacional/ley-24240-638/texto
- Resolución SIC 446/2025, régimen de publicidad de ofertas: https://www.argentina.gob.ar/node/486561
- abogados.com.ar, «Resolución 446/2025 – Nueva simplificación sobre legales en publicidades»: https://abogados.com.ar/index.php/resolucion-4462025-nueva-simplificacion-sobre-legales-en-publicidades-que-ofrezcan-bienes-y-servicios/37885
- Resolución SIC 12/2024 (antecedente derogado): https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-12-2024-398486
- Decreto 274/2019 de Lealtad Comercial: https://www.consejosalta.org.ar/wp-content/uploads/DECRETO-274.pdf
- Resolución SIC 4/2025, exhibición de precios: https://www.argentina.gob.ar/normativa/nacional/norma-408455/texto
- Nunes y Drèze (2006), «The Endowed Progress Effect», Journal of Consumer Research 32(4): resumen en https://coglode.com/nuggets/endowed-progress-effect y https://knowledge.wharton.upenn.edu/?p=5630
- Neal Schaffer, grilla 3:4 de Instagram: https://nealschaffer.com/instagram-post-size/
- Sked Social, zonas seguras de historias según Meta: https://skedsocial.com/blog/best-instagram-image-and-video-size-recommendations
- Moda, interfaz de los estados de WhatsApp: https://moda.app/resources/sizes/whatsapp-status
- Superchat, tamaños y zona segura de WhatsApp: https://help.superchat.com/en/articles/701423-whatsapp-media-sizes-formats
- Admakeai, sobre el origen incierto de las cifras de zona segura: https://admakeai.com/blog/whatsapp-status-ads
- Optsigns, altura de letra y distancia de lectura: https://optsigns.com/es/road-sign-size-visual-distance-readability-guidelines-safety
- Flag & Banner, tabla de visibilidad de letras: https://www.flagandbanner.com/customer_service/Letter-Visibility-Chart.asp
- BoD, gráficos y gestión del color para impresión (grises mínimos): https://bod.com.es/bodfiles/ES-Storage/documents/Downloads/Graficos_y_gestion_del_color.pdf
- Universidad de Palermo, gráfica popular en el cartel contemporáneo: https://dspace.palermo.edu/ojs/index.php/cdc/article/download/11489/19818
