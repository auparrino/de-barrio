# Proyecto de Claude para los pedidos de De Barrio

Mientras el sitio funciona en modo de prueba (GitHub Pages), los pedidos no van directo a Claude:
llegan por WhatsApp con el prompt armado. Para trabajarlos:

1. En claude.ai, creá un proyecto llamado «De Barrio».
2. En «Instrucciones del proyecto», pegá el contenido de `instrucciones-del-proyecto.md`.
3. En «Conocimiento», subí los archivos de `conocimiento/` (las guías de producción).
4. Por cada pedido: abrí un chat nuevo en el proyecto, pegá el bloque «PROMPT PARA CLAUDE» del
   WhatsApp y adjuntá las fotos o PDF que mandó el cliente.

Este paquete se regenera con `node tools/proyecto-claude.js` cuando cambian las guías o el prompt.
