---
servicios: [sitio_web]
fuente: "Plantilla para sitios web con personalidad (y cómo evitar que parezcan hechos por IA)", investigación provista por Augusto, noviembre de 2026
---

# Guía: sitios web con personalidad

Un sitio parece hecho por IA cuando nadie tomó las decisiones de diseño y el modelo las completó con el
promedio de lo que vio: violeta + Inter + hero centrado + tres tarjetas, o su versión 2026, fondo crema +
serif itálica + naranja óxido. La salida no es prohibir esos rasgos de a uno, sino definir un concepto
propio antes de escribir código y bajarlo a decisiones concretas (tipografía, color, grilla, voz).

## Principios

1. **Concepto antes que pantalla.** Propósito, tono, restricciones y diferenciación: ¿qué es lo único que
   alguien va a recordar? La clave es la intencionalidad, no la intensidad.
2. **Especificar la alternativa, no solo prohibir.** Prohibir mueve al modelo al siguiente default.
3. **Una decisión fuerte, ejecutada con disciplina.** Contrastes extremos: pesos 100/200 contra 800/900,
   saltos de tamaño de 3x o más.
4. **El color significa algo.** Un dominante con acentos marcados; tokens con nombre de función.
5. **El contenido manda en el layout.** La grilla responde al material, no a la plantilla de landing SaaS.
6. **Lo específico es lo humano.** Fotos propias, nombres reales, números reales.
7. **Trabajar con la veta de la web.** La personalidad no justifica romper el scroll ni los formularios.
8. **Novedad con medida.** Un buen momento sorprende; diez cansan.

## Estrategias por capa

- **Tipografía:** una protagonista y una de soporte con contraste real; salir de Google Fonts por default
  (Fontshare, Velvetyne, Collletttivo, League of Moveable Type); ojo con las «alternativas a Inter» que ya
  son slop (Space Grotesk, Bricolage Grotesque, Newsreader, Crimson Pro, IBM Plex, JetBrains Mono); usar
  funciones OpenType; escala con saltos grandes y pocos niveles.
- **Color:** un dominante, un acento, neutros teñidos; paleta sacada de una referencia física; nombres
  semánticos; chequear contraste (4,5:1).
- **Layout:** no todo centrado ni en filas de tres; densidad elegida; secciones con distinta cadencia;
  componentes que nacen del contenido.
- **Imagen:** fotografía propia aunque sea de celular; nunca stock ni 3D genérico; nunca emojis como viñetas.
- **Movimiento:** un momento orquestado en lugar de animaciones repartidas; el movimiento responde a una
  acción; respetar `prefers-reduced-motion`.
- **Copy:** reemplazar cada adjetivo por el hecho que esconde; mayoría de líneas llanas y específicas;
  primera persona, opinión, historia; escribir como se habla (rioplatense).

## Plantilla de dirección de arte (se completa antes de escribir código)

**A. Concepto:** qué hace este negocio que otros del rubro no; si el sitio fuera un objeto físico qué sería;
qué época, lugar o subcultura le corresponde; qué tiene que pensar alguien a los cinco segundos; qué es lo
único que va a recordar; con quién NO lo tienen que confundir; qué material real hay (fotos, historias,
números); cuál es el detalle maníaco del dueño.

**B. Ficha:** concepto en una frase; metáfora física; 3 referencias de fuera de la web; tono «X pero no Y»;
qué NO es (3 cosas); momento memorable; restricciones elegidas.

**C. Decisiones:** tipografía (protagonista, lectura, pesos, escala); color (origen, dominante, acento y su
uso exclusivo, neutros, tokens semánticos, contraste verificado); layout (grilla, alineación, densidad,
radio, sombras, la sección que rompe el patrón); imagen y detalle (fotos, íconos, 404, footer); movimiento
(el momento, duraciones, versión reducida); voz (3 palabras que es y 3 que no, persona, palabras prohibidas,
frase del hero escrita a mano, un dato concreto por sección).

## Prohibidos por defecto y qué usar en su lugar

