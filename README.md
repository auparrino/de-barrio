# Vecino Digital

Microconsultoría para comercios de barrio. La persona entra al sitio, elige un servicio, completa un
formulario y recibe la cotización al instante. Si paga (Mercado Pago), el sistema le pide a Claude que
genere el producto y se lo deja para descargar.

**Ningún pedido supera los $ 200.000**: si los adicionales y la urgencia pasan el tope, la diferencia se
bonifica sola.

## Servicios

| Servicio | Desde | Entrega |
|---|---:|---|
| Tarjeta de fidelidad y promos | $ 20.000 | Tarjeta de sellos y cartel para imprimir, reglas |
| Flyer / volante | $ 25.000 | A5 para imprimir + post y historia para redes |
| Ficha de Google Maps optimizada | $ 30.000 | Descripción, categorías, FAQ, respuestas a reseñas |
| WhatsApp Business ordenado | $ 35.000 | Perfil, catálogo, mensajes automáticos, respuestas rápidas |
| Carta / lista de precios con QR | $ 45.000 | Página liviana + cartel QR |
| Pack de redes del mes | $ 55.000 | 12 posts + calendario |
| Costeo y precios | $ 55.000 | Planilla de costo, margen y precio sugerido |
| Del cuaderno a la planilla (fiado) | $ 60.000 | Transcripción de fotos del cuaderno a planilla con saldos |
| Control de stock y reposición | $ 70.000 | Planilla de stock con mínimos y pedidos a proveedores |
| Identidad básica | $ 80.000 | 3 logos SVG, paleta, tipografías, guía |
| Kit de inauguración | $ 95.000 | Flyer, posts de cuenta regresiva, ficha Google, mensajes |
| Sitio web de una página | $ 140.000 | HTML/CSS listo para publicar gratis |
| Combo Barrio Digital | $ 190.000 | Sitio + Google Maps + WhatsApp + flyer |

Precios, adicionales y preguntas del formulario se editan en [`data/catalogo.json`](data/catalogo.json):
el sitio y el cotizador se arman solos a partir de ese archivo.

## Cómo funciona

```
Formulario ──► POST /api/pedidos ──► cotización (recalculada en el servidor) ──► link de Mercado Pago
                                                                                      │
Descarga ◄── /pedido.html (consulta el estado) ◄── Claude genera ◄── webhook: pago aprobado
```

1. `src/cotizador.js` calcula el precio: base + adicionales + urgencia, con tope.
2. `src/pagos.js` crea la preferencia de Checkout Pro. El webhook valida la firma (`x-signature`),
   **consulta el pago en Mercado Pago** y solo avanza si está aprobado, en ARS y por el monto cotizado.
3. `src/prompts.js` arma el pedido para Claude: un sistema fijo con las reglas de calidad, los datos del
   negocio, las respuestas y las fotos (para transcribir cuadernos o cartas).
4. `src/generador.js` llama a Claude (`claude-opus-5-5`, streaming, salida estructurada en JSON con la
   lista de archivos). Si un filtro de seguridad rechaza el pedido, la API lo reintenta en otro modelo
   (`fallbacks: "default"`).
5. `src/almacen.js` guarda pedido y archivos en `data/pedidos/<id>/`. Los archivos se descargan como
   adjunto con la clave privada del pedido.

## Correrlo

Requiere Node 22 o más nuevo.

```bash
npm install
```

```bash
npm run dev
```

`npm run dev` usa el modo demo: pagos simulados y una entrega de prueba sin llamar a Claude.
Para producción copiá `.env.example` a `.env`, completalo y arrancá con:

```bash
node --env-file=.env server.js
```

| Variable | Para qué |
|---|---|
| `ANTHROPIC_API_KEY` | Generar con Claude |
| `MP_ACCESS_TOKEN` | Cobrar con Mercado Pago (sin esto, pago simulado) |
| `MP_WEBHOOK_SECRET` | Validar la firma de los webhooks |
| `PUBLIC_URL` | URL pública (Mercado Pago tiene que poder llegar al webhook) |
| `ADMIN_TOKEN` | `GET /api/admin/pedidos` y `POST /api/admin/pedidos/:id/reintentar` |
| `GENERADOR=demo` | No llamar a Claude |

## Pruebas

```bash
npm test
```

Cubren el tope de precio en todos los servicios, la suma de adicionales, que las rutas que devuelve el
modelo no escapen de la carpeta, y el circuito completo (pedido → pago simulado → descarga) en modo demo.

## Pendiente

- Mandar un email al cliente cuando el pedido está listo (hoy lo ve en `/pedido.html`).
- Revisión humana opcional antes de liberar la entrega, y una ronda de cambios incluida.
- Pasar `data/pedidos/` a una base de datos y la generación a una cola si hay muchos pedidos por día.
- Factura electrónica (AFIP/ARCA) por cada pago.
- Probar la generación real con cada servicio y ajustar los prompts.
