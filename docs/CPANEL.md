# Instalar CMSMuBreda en cPanel

Este CMS es **Node.js** (no PHP como WebEngine). En cPanel se usa **Setup Node.js App**.

## Requisitos

- cPanel con **Node.js Selector** / Setup Node.js App (Node 18+ recomendado)
- Acceso a tu SQL Server MU (host, puerto, usuario, password)
- Dominio o subdominio apuntando a la app

## Pasos

1. **Subí el proyecto** al servidor (Git clone o ZIP), por ejemplo:
   `~/CMSMuBreda`

2. En cPanel → **Setup Node.js App**:
   - **Node.js version:** 18 o 20
   - **Application mode:** Production
   - **Application root:** carpeta del proyecto (`CMSMuBreda`)
   - **Application URL:** tu dominio / subdominio
   - **Application startup file:** `app.js`
   - **Application entry:** (si pide) el mismo `app.js`

3. Abrí la terminal de la app Node (o SSH) en esa carpeta y ejecutá:

```bash
npm install
npm run build
```

4. Variables de entorno en cPanel (mínimo antes o después del install):

| Variable | Valor |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | *(cPanel la setea solo — no la forces si el panel la define)* |

5. **Start** la aplicación Node.

6. Abrí **`https://tudominio.com/install`**
   - Completá SQL Server + hash (`md5` típico MuDevs)
   - Creá la **cuenta administrador** (usuario, email, password) → se inserta en `MEMB_INFO` y queda en `ADMIN_USERNAMES`
   - JWT secret + URL del sitio
   - El instalador prueba la DB, escribe `.env` y crea `server/data/.installed`

7. En cPanel → **Restart** la app Node.

8. Entrá a **`/login`** con esa cuenta admin → **`/admin`** = **AdminCP** (estilo WebEngine):
   - Dashboard
   - Accounts (búsqueda)
   - News
   - Downloads
   - Donate (paquetes WCoin)
   - Integrations (Mercado Pago / AstroPay / PayPal — secretos enmascarados)
   - Gift Codes
   - **CMS Settings** (todo lo configurable post-install):
     - **General** — info del server, redes, download URL, `CORS_ORIGIN`
     - **Features** — flags (`ENABLE_*`)
     - **Auth / Registration** — `HASH_METHOD`, `SHA256_SALT`, `ADMIN_USERNAMES`, registro, JWT, cookies
     - **Currencies** — mapeos credits / WCoinC / WCoinP / Goblin
     - **Character tools** — unstuck / clear PK
     - **Security** — rate limits
     - **MU Schema** (avanzado) — tablas/columnas
     - **Database** (avanzado) — `DB_*` con password enmascarado
   - Audit Log

La mayoría de variables de `.env` se editan desde AdminCP: se aplican en vivo (cuando aplica), se guardan en `server/data/admin-secrets.json` y se espejan a `.env`. **No editables:** `NODE_ENV`, `PORT` (hosting). CORS / rate limits / pool DB pueden requerir **Restart** de la app Node.

Las keys de pago también van en **AdminCP → Integrations** (recomendado).

## Frontend + API en el mismo dominio

En cPanel lo recomendado es **un solo proceso Node**:
- Express sirve `/api/*` y también el `dist/` del frontend
- Al buildear, dejá `VITE_API_URL` vacío (same-origin). Ejemplo en `.env.production`:

```env
VITE_API_URL=
```

## API en subdominio (`api.mubreda.net`)

Si preferís separar sitio y API en **cPanel**:

> **¿VPS Linux (PM2 + Nginx)?** Usá la guía dedicada: **[VPS.md](./VPS.md)** (API-only en `api.mubreda.net`, sitio aún no desplegado desde este repo).

### 1) DNS / cPanel

1. cPanel → **Subdomains** (o Domains) → creá `api` apuntando a una carpeta (ej. `api.mubreda.net`).
2. SSL: activá HTTPS para `api.mubreda.net` (AutoSSL / Let's Encrypt).

### 2) App Node solo para la API

Setup Node.js App con **Application URL** = `api.mubreda.net`, startup `app.js`.

En el `.env` de esa app:

```env
NODE_ENV=production
MU_DATABASE_MODE=production
SERVE_SPA=false
CORS_ORIGIN=https://mubreda.net,https://www.mubreda.net
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
COOKIE_DOMAIN=.mubreda.net
DONATIONS_PUBLIC_BASE_URL=https://mubreda.net
PUBLIC_BASE_URL=https://mubreda.net
```

`COOKIE_DOMAIN` con el punto al inicio (`.mubreda.net`) permite que la cookie funcione en `www` y en el sitio raíz. `SameSite=none` es obligatorio entre subdominios distintos con `credentials: include`.

### 3) Frontend (sitio principal / beta)

Antes de `npm run build`:

```env
VITE_API_URL=https://api.mubreda.net
```

Podés servir el `dist/` con otra app Node (mismo repo, sin `SERVE_SPA=false`) o con Apache/Nginx estático. Si usás otra app Node solo para el front, no hace falta que tenga SQL: las llamadas van a `VITE_API_URL`.

### 4) Webhooks de donaciones

Apuntá a la API:

- `https://api.mubreda.net/api/donations/webhooks/mercadopago`
- `https://api.mubreda.net/api/donations/webhooks/astropay`
- `https://api.mubreda.net/api/donations/webhooks/paypal`

### 5) Install

Abrí `https://api.mubreda.net/install` (o el sitio si la API y el SPA están juntos).

**Nota:** en shared hosting a veces es más simple **un solo dominio** (sección anterior). El subdominio de API conviene si querés aislar backend o poner la API en un VPS ([VPS.md](./VPS.md)).
## Donaciones (webhooks)

Apuntá las URLs públicas a:

- `https://tudominio.com/api/donations/webhooks/mercadopago`
- `https://api.tudominio.com/api/donations/webhooks/astropay`
- `https://tudominio.com/api/donations/webhooks/paypal`

Y cargá las keys en **AdminCP → Integrations** (recomendado) o en `.env` / Environment variables del panel.

## Reabrir el instalador

Si necesitás volver a `/install`:

1. Borrá `server/data/.installed`, **o**
2. Seteá `INSTALL_ALLOW=true` y reiniciá

## Notas

- SQL Server debe ser alcanzable desde el hosting (firewall / IP allowlist).
- Shared hosting a veces **no** llega a un SQL en tu VPS gamer: en ese caso usá VPS o proxy DB.
- No subas `.env` ni el zip de WebEngine a git.
