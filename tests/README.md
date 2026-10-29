# ORIGEN Blog — Actividad académica de Marketing

**Proyecto web completo** con siete bloques en el orden exigido, contenido demostrativo, editor de textos y fotografías, enlaces de redes sociales configurables, botones de compartir, comentarios y siete estrategias SEO comentadas en el código.

**Importante:** El archivo de indicaciones menciona una imagen de referencia, pero en la entrega actual no se adjuntó el archivo de esa imagen. El diseño conserva **el esquema descrito por escrito**: título → introducción → texto a la izquierda + imagen arriba a la derecha y texto debajo → CTA → enlaces → compartir → comentarios. No se afirma una coincidencia pixel por pixel con una imagen no disponible.

## 1. Ejecutar la demostración en Windows

1. Descomprime el ZIP.
2. Abre PowerShell/CMD dentro de `blog-marketing-seo`.
3. Ejecuta `py -m http.server 5500` (o `python -m http.server 5500`).
4. Abre **http://localhost:5500**. No uses `file://`, porque el proyecto emplea módulos JavaScript.

Para abrir el editor: **http://localhost:5500/?admin=1**.

En el modo **local de demostración**, el panel no pide contraseña y utiliza `localStorage` del navegador; **no es seguro para administrar una web pública**. Puedes probar todo el flujo de edición, subir fotografías, agregar secciones, comentar, compartir o cambiar enlaces. Los cambios sobreviven a recargas, pero no se sincronizan entre navegadores/dispositivos.

**Enlaces iniciales:** Instagram, TikTok y Maps abren las páginas oficiales generales de esas plataformas. **No representan perfiles de un negocio real.** Configura las direcciones auténticas desde el editor para la entrega. El CTA inicial lleva a `#comentarios`.

## 2. Personalizar el artículo desde el editor

Usa `?admin=1` y pulsa **Editar artículo**. Podrás modificar:

- Nombre de marca, categoría, H1, introducción, autor y fecha.
- Encabezado destacado, párrafos, beneficios y secciones H3 (añadir/eliminar).
- Imagen principal, galería secundaria, textos ALT y pies de fotografía (JPG/PNG/WebP hasta 8 MB por archivo; compresión automática a WebP).
- Mensaje, texto y URL de CTA; enlaces Instagram, TikTok y Google Maps.
- Colores, palabra clave principal, keywords secundarias, SEO title y metadescripción.

Pulsa **Guardar cambios**. Para ocultar el editor y visitar la vista normal, presiona **Salir** o abre `http://localhost:5500` sin `?admin=1`.

**Límite del modo local:** el almacenamiento de imágenes depende de la cuota de `localStorage` (~5 MB, varía por navegador). Si aparece un error de cuota, usa fotografías más pequeñas o habilita Supabase Storage.

## 3. Activar Supabase (modo compartido de verdad)

Requisitos: proyecto Supabase propio (puede comenzar en plan gratuito), conexión a internet y una cuenta de administradora/administrador creada explícitamente.

1. En Supabase abre **SQL Editor**, pega y ejecuta `supabase/schema.sql`.
2. En **Authentication → Users**, crea/invita el usuario administrador y confirma su correo según la configuración de tu proyecto.
3. Copia el **UUID** de ese usuario y ejecuta en SQL Editor (reemplaza el valor de ejemplo):

   ```sql
   insert into public.site_admins (user_id)
   values ('REEMPLAZAR-POR-UUID-REAL');
   ```

4. En **Project Settings → API** localiza la **Project URL** y una **publishable key** (o la antigua **anon key** pública, según la versión del panel).
5. Edita `config.js`:

   ```js
   export const PUBLIC_CONFIG = {
     supabaseUrl: 'https://TU-PROYECTO.supabase.co',
     supabasePublishableKey: 'TU-CLAVE-PUBLICABLE',
     articleSlug: 'cafe-de-especialidad-en-casa'
   };
   ```

6. Inicia de nuevo el servidor local. La web leerá/escribirá contenido y comentarios en Supabase. El administrador accede con `?admin=1` y correo/contraseña. Las fotos se suben al bucket `blog-images` protegido por políticas RLS.
7. Prueba desde **otro navegador** o modo incógnito: un comentario nuevo debe aparecer después de actualizar la lista. En `?admin=1`, prueba **Moderar comentarios → Ocultar → Restaurar**.

**No copies** al código ninguna clave `service_role`, contraseña de base de datos, token secreto ni datos personales. `site_admins` solo debe modificarse desde el panel SQL (o un backend con privilegios). Las políticas RLS protegen contenido, comentarios y fotografías.

