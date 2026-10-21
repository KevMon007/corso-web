# Guia de despliegue — Consultoria Sanitaria CORSO

Sitio estatico (HTML + CSS + JS, sin dependencias, sin paso de build).
El formulario de contacto usa **Netlify Forms**.

---

## Opcion A — Arrastrar y soltar (30 segundos, sin Git)

1. Entra a <https://app.netlify.com/drop> (o crea una cuenta gratis).
2. Arrastra **toda la carpeta** `corso-website` a la ventana del navegador.
3. Netlify publica el sitio y te da una URL tipo `https://nombre-aleatorio.netlify.app`.
4. Listo: el sitio ya esta en linea con HTTPS.

### Conectar un dominio propio
1. En el panel del sitio: **Site settings -> Domain management -> Add a domain**.
2. Escribe tu dominio (ej. `consultoriasanitariacorso.com`).
3. Netlify te indica los registros DNS a crear en tu registrador.
4. Cuando los propaguen, el SSL se emite **s alone** (no hay que hacer nada).

### Activar el formulario
1. Panel de Netlify -> sitio -> **Forms**.
2. Aparece el formulario `contacto`. Activa **Form notifications** para que cada
   mensaje te llegue a `regulacionsanitariacorso@gmail.com`
   (el aviso puede llegar desde `noreply@netlify.com`; revisa la carpeta de spam
   la primera vez y marcalo como "no spam").

---

## Opcion B — Conectar un repositorio de Git (recomendado a futuro)

1. Sube la carpeta a GitHub / GitLab / Bitbucket.
2. Netlify -> **Add new site -> Import an existing project** -> elige el repo.
3. Netlify lee `netlify.toml` y publica la raiz del proyecto (no hay build).
4. Cada `git push` actualiza el sitio automaticamente.

---

## Si el hosting NO es Netlify

El formulario actual esta configurado para Netlify Forms. Para usarlo en otro
hosting (Cloudflare Pages, Vercel, Apache, Hostinger...) usa **Formspree**:

1. Crea una cuenta en <https://formspree.io> y crea un formulario.
2. Copia tu endpoint, que se ve asi: `https://formspree.io/f/abcdefgh`.
3. Abre `javascript/script.js` y cambia **una sola linea**:

```js
var FORM_ENDPOINT = 'https://formspree.io/f/abcdefgh';
```

4. Listo. El resto del codigo ya funciona con ese servicio.

> Con la constante vacia (como esta ahora) el formulario hace `POST` a `/`,
> que es justo lo que espera Netlify Forms.

---

## Checklist antes de publicar

- [ ] `img/logo-original.jpg` NO se sube (1.3 MB). Ya esta en `.netlifyignore`.
- [ ] Las rutas de los archivos son **relativas** (`img/...`, `css/...`),
      por lo que el sitio funciona en la raiz del dominio o en una subcarpeta.
- [ ] En `Form notifications` de Netlify verifica que llega el correo.
- [ ] Revisa el Aviso de Privacidad (`privacidad.html`) y ajustalo con sus datos
      fiscales reales antes de publicar: es una plantilla, no un documento legal final.

---

## Estructura del proyecto

```
corso-website/
├─ index.html              Inicio (incluye la seccion "Conozca CORSO")
├─ nosotros.html          Nuestra firma + fotos de las fundadoras
├─ servicios.html         Catalogo de servicios
├─ contacto.html          Formulario (Netlify Forms)
├─ gracias.html           Confirmacion de envio
├─ privacidad.html        Aviso de Privacidad (LFPDPPP)
├─ css/
│  ├─ styles.css           Estilos globales
│  └─ lightbox.css         Visor de imagenes y video con zoom
├─ javascript/
│  ├─ script.js            Menu, scroll, formulario, video
│  └─ lightbox.js          Logica del visor (zoom, teclado, swipe)
├─ img/                    Logo, fotos, infografias, favicon
├─ vid/                    Video promocional
├─ favicon.ico
└─ netlify.toml            Configuracion de despliegue
```
