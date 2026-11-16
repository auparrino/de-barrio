# Dirección de arte de De Barrio

Ficha completada a partir de la plantilla «sitios web con personalidad». Cualquier cambio visual del sitio
sale de acá; si algo no está definido, se define acá primero.

## Concepto

**En una frase:** el letrero fileteado de un almacén de barrio, con su lista de precios en la pared y el
ticket de la caja.

**Metáfora física:** una tabla fileteada pintada con esmalte sobre fondo oscuro (la cabecera) y, abajo,
la lista de precios del almacén y el ticket de papel térmico (el mostrador).

**Referencias de afuera de la web:**
- «El ABC del fileteado porteño» de Alfredo Genovese: la estructura del panel, el volumen y la paleta
  (ver `data/guias/fileteado.md`).
- La lista de precios del almacén, con los puntitos entre el producto y el precio.
- El ticket de caja: angosto, renglones alineados, total abajo, borde cortado.

**Tono:** de mostrador pero no de chiste; claro como el almacenero que te explica algo, sin vender humo.

**Qué NO es:** una startup de software; una agencia de marketing; un souvenir de San Telmo.

**Momento memorable:** el letrero fileteado de la cabecera. Al elegir un servicio, el ticket «se
imprime»: es el único movimiento del sitio y responde a una acción.

**Restricciones elegidas:** dos familias tipográficas; el fileteado solo en el letrero, la llave bajo el
título de la lista y la 404; el resto del sitio, papel y tinta. Sin íconos. Ninguna foto ni imagen
generada: los adornos se dibujan con código (`tools/filete.py`) siguiendo las reglas del manual.

## Tokens

### Tipografía
- **Letras del letrero y títulos:** Yeseva One (OFL, vía Fontsource): romana de mucho contraste y remates
  abiertos, cercana a las romanas de pincel del fileteado (Rye se descartó: es toscana de cartel del Far
  West). En el letrero lleva frente, cuerpo en perspectiva y sombra proyectada abajo a la derecha.
- **Lectura:** Atkinson Hyperlegible Next (OFL), 400 y 800, con cifras tabulares en el ticket y la lista.
- **Escala:** 15 / 19 / 44 px y el letrero escalado al ancho (4,6 % del panel).

### Color
- **Letrero (paleta de la tabla del manual, colores planos):** `--contrafondo #23160F`, verde `#3FAE5A`,
  ocre `--ocre-luz #F6CB6B` / `--ocre-sombra #8A5A12`, rosa `#E8607A`, celeste `#7EC3E6`, bermellón
  `#C8261C` para el firulete, blanco para brillos. Cada color tiene base, luz y sombra (`tools/filete.py`).
- **Mostrador:** `--tinta #16130F`, `--papel #FFFFFF`, `--precio #B01E18` (**solo** precios y totales),
  `--borrado #4F574D`; ticket activo en `--ocre-luz`.
- **Contraste verificado:** ocre luz sobre contrafondo 11,5:1; celeste sobre contrafondo 9,1:1; tinta
  sobre papel 18,5:1; borrado sobre papel 7,5:1; precio sobre ocre luz 4,5:1 (solo en el total, que es
  texto grande).

### Layout
- Columna principal alineada a la izquierda, ancho máximo 1180 px, margen 24 px (móvil 16).
- Desktop: lista de precios a la izquierda (7 de 12 columnas), ticket fijo a la derecha (4 de 12).
- Densidad: densa, como una lista de precios. Mucho texto, poco aire decorativo.
- Radio: 0. Sombras: solo las proyectadas del fileteado y de las letras del letrero (recortadas, sin blur). Separadores: líneas de puntos y bordes de 2 px de tinta.
- **La sección que rompe el patrón:** el catálogo no son tarjetas, es una lista de precios con
  puntitos entre el nombre y el precio, agrupada por góndola.

### Imagen y detalle
- Fotografía: ninguna por ahora (no tenemos fotos propias; no usamos de stock).
- Fileteado: `public/filete.svg` (letrero, acanto, esquina, ramo, cinta, llave), generado con `python3 tools/filete.py public/filete.svg`.
- Íconos: ninguno. Favicon: una flor plana.
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
- Sombras difusas, radios, degradados, emojis, íconos de línea → nada; jerarquía por tipografía y tinta.
- Fileteado de memoria o por fuera de las reglas de `data/guias/fileteado.md`.
- Testimonios → no hay clientes todavía; no se inventan.
