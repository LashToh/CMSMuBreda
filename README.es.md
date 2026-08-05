# MU Online Season 21 — The Crusader Awakens

> 🇬🇧 [Read in English](README.md)

Landing page promocional de calidad AAA para MU Online Season 21, con la nueva clase **Crusader**.

## Stack tecnológico

- **React 18** + **Vite 6**
- **SCSS** — sistema de diseño modular con tokens
- **GSAP** + ScrollTrigger — animaciones impulsadas por scroll
- **Framer Motion** — transiciones de componentes y efectos hover
- **Lenis** — scroll suave
- **React Icons** — biblioteca de iconos

## Primeros pasos

**Requisito:** [Node.js LTS](https://nodejs.org) instalado.

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

## API de registro y configuración del servidor MU

Este proyecto incluye un **backend Node.js** (`server/`) que registra cuentas directamente en tu base de datos SQL Server de MuDevs Season 21. Las credenciales nunca pasan por el frontend de React.

### 1. Configurar el entorno

Copia el archivo de ejemplo y completa los datos de SQL Server:

```bash
cp .env.example .env
```

| Variable | Descripción |
|----------|-------------|
| `DB_SERVER` | IP o hostname de SQL Server |
| `DB_PORT` | Puerto SQL (por defecto `1433`) |
| `DB_NAME` | Nombre de la base de datos (`MuOnline`) |
| `DB_USER` / `DB_PASSWORD` | Usuario SQL con permiso INSERT en `MEMB_INFO` |
| `HASH_METHOD` | `plain`, `md5` (por defecto) o `wz_md5` — debe coincidir con JoinServer |
| `CORS_ORIGIN` | URL del frontend (por defecto `http://localhost:5173`) |
| `VITE_API_URL` | URL de la API para la app React |
| `VITE_DOWNLOAD_URL` | Enlace de descarga del cliente |
| `VITE_DISCORD_URL` | Enlace de invitación a Discord |

### 2. Permisos SQL

El usuario de base de datos necesita como mínimo:

- `SELECT`, `INSERT` en `MEMB_INFO`
- Si `INSERT_VI_CURR_INFO=true`, también `INSERT` en `VI_CURR_INFO`
- Si `HASH_METHOD=wz_md5`, permiso de ejecución en `dbo.fn_md5` (requiere la DLL WZ MD5 en SQL Server)

Habilita conexiones remotas y permite el puerto TCP `1433` en el firewall.

### 3. ¿Qué HASH_METHOD usar?

En MuDevs Season 21, la mayoría de servidores guardan la contraseña en `MEMB_INFO.memb__pwd` como **MD5 en hexadecimal** (32 caracteres). Por eso el valor por defecto del proyecto es **`md5`**.

| Valor | Cuándo usarlo |
|-------|---------------|
| **`md5`** *(recomendado)* | Registro web estándar MuDevs. JoinServer con MD5 activo y columna `memb__pwd` tipo `varchar(32)`. |
| **`plain`** | Solo si JoinServer tiene MD5 **desactivado** y `memb__pwd` acepta texto plano (`varchar(10–20)`). |
| **`wz_md5`** | Solo si el SQL Server tiene la DLL `fn_md5` / WZ MD5 y `memb__pwd` es `varbinary(16)`. |

**Recomendación:** deja `HASH_METHOD=md5` en `.env` salvo que hayas verificado otra configuración en JoinServer o en la base de datos.

Antes de cambiar el valor, revisa el tipo de columna `memb__pwd` y la opción MD5 del JoinServer (p. ej. `YlNeedMD5`).

### 4. Ejecutar frontend + API

**Opción A — ambos a la vez:**

```bash
npm run dev:all
```

**Opción B — terminales separadas:**

```bash
npm run server   # API en http://localhost:3001
npm run dev      # Vite en http://localhost:5173
```

Prueba de salud: `GET http://localhost:3001/api/health`

### 5. Notas de producción

- Usa **HTTPS** tanto para el sitio como para la API en producción
- Configura `CORS_ORIGIN` con tu dominio real
- Nunca subas `.env` con credenciales reales
- Mantén el rate limiting activo (por defecto: 5 registros / 15 min por IP)

## Live Server (VS Code)

Live Server **no puede** abrir `index.html` directamente en la raíz del proyecto.
Este stack usa React, JSX y SCSS, que deben compilarse antes.

### Opción A — Desarrollo (recomendado)

Usa el servidor de Vite, no Live Server:

```bash
npm run dev
```

### Opción B — Live Server con build

1. Compila el proyecto:
   ```bash
   npm run build
   ```
2. En VS Code, clic derecho en `dist/index.html` → **Open with Live Server**
3. Se abrirá en `http://127.0.0.1:5500`

La carpeta `.vscode/settings.json` ya apunta Live Server a `/dist`.

## Build

```bash
npm run build
npm run preview
```

## Estructura del proyecto

```
src/
├── components/
│   ├── Navbar/
│   ├── Hero/
│   ├── Crusader/
│   ├── Weapons/
│   ├── Skills/
│   ├── Features/
│   ├── Gallery/
│   ├── Timeline/
│   ├── Download/
│   ├── Register/
│   ├── Footer/
│   └── Embers/
├── context/
│   └── RegisterContext.jsx
├── services/
│   └── api.js
├── hooks/
│   ├── useLenis.js
│   ├── useParallax.js
│   └── useGsapReveal.js
├── styles/
│   ├── _variables.scss
│   ├── _global.scss
│   ├── _components.scss
│   └── main.scss
├── App.jsx
└── main.jsx
server/
├── index.js
├── config.js
├── db.js
├── routes/
│   └── register.js
└── utils/
    └── hashPassword.js
public/
└── assets/
    ├── crusader-hero.svg
    ├── crusader-portrait.svg
    ├── war-hammer.svg
    └── shield.svg
```

## Secciones

1. **Hero** — Intro cinematográfica a pantalla completa con parallax, brasas y silueta del Crusader
2. **Crusader** — Lore, historia y barras de estadísticas animadas
3. **Weapons** — Martillo de guerra y escudo con tarjetas 3D al hover
4. **Skills** — Tarjetas de habilidades sagradas con soporte de vista previa en video
5. **Features** — Cuadrícula de características de Season XXI
6. **Gallery** — Galería multimedia con lightbox
7. **Timeline** — Roadmap vertical de lanzamiento
8. **Download** — CTA con requisitos del sistema
9. **Footer** — Enlaces y redes sociales

## Diseño

Paleta dark fantasy inspirada en estudios AAA de videojuegos. Diseño original fan-made — no afiliado a Webzen.

## Licencia

MIT — Ver [LICENSE](LICENSE)
