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
   - Gift Codes
   - CMS Settings (server info + feature flags)
   - Audit Log

Las keys de Mercado Pago / Stripe / PayPal van en `.env` (secretos), no en el panel.

## Frontend + API en el mismo dominio

En cPanel lo recomendado es **un solo proceso Node**:
- Express sirve `/api/*` y también el `dist/` del frontend
- Al buildear, dejá `VITE_API_URL` vacío (same-origin). Ejemplo en `.env.production`:

```env
VITE_API_URL=
```

## Donaciones (webhooks)

Apuntá las URLs públicas a:

- `https://tudominio.com/api/donations/webhooks/mercadopago`
- `https://tudominio.com/api/donations/webhooks/stripe`
- `https://tudominio.com/api/donations/webhooks/paypal`

Y cargá las keys en `.env` / Environment variables del panel.

## Reabrir el instalador

Si necesitás volver a `/install`:

1. Borrá `server/data/.installed`, **o**
2. Seteá `INSTALL_ALLOW=true` y reiniciá

## Notas

- SQL Server debe ser alcanzable desde el hosting (firewall / IP allowlist).
- Shared hosting a veces **no** llega a un SQL en tu VPS gamer: en ese caso usá VPS o proxy DB.
- No subas `.env` ni el zip de WebEngine a git.