| No | En su lugar |
|---|---|
| Degradados violeta/índigo; orbes que brillan | Un color dominante sacado de la referencia física; fondos planos o con textura real |
| Fondo crema/beige/pergamino + acento terracota | Neutro decidido por el concepto (blanco puro, negro, gris frío, un color saturado) |
| Inter, Roboto, Arial, system-ui sin ajustar; Space Grotesk | Fuente con carácter elegida por el concepto |
| Serif itálica resaltada; eyebrow labels en mono mayúscula con tracking amplio | Énfasis por peso, tamaño o color, una o dos veces |
| Hero centrado + 3 tarjetas con ícono + testimonios de 5 estrellas + CTA | Estructura derivada del contenido; testimonios solo si son reales |
| Contadores 01/02/03, tickers, tarjetas dentro de tarjetas | Listas, tablas, texto corrido |
| Glassmorphism, sombras suaves y mismo radio en todo | Un solo tratamiento de superficie, con criterio |
| Línea de color en el borde izquierdo; texto con degradado | Jerarquía por tipografía y espacio |
| Emojis como íconos; íconos de línea en cuadraditos redondeados | Íconos propios, un set ajustado o nada |
| Fotos de stock, 3D genérico, imágenes generadas | Fotos del cliente |
| Fade + slide-up en cada sección; hover en cada tarjeta | Un momento orquestado; movimiento como respuesta a acciones |
| «Unlock», «seamless», «elevá», «potenciá», «revolucionario», «en el mundo actual» | El hecho concreto que la palabra esconde |
| «No es X, es Y»; triadas en cada frase; guiones largos; negrita en cada término | Frases llanas, ritmo desparejo, puntuación común |

## Checklist antes de entregar

- Si tapo el nombre, ¿se sabe de quién es el sitio? ¿Hay algo que solo este negocio podría tener?
- ¿Cada sección tiene un dato concreto? ¿Cero palabras prohibidas? ¿Suena a una persona leído en voz alta?
- Contraste ≥ 4,5:1 (≥ 3:1 en texto grande); foco visible; títulos en orden; textos alternativos útiles.
- `prefers-reduced-motion` respetado; nada se mueve solo más de 5 segundos.
- Máximo dos familias tipográficas; imágenes livianas.
- 404, footer con datos reales, favicon e imagen para compartir.

## Instrucciones para el modelo

<design_direction>
You tend to converge on generic, "on-distribution" design. Do not.
1. Before writing any HTML, fill the art-direction sheet (concept in one sentence, physical metaphor taken
   from the client's trade and neighborhood, tone "X but not Y", what it is NOT, the one memorable thing,
   tokens: two fonts with weights and scale, semantic colors with hex and contrast, grid, radius, shadows,
   the one orchestrated motion, voice). Derive it only from the client's answers and photos.
2. Fonts: load at most two families, from Fontshare (https://api.fontshare.com/v2/css?f[]=...) or Google
   Fonts, with display=swap and only the weights you use. Choose them from the concept; avoid Inter,
   Roboto, Arial, Space Grotesk, Bricolage Grotesque, Newsreader, Crimson Pro, IBM Plex, JetBrains Mono,
   Poppins and Montserrat. Give a system fallback stack.
3. Execute only those tokens. Derive the layout from the content; at least one section must break the
   landing-page pattern.
4. DO NOT USE the prohibited list above; use the listed alternative.
5. Copy: Spanish, rioplatense, "vos". Use only facts provided; never invent stats, clients, reviews or
   testimonials; leave a visible [completar] if missing and list it in LEEME.md. Replace adjectives with
   facts. No em dashes, at most one list of three per section.
6. Quality floor: contrast ≥ 4.5:1, visible focus, semantic headings, prefers-reduced-motion, nothing
   auto-moves > 5 s.
7. Put the filled sheet at the top of LEEME.md under "Dirección de arte", and after building, self-audit
   against the prohibited list and the checklist and report any hit there.
</design_direction>
