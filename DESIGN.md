# Dirección de arte de Vecino Digital

Ficha completada a partir de la plantilla «sitios web con personalidad». Cualquier cambio visual del sitio
sale de acá; si algo no está definido, se define acá primero.

## Concepto

**En una frase:** la lista de precios de un almacén de barrio, pegada en la pared con cinta, y el ticket
de la caja que te dice cuánto pagás.

**Metáfora física:** el cartel de precios escrito con fibrón sobre papel afiche amarillo, y el ticket de
papel térmico de la caja registradora.

**Referencias de afuera de la web:**
- Los carteles de precios de verdulería en papel afiche fluo, letra condensada con fibrón negro y el
  precio en rojo.
- La lista de precios del almacén, con los puntitos entre el producto y el precio.
- El ticket de caja: angosto, renglones alineados, total abajo, borde cortado.

**Referencias web para problemas puntuales:** listas tipográficas de Fonts In Use (para la lista de
precios); recibos de comercio en Siteinspire (para el ticket).

**Tono:** de mostrador pero no de chiste; claro como el almacenero que te explica algo, sin vender humo.

**Qué NO es:** una startup de software; una agencia de marketing; una app con dashboard.

**Momento memorable:** al elegir un servicio o cambiar un adicional, el ticket «se imprime»: el papel
avanza un renglón hacia abajo con el nuevo total. Es el único movimiento del sitio y responde a una
acción del usuario.

**Restricciones elegidas:** dos familias tipográficas; tres colores más la tinta; sin sombras; sin
bordes redondeados; sin íconos; ninguna imagen que no sea tipografía.

## Tokens

### Tipografía
- **Protagonista:** Big Shoulders Display (Patric King, OFL, vía Fontsource). Condensada, de cartelería;
  se usa en 800 para títulos y precios, y en 300 para los subtítulos grandes. Por qué: se parece a la
  letra condensada del cartel pintado sin imitar letra manuscrita.
- **Lectura:** Atkinson Hyperlegible Next (Braille Institute, OFL, vía Fontsource), 400 y 800. Diseñada
  para distinguir caracteres parecidos (1/l/I, 0/O): sirve para precios y para gente que lee poco en
  pantalla. Cifras tabulares (`font-variant-numeric: tabular-nums`) en el ticket y la lista.
- **Escala:** 15 / 19 / 48 / 112 px (en móvil 15 / 18 / 36 / 64).

### Color
- **Origen:** papel afiche amarillo + fibrón negro + fibrón rojo de los carteles de verdulería; ticket
  de papel térmico.
- `--tinta: #16130F` texto y acciones (negro de fibrón, levemente cálido).
- `--afiche: #FFE03A` color dominante: fondo de la cabecera y del ticket activo.
- `--papel: #FFFFFF` fondo de lectura (blanco del ticket, no crema).
- `--precio: #B01E18` **solo** para precios y totales. Contraste sobre blanco 6,9:1; sobre afiche 5,25:1.
- `--borrado: #4F574D` texto secundario (gris teñido hacia verde verdulería). 7,4:1 sobre blanco.
- `--renglon: #16130F` a 20% para líneas de puntos y separadores.
- **Contraste verificado:** sí (tinta sobre afiche 14,1:1; tinta sobre papel 18,5:1; borrado sobre papel 7,5:1 y sobre afiche 5,7:1).

### Layout
- Columna principal alineada a la izquierda, ancho máximo 1180 px, margen 24 px (móvil 16).
- Desktop: lista de precios a la izquierda (7 de 12 columnas), ticket fijo a la derecha (4 de 12).
- Densidad: densa, como una lista de precios. Mucho texto, poco aire decorativo.
- Radio: 0. Sombras: ninguna. Separadores: líneas de puntos y bordes de 2 px de tinta.
- **La sección que rompe el patrón:** el catálogo no son tarjetas, es una lista de precios con
  puntitos entre el nombre y el precio, agrupada por góndola.

### Imagen y detalle
- Fotografía: ninguna por ahora (no tenemos fotos propias; no usamos de stock).
- Íconos: ninguno.
- 404: «Esta página salió a buscar cambio.»
- Footer: fecha de los precios y fecha en que se verificaron las tablas de datos.

### Movimiento
- Único momento: el ticket avanza (translateY de -1 renglón a 0, 180 ms, `steps(4)` para que parezca
  el motor de la impresora) cuando cambia el total.
- `prefers-reduced-motion`: el ticket cambia sin moverse.

### Voz
- **Es:** directa, de barrio, con números. **No es:** entusiasta, técnica, publicitaria.
- Persona: nosotros hablando con vos.
- **Palabras prohibidas:** potenciá, impulsá, transformá, solución integral, revolucionario, sin
  complicaciones, llevá tu negocio al siguiente nivel, digitalizá, emprendedor.
- **Hero escrito a mano:** «Te ordenamos los números del negocio. Vos seguí atendiendo.»
- Cada sección tiene un dato concreto, sacado de `docs/investigacion/`.

## Prohibidos (además de la lista general de la plantilla)
- Tarjetas para el catálogo → lista de precios.
- Fondo crema o beige → blanco papel.
- Sombras, radios, degradados, emojis, íconos de línea → nada; jerarquía por tipografía y tinta.
- Testimonios → no hay clientes todavía; no se inventan.
