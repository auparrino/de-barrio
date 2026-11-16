# De Barrio

Microconsultoría para comercios de barrio. La persona entra al sitio, elige un servicio, completa un
formulario y recibe la cotización al instante. Si paga (Mercado Pago), el sistema le pide a Claude que
genere el producto y se lo deja para descargar.

**Ningún pedido supera los $ 200.000**: si los adicionales y la urgencia pasan el tope, la diferencia se
bonifica sola.

## Servicios

Catorce servicios automáticos en seis categorías, elegidos a partir de la investigación en
[`docs/investigacion/`](docs/investigacion/). Todos se generan solos a partir del formulario.

| Categoría | Servicio | Desde | Tabla vigente que usa |
|---|---|---:|---|
| Plata y margen | Margen real y lista de precios | $ 140.000 | — |
| Plata y margen | Cobrá más barato | $ 75.000 | `comisiones` |
| Plata y margen | Caja ordenada | $ 85.000 | — |
| Mercadería y góndola | Stock mínimo y mapa de compras | $ 150.000 | — |
| Mercadería y góndola | Precios a la vista y en regla | $ 55.000 | `normativa_precios` |
| Clientes y fiado | Fiado bajo control | $ 75.000 | — |
| Clientes y fiado | Clientes que vuelven | $ 65.000 | — |
| Personal y local | Costo laboral y turnos | $ 110.000 | `escala_comercio` |
| Personal y local | Revisión de luz y alquiler | $ 100.000 | — |
| Tu imagen | Sitio web de una página | $ 140.000 | — |
| Tu imagen | Flyer o volante | $ 25.000 | — |
| Tu imagen | Perfil de redes armado | $ 45.000 | — |
| Vender en el barrio | Que te encuentren y te pidan | $ 120.000 | — |
| Vender en el barrio | Promos del mes | $ 55.000 | — |

Precios, adicionales, preguntas e instrucciones para Claude de cada servicio están en
[`data/catalogo.json`](data/catalogo.json).

### Exactitud

- **Las cuentas no las hace el modelo.** Las planillas se entregan como `.xlsx` armados por código
  (`src/planillas.js`) con fórmulas reales; Claude solo define filas y fórmulas. Los precios por unidad
  de medida y los precios de promo los calcula `src/calculos.js` después de que Claude extrae los datos.
- **Los datos que cambian viven en `data/tablas/`** (comisiones, escala de Comercio, normativa de precios),
  con fecha, fuente y vigencia. Un servicio que usa una tabla **no se puede contratar** si la tabla no
  está marcada `"verificado": true` o pasó su vigencia: aparece como «Muy pronto».
- **Los QR los genera el código** (`{{QR:...}}` → SVG real), no el modelo, y las fotos del cliente
  entran al HTML con `{{FOTO:n}}`: nunca se usan imágenes de internet ni generadas.
- Cada entrega trae un LEEME.md con una sección «Revisá esto» (datos faltantes, dudosos o transcriptos
  de fotos) y una revisión automática de las fórmulas que apuntan a hojas inexistentes.

### Para activar los tres servicios apagados

1. Revisar `data/tablas/<tabla>.json` contra las fuentes oficiales, completar los `null`.
2. Actualizar `fecha` y poner `"verificado": true`. No hace falta reiniciar el servidor.

## Cómo funciona

```
Confirmar pedido ──► mail de confirmación al cliente + mail a la casilla con el prompt y las fotos
        │
        ▼ (solo, o cuando tocás «Mandar a Claude» con REVISAR_ANTES=1)
Claude arma el pedido ──► muestra con marca de agua + link de Mercado Pago ──► mail al cliente
        │
        ▼ webhook: pago aprobado
Descargas habilitadas ──► mail «Pago recibido» al cliente y «Cobrado» a la casilla
```

El cliente no paga nada hasta ver la muestra: si no le gusta, no paga y no hay devoluciones.

1. `src/cotizador.js` calcula el precio: base + adicionales + urgencia, con tope.
2. `src/pagos.js` crea la preferencia de Checkout Pro. El webhook valida la firma (`x-signature`),
   **consulta el pago en Mercado Pago** y solo avanza si está aprobado, en ARS y por el monto cotizado.
3. `src/prompts.js` arma el pedido para Claude: un sistema fijo con las reglas de calidad, las
   instrucciones del servicio, las tablas vigentes, los cálculos, los datos del negocio y los adjuntos
   (fotos y PDF: libretas, facturas, listas de precios, contratos).
4. `src/generador.js` llama a Claude (`claude-opus-5-5`, streaming, salida estructurada en JSON con
   archivos de texto y especificaciones de planillas), arma los `.xlsx` y los QR. Si un filtro de
   seguridad rechaza el pedido, la API lo reintenta en otro modelo (`fallbacks: "default"`).
5. `src/almacen.js` guarda pedido y archivos en `data/pedidos/<id>/`. Los archivos se descargan como
   adjunto con la clave privada del pedido.
6. `src/correo.js` manda los mails del circuito de arriba. Al cliente nunca le llega nada que diga
   cómo se arma el pedido; el prompt va solo a la casilla (`CORREO_CASILLA`), en `prompt.txt`.

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
| `SMTP_URL` | Casilla que manda los mails (`smtps://usuario:clave@servidor:465`). Sin esto se muestran en la consola |
| `CORREO_DESDE` / `CORREO_CASILLA` | Remitente y casilla donde te llegan los pedidos |
| `REVISAR_ANTES=1` | Claude arranca cuando confirmás desde el mail (así filtrás pedidos que no van en serio antes de gastar en Claude) |

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
- Probar la generación real con cada servicio y ajustar las instrucciones.
- Verificar las tres tablas de `data/tablas/` para habilitar sus servicios.
