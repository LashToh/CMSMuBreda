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