El formulario tiene validaciones, un campo invisible antispam y un enfriamiento básico de 45 segundos **por navegador**. Estas medidas no impiden spam automatizado serio: una web pública con tráfico real debería añadir Cloudflare Turnstile validado en el servidor, una Edge Function con control de tasa y mecanismos de denuncia.

## 4. Publicar gratis

### Opción A: GitHub Pages

1. Sube toda la carpeta al repositorio, preferiblemente a la raíz del sitio publicado.
2. GitHub → **Settings → Pages → Deploy from a branch** → selecciona `main` y `/ (root)` si tus archivos están en raíz.
3. Confirma la URL asignada. Si publicas bajo una subruta del repositorio, los recursos están preparados con URLs relativas (`./`).
4. Si configuraste Supabase, comprueba que las credenciales públicas de `config.js` son correctas y que RLS está habilitado.

### Opción B: Cloudflare Pages

1. Conecta el repositorio a un proyecto Pages.
2. Configura **Framework preset: None**, **Build command: vacío**, **Output directory: `.`** (raíz que contiene `index.html`; alternativamente usa la opción de subida de archivos de Pages).
3. Visita la dirección `*.pages.dev` asignada y prueba todos los enlaces y el formulario desde una ventana privada.

**Nota de SEO:** antes de publicar comercialmente, reemplaza el contenido de muestra y los metadatos por información real y mantén la versión HTML estática coherente con el contenido publicado. La actualización JavaScript de metadatos no garantiza vistas previas correctas en todas las redes sociales. No inventes cuentas, direcciones comerciales, autores ni fechas.

## 5. Estructura de archivos

```text
blog-marketing-seo/
├── index.html               Siete bloques y marcado HTML5/SEO
├── styles.css               Diseño editorial responsive
├── app.js                   Render, edición, comentarios, compartir y SEO
├── content.js               Contenido de ejemplo y claves SEO
├── config.js                Configuración opcional Supabase
├── utils.js                 Validaciones reutilizables
├── services/public-backend.js  Supabase Auth, DB y Storage
├── assets/cafe-hero.svg     Imagen inicial reemplazable
├── assets/favicon.svg
├── supabase/schema.sql      Tablas, RLS, administradores y bucket
├── tests/validate.test.mjs  Pruebas automáticas básicas
├── SEO-ESTRATEGIAS.md       Justificación de las siete estrategias
└── README.md                Esta guía
```

## 6. Pruebas y criterios de aceptación

| Verificación | Forma de comprobarla |
|---|---|
| Orden de los siete bloques | Inspeccionar `index.html` y recorrer la página. |
| Único H1 y otros niveles | Buscar `<h1`, `<h2` y `<h3` en el DOM final. |
| Interactividad del editor | Cambiar título, foto y CTA; guardar y recargar. |
| Comentarios locales | Publicar, recargar y moderar. |
| Comentarios públicos | Configurar Supabase y probar en dos navegadores distintos. |
| Redes sociales | Cambiar URLs por enlaces reales y hacer clic. |
| Compartir | Copiar enlace y probar Compartir en navegador compatible. |
| Responsive | Emular 390 px, 768 px y 1440 px en DevTools. |
| Validación de enlaces | Intentar guardar URL con dominio incorrecto o `javascript:`. |
| XSS | Publicar `\u003cscript>alert(1)\u003c/script>`; debe mostrarse solo como texto. |
| Estrategias SEO | Buscar comentarios `ESTRATEGIA SEO` y ver `SEO-ESTRATEGIAS.md`. |
| Pruebas unitarias | Ejecutar `node --test tests/*.test.mjs`. |

## 7. Explicación breve para defender ante el docente

> "Nuestro blog reproduce los siete bloques de la estructura solicitada. El contenido está orientado al público objetivo, ofrece consejos útiles e incorpora una llamada a la acción. Aplicamos siete estrategias SEO reales: palabras clave, metadatos, jerarquía de encabezados, optimización de imágenes, enlaces relevantes, adaptación móvil y datos estructurados. Están marcadas mediante comentarios en el código. Además, implementamos enlaces configurables, opciones para compartir, editor de fotografías y comentarios. Para la demostración usamos almacenamiento local y preparamos una integración con Supabase para funcionamiento público con seguridad de acceso." 

**Alcance:** Se entrega una plantilla profesional editable con contenido demostrativo, no una certificación de indexación, un posicionamiento garantizado ni una web ya publicada. Es responsabilidad de quien presenta el trabajo introducir los datos reales del negocio y publicar los archivos.
