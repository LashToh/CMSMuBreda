# PROGRESO

## 2026-11-15 — Recuperación del módulo de analítica

### Qué se buscó y dónde
- Copia local `C:\Users\Neo\CMSMuBreda`: no estaba en ninguna rama, stash, reflog ni en archivos sin commitear.
- Objetos perdidos de git (`git fsck --unreachable`): ninguno; nunca se hizo `git add`.
- Historial de Cursor, Codex y VS Code, y las carpetas WebBreda y WebEngine: nada.
- Historial de Claude Code (`.claude`): carpeta protegida, no se pudo leer.
- **Encontrado:** la rama de GitHub que creó Cursor, `cursor/admin-visit-analytics-bc07` (commit 0821d55),
  descargada en `G:\Server Breda\Mu Breda Season 6 - OpenMu\CMSMuBreda-cursor-admin-visit-analytics-bc07`.
  Estaba basada en `deploy/mubreda-beta`.

### Copia de seguridad
`G:\Server Breda\Mu Breda Season 6 - OpenMu\_backups\CMSMuBreda_backup_2026-11-15` (completa, con `.git`, sin `node_modules`).

### Ramas
- `wip-s6-local` (commit a3f4737): todo el trabajo que estaba sin commitear en la copia local (tema Season 6,
  Logo 2026, adaptador OpenMU, links sociales). `moddec.obj` quedó afuera (binario suelto, sin identificar).
- `recuperar-analitica`: sale de `wip-s6-local` y suma la analítica.

### La analítica
- `server/services/visitService.js`: visitas por día, visitantes únicos (código anónimo, sin IP) y top de páginas.
  Guarda en `server/data/visits.json` (en `.gitignore`), 90 días.
- `server/controllers/visitController.js`: `POST /api/visits` (cada página pública) y `GET /api/admin/visits` (solo admin).
- `src/App.jsx` y `src/services/api.js`: avisan al server en cada cambio de página pública.
- `src/pages/AdminPage.jsx`: pestaña **Visits** del panel.
- `server/services/visitService.test.js`: pruebas (`node --test server/services/visitService.test.js`).

### Correcciones sobre lo de Cursor
- No cuenta bots, vistas previas de links (Discord, WhatsApp, Facebook) ni monitores.
- `POST /api/visits` usa el límite de lecturas públicas: antes gastaba el límite estricto de logins y pagos,
  y navegar mucho podía bloquear el login.
- `useVisitStore` → `setVisitStore` (no es un hook de React).
- Fuera `scripts/apply-live-visits.mjs`: parcheaba el server publicado bajando archivos de GitHub.
  Se publica desde el repo.

### Falta
- Probar la pestaña Visits en local y commitear (`cms-paso3-commit-analitica.ps1`).
- Decidir si se hace push de `wip-s6-local` y `recuperar-analitica`.
- Ver si el server publicado ya tiene `server/data/visits.json` con visitas reales (el script de Cursor sugiere
  que se aplicó a mano allá).
- Tarea 2: submenú Info con "Info general" y "Guías" (rama `guias`).

### Decisiones
- Nada de push sin preguntar. Commit al final de cada paso importante.

## 2026-11-15 — Tarea 2: Info → Info general / Guías

