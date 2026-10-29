# Estrategias SEO implementadas y comentadas

> **Consigna académica:** aplicar más de tres estrategias para posicionamiento en buscadores **y señalarlas mediante comentarios en el código**. Este proyecto aplica **siete**. Los comentarios `ESTRATEGIA SEO 01` a `07` aparecen en los archivos indicados.

| Estrategia | Dónde se implementa | Evidencia / contribución |
| --- | --- | --- |
| **SEO 01. Palabras clave** | `index.html` (H1, introducción); `content.js` y `app.js` (`applySeo`) | La frase **«café de especialidad en casa»** aparece naturalmente en el título principal, introducción y metadatos, sin repetición forzada. Se pueden editar palabras clave relacionadas. |
| **SEO 02. Título y metadescripción** | `index.html` `<title>` y `<meta name="description">`; `app.js` `applySeo()` | Los metadatos resumen la promesa del artículo y la intención de búsqueda. El editor permite personalizarlos. |
| **SEO 03. Encabezados semánticos** | `index.html`, `app.js` `renderArticle()` | Un **único H1**, H2 para secciones principales y H3 para los consejos favorecen lectura y estructura semántica. |
| **SEO 04. Optimización de imágenes** | `index.html` (ALT, dimensiones, fetchpriority); `app.js` (`compressImage`, `renderArticle`) | Texto ALT editable, exportación WebP desde el editor, límite de archivo, ancho máximo de 1600 px y `loading="lazy"` en imágenes secundarias. |
| **SEO 05. Enlaces relevantes** | `index.html` (bloque enlaces y CTA), `utils.js` (`validSocialUrl`) | Enlaces descriptivos con URL verificable, `rel="noopener noreferrer"` y destinos específicos para Instagram/TikTok/Maps. No se permiten `javascript:` ni hosts falsos. |
| **SEO 06. Experiencia móvil y rendimiento** | `styles.css` (`@media`), `app.js` | Diseño adaptable, imágenes comprimidas, JavaScript modular sin framework y dimensiones de imagen definidas para menor cambio de distribución. |
| **SEO 07. Marcado semántico y datos estructurados** | `index.html` (HTML5, Open Graph, JSON-LD), `app.js` `applySeo()` | `BlogPosting` Schema.org, Open Graph, URL canónica pública, y autor/fecha **solo cuando se ingresan datos reales**. |

## Evidencias para mostrar al docente

1. Abrir `index.html` y buscar los comentarios `ESTRATEGIA SEO`.
2. Abrir `styles.css` y buscar `ESTRATEGIA SEO 06`.
3. Abrir `app.js` y buscar `ESTRATEGIA SEO 01`, `02`, `04` y `07`.
4. Inspeccionar los elementos `<h1>`, `<h2>`, `<h3>`, `<title>`, `meta`, `alt`, `rel="canonical"` y el JSON-LD desde el navegador.
5. Mostrar la adaptación móvil con las herramientas de desarrollador.

## Precisión importante sobre el SEO de una web estática editable

Las etiquetas iniciales se encuentran **directamente en el HTML**, así que las estrategias son verificables aun antes de que JavaScript se ejecute. El editor también actualiza los metadatos en el navegador. **Pero** si se modifican título, meta descripción e imagen desde Supabase, los robots y redes que no ejecutan JavaScript podrían seguir leyendo los valores originales del `index.html` publicado. Para una publicación comercial definitiva, actualiza el HTML estático o usa una solución con prerenderizado/SSR y genera una imagen OG pública. El contenido de demostración no sustituye esos metadatos de producción. El SEO técnico no garantiza indexación ni puestos específicos en Google.

La imagen SVG inicial es ilustrativa y se puede sustituir por fotografías reales desde el editor. Cuando se publique, deben usarse fotografías propias o con permiso y atribución según corresponda.
