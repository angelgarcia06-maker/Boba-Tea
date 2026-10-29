# Resultados de comprobación

## Pruebas realizadas sobre el proyecto incluido

Se ejecutó `node --test tests/*.test.mjs` antes de empaquetar el proyecto. Los **10 casos de prueba** (5 de validación y 5 estructurales) finalizaron correctamente:

- Protocolos y enlaces externos válidos/rechazados.
- Hosts correctos para Instagram, TikTok y Google Maps.
- Destinos CTA aceptados y rechazo de esquemas peligrosos.
- Longitudes del formulario de comentarios.
- Eliminación del parámetro `?admin=1` al compartir.
- Orden de los siete bloques académicos.
- Un H1 y siete H3 iniciales (contenido accesible aun sin JavaScript).
- Siete etiquetas de comentarios SEO presentes.
- Todos los IDs usados por JavaScript existen en el HTML.
- Uso de `textContent` para comentarios, sin inyección de HTML.

También se ejecutaron `node --check app.js` y `node --check services/public-backend.js` sin errores de sintaxis; se validó que los dos SVG sean XML válido y se verificó que el servidor local responda HTTP 200.

## Comprobaciones que requieren navegador o credenciales y no se atribuyen como realizadas

- **Edición y recarga visual de fotografías:** implementado; falta validación interactiva manual con un navegador.
- **Menú Compartir y portapapeles:** implementado; su disponibilidad depende del navegador/HTTPS.
- **Pruebas de pantalla real 390/768/1440 px:** CSS responsive implementado; requieren inspección visual manual.
- **Compartición entre diferentes visitantes y moderación pública:** implementado; requiere crear proyecto Supabase y conectar credenciales publicables reales.
- **Posicionamiento o indexación en Google:** no medido ni garantizado.

Estas distinciones permiten presentar evidencias verificables sin afirmar pruebas de integración que todavía necesitan configuración de un servicio externo.