### Hecho
- Menú: "Info" del navbar pasó a ser un desplegable (componente `src/components/InfoMenu`) con "Info general" (/about) y "Guías" (/guides). Se usa en el navbar de la landing, en el CmsShell (el resto de las páginas) y, en el menú hamburguesa, como subítems indentados. Mantiene el estado activo en /about y /guides; teclado: Enter/Espacio/flecha abajo abren, Escape y click afuera cierran.
- Ruta /guides en `src/App.jsx` (/info sigue redirigiendo a /about). `/guides` agregado a PUBLIC_PAGES de `visitService.js` y al test.
- Contenido: `server/data/guidesDefaults.js` (guía oficial `guia-sistemas.md`, traducida a en/pt) en 5 categorías: Economía (Ruud y Priest James; Sets y armas Bloodangel; VIP), Mapas y jefes (Ruined Lorencia; Jefes y ranking de daño; Dungeons), Personaje (Soul System; Colección; Combat Quiver; Skills; Reparto automático de puntos), Comunidad y eventos (Party; Eventos; Recompensa diaria; Registro de muertes; Banco de joyas), Juego y cliente (Día y noche; Cliente, launcher y versiones; Comandos y teclas).
- Backend (mismo patrón que about): `store.guides` (null = defaults), `GET /api/guides` público (en PUBLIC_READS), `GET/PUT /api/admin/guides` (validación zod en `server/validators/guides.js`) y `POST /api/admin/guides/reset`, con audit log (`admin.guides.save` / `admin.guides.reset`). Servicio en `server/services/guidesService.js`.
- Front: `src/pages/GuidesPage.jsx/.scss` (acordeón de categorías e ítems, teclado, hash #item-id, markdown propio en `src/utils/miniMarkdown.jsx`, sin dangerouslySetInnerHTML), textos de UI en es/en/pt, funciones en `src/services/api.js`.
- AdminCP: pestaña "Guides" (después de Server Info) con editor de categorías/ítems (`src/pages/AdminGuidesEditor.jsx`), Guardar y "Restaurar guía por defecto".

### Decisiones
- Rama prevista `guias` desde `recuperar-analitica`: todavía NO creada (no se usó git para escribir); los cambios están sin commitear sobre `recuperar-analitica`.
- Las guías son editables desde AdminCP → Guides; los defaults viven en `guidesDefaults.js` y se usan mientras `guides` sea null en `cms-local.json`.
- Traducidas a en/pt; nombres propios del juego (items, mapas, NPCs, skills, comandos, teclas) quedan igual.
- Íconos de `react-icons/fa`; en los datos se guarda el nombre del componente y se mapea en `src/utils/guideIcons.js`.

### Falta
- Probar en escritorio y celular (dropdown, acordeón, tablas con scroll horizontal, hash compartido).
- Compilar el front (`vite build`) en Windows: en la VM solo se validó sintaxis y SCSS.
- Commit y push (no se hizo ningún git de escritura).

## 2026-11-15 — Tarea 3: valores de Ruud y editor visual de guías

### Valores de Ruud actualizados (cambio del server del 2026-11-14)
- `guidesDefaults.js` (es, en, pt): Abbadon 5000; dungeon completo 350; quests diarias de Ruined Lorencia 350 cada una; Blood Castle, Devil Square y Chaos Castle 350; jefe de Ruined Lorencia 350. Se quitó la fila "jefe final de un dungeon (50)". Se agregó la nota de máximo 3 veces por día por personaje en eventos.
- Priest James: piezas selladas 50.000 Ruud, arma Bloodangel 100.000 Ruud, (Hero) Blood Angels Spirit 2.000 (sin cambio).
- Bloodangel: chance de dos opciones en armas 1% -> 5%; bloque nuevo "Otra forma de conseguir el (Hero) Blood Angels Spirit" (pieza ancient +11 o más de los sets listados, 80%, sin zen).
- Ruined Lorencia y Dungeons: textos ajustados (350 Ruud; el dungeon cuenta para el límite de 3 eventos por día).

### Editor visual (WYSIWYG) en AdminCP -> Guides
- Decisiones: TipTap 2.x (React 18); el cuerpo de cada ítem y la intro pasan de markdown a HTML, siempre con el objeto L(es, en, pt); sanitizado en el server (sanitize-html, al guardar) y otra vez en el cliente (DOMPurify, al mostrar).
- Compatibilidad: un cuerpo guardado que no empieza con "<" se muestra con `miniMarkdown` y el editor lo convierte a HTML al cargar (`src/utils/markdownBlocks.js`).
- Los defaults (`guidesDefaults.js`) quedaron convertidos a HTML en los 3 idiomas.
- Imágenes: `POST /api/admin/uploads` (admin, multer en memoria, PNG/JPG/WEBP/GIF, máx. 5 MB, chequea mimetype y firma real, nombre uuid) guarda en `server/data/uploads/` (ignorado por git) y se sirve en `/uploads` con nosniff y caché larga (`server/server.js`, que es el que carga `app.js`). Cada subida va al audit log. `vite.config.js` proxea `/uploads` en desarrollo.
- Videos: solo YouTube, siempre `youtube-nocookie.com` (el server reescribe youtube.com y rechaza otros hosts). CSP de helmet: `img-src 'self' data: https:` y `frame-src 'self' https://www.youtube-nocookie.com`.
- El JSON de `/api/admin/guides` admite hasta 5 MB (el límite global de 32 KB no alcanzaba ni para los defaults). Límite por cuerpo: 60.000 caracteres.
- Tests: `server/services/guidesSanitize.test.js` (se saltean los del sanitizer si falta `sanitize-html`).

### Falta
- Correr `npm install` (paquetes nuevos: @tiptap/*, dompurify, sanitize-html, multer) y probar: editor, subida de imágenes, YouTube, render en /guides, y el test del sanitizer con la librería real.
- Si la API vive en otro dominio (`VITE_API_URL`), las imágenes `/uploads/...` se piden al dominio del front: hay que servirlas ahí o usar URL absoluta.
- Commit y push (no se hizo ningún git de escritura).

### Publicación en el VPS (preparación)
- Comparado el código online (`/var/www/CMSMuBreda`) con la rama guias: lo único que estaba solo en el VPS era el endpoint del launcher de Season 6 (`/api/launcher/s6/manifest`, `/s6/version`, `/s6/files/...`, que lee `patches-s6/`) y `/launcher/s6` como lectura pública en el rate limit. Se agregó a `server/routes/launcher.js` y `server/routes/index.js` (igual al del VPS).
- Lo demás que difiere en el VPS es código viejo de Season 21 o finales de línea (CRLF/LF).
- Datos vivos que se pasan a la versión nueva: `.env`, `server/data/{cms-local.json, admin-secrets.json, visits.json, .installed}`; `patches/` y `patches-s6/` se enlazan, no se copian.
- nginx de mubreda.net: falta `location ^~ /uploads/` hacia la API (127.0.0.1:3002) para las imágenes de las guías.
