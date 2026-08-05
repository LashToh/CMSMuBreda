# MU Breda Season 21 CMS

Modern MU Online CMS for **MU Breda Season 21**.

- **Design foundation:** [season21-landing](https://github.com/LashToh/season21-landing) (visual identity preserved)
- **Functional reference:** [WebEngine](https://github.com/lautaroangelico/WebEngine/) (patterns only — not a PHP port)
- **Stack:** React · Vite · SCSS · Node.js · Express · Microsoft SQL Server (`mssql`)

---

## Architecture

```
CMSMuBreda/
├── src/                     # React frontend (Season 21 design + CMS pages)
├── public/                  # Assets, favicons
├── server/
│   ├── adapters/mu/         # MU Database Adapter (mock | mssql)
│   ├── adapters/item/       # Item Adapter (delivery gated)
│   ├── config/              # Features, schema maps, server info
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── validators/
│   ├── data/                # Local CMS store (news, shop, gift codes, audit)
│   ├── db/pool.js
│   └── server.js
├── .env.example
└── package.json
```

Controllers never contain large raw SQL. All MU access goes through `server/adapters/mu`.

---

## Quick start (mock mode)

```bash
cp .env.example .env
npm install
npm run dev:all
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001  

Mock login: **demo** / **demo1234** (also admin when `ADMIN_USERNAMES=demo`)  
Gift code: **WELCOME21**

`MU_DATABASE_MODE=mock` is forced off when `NODE_ENV=production`.

---

## Production SQL Server

1. Set `MU_DATABASE_MODE=production`
2. Fill `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
3. Align `HASH_METHOD` with JoinServer (`plain` | `md5` | `wz_md5` | `sha256`)
4. Map tables/columns via env vars (see `.env.example`)
5. Keep dangerous features disabled until schema is verified:
   - `ENABLE_RESET=false`
   - `ENABLE_GRAND_RESET=false`
   - `ENABLE_CLEAR_PK=false`
   - `ENABLE_UNSTUCK=false`
   - `ENABLE_WEBSHOP_DELIVERY=false`
6. Use Admin → discovery endpoints (read-only) to inspect tables/columns

---

## API overview

| Area | Paths |
|------|--------|
| Auth | `/api/auth/register` `login` `logout` `me` `change-password` `forgot-password` `reset-password` |
| Account | `/api/account` `characters` `tools/*` |
| Rankings | `/api/rankings/:type` |
| Server | `/api/server` |
| Shop | `/api/shop/*` |
| Gift codes | `/api/giftcodes/redeem` |
| News / Downloads | `/api/news` `/api/downloads` |
| Vote | `/api/vote/*` |
| Admin | `/api/admin/*` (backend role check) |

Consistent JSON: `{ success, message, data }` or `{ success:false, code, message }`.

---

## Feature flags

| Flag | Default | Notes |
|------|---------|--------|
| `ENABLE_WEBSHOP` | true | Catalog UI |
| `ENABLE_WEBSHOP_DELIVERY` | **false** | Requires verified Item Adapter |
| `ENABLE_RESET` / `GRAND_RESET` | **false** | Prefer official SPs when mapped |
| `ENABLE_CLEAR_PK` / `UNSTUCK` | **false** | Configurable coords/PK values |
| `ENABLE_VIP` | **false** | Needs real VIP table map |
| `ENABLE_GIFT_CODES` | true | Local CMS store + currency adapter |
| `ENABLE_VOTE_REWARDS` | **false** | No fake provider verification |

---

## MU Database Adapter

`server/adapters/mu/index.js` switches between:

- `mock.js` — frontend/dev without SQL
- `mssql.js` — parameterized queries, configurable schema

Modules: accounts, characters, rankings, guilds, currency, vip, serverStats, discovery.

---

## Item Adapter

`server/adapters/item/itemAdapter.js` blocks delivery until Season 21 item serialization is verified. Do not invent item encoding.

---

## Security

- Helmet, CORS, rate limits, Zod validation
- JWT in httpOnly cookies (+ optional Bearer)
- Admin checked on backend via `ADMIN_USERNAMES`
- Parameterized SQL; no stack/SQL leaks in production responses
- Audit log for register/login/password/shop/gift/admin actions
- Never commit `.env` or real credentials

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite frontend |
| `npm run server` | Express API |
| `npm run dev:all` | Both |
| `npm run build` | Production frontend build |
| `npm start` | API only |

---

## Database safety

During discovery: SELECT only. No automated `DROP` / `TRUNCATE` / mass deletes. Write ops use transactions where multiple tables are affected. Schema-dependent tools stay feature-flagged off until verified.

---

## License

See `LICENSE`. Season 21 branding and assets belong to their respective owners / Mu Breda.
