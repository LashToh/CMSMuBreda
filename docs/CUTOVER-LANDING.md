# Cutover: CMS reemplaza la landing (sin romper launcher)

## Arquitectura final

| Host | Qué sirve | Proceso |
|------|-----------|---------|
| `https://api.mubreda.net` | API + `/api/launcher/*` + patches | `cms-mubreda-api` (PM2) — **no tocar** |
| `https://mubreda.net` | Sitio CMS (React `dist/`) | Nginx estático |

El launcher sigue usando `apiUrl = https://api.mubreda.net`.  
Los patches viven en `/var/www/CMSMuBreda/patches/`.

---

## 0) Checklist antes

En el VPS, confirmá que el autoupdate anda:

```bash
curl -s https://api.mubreda.net/api/launcher/manifest | head -c 200
curl -s -o /dev/null -w "%{http_code}\n" https://api.mubreda.net/api/launcher/files/1.0.3/Data/InGameShopScript/512.2011.006/IBSProduct.txt
```

Manifest JSON + archivo `200`. Si falla, **no** sigas el cutover.

En `.env` de la API (`/var/www/CMSMuBreda/.env`) debe quedar:

```env
SERVE_SPA=false
CORS_ORIGIN=https://mubreda.net,https://www.mubreda.net
COOKIE_DOMAIN=.mubreda.net
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
```

```bash
pm2 restart cms-mubreda-api
```

---

## 1) En tu PC — build del CMS

```powershell
cd C:\Users\Neo\CMSMuBreda
npm install
npm run build
```

(`.env.production` ya tiene `VITE_API_URL=https://api.mubreda.net`.)

---

## 2) Subir el `dist/` al VPS

```powershell
ssh ubuntu@51.79.51.175 "sudo mkdir -p /var/www/mubreda-web && sudo chown ubuntu:ubuntu /var/www/mubreda-web"
scp -r C:\Users\Neo\CMSMuBreda\dist ubuntu@51.79.51.175:/var/www/mubreda-web/
```

---

## 3) Nginx para `mubreda.net` (sitio)

```bash
sudo nano /etc/nginx/sites-available/mubreda.net
```

Pegá (ajustá si ya tenés SSL de certbot — puede que el archivo ya exista):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name mubreda.net www.mubreda.net;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mubreda.net www.mubreda.net;

    # certbot suele insertar ssl_certificate aquí; no borres esas líneas si ya existen

    root /var/www/mubreda-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/mubreda.net /etc/nginx/sites-enabled/
sudo nginx -t
# Si el sitio aún no tiene certificado:
# sudo certbot --nginx -d mubreda.net -d www.mubreda.net
sudo systemctl reload nginx
```

**Importante:** el server block de `api.mubreda.net` debe seguir proxyando a `cms-mubreda-api` (puerto 3002). No lo cambies a estático.

---

## 4) Apagar la landing vieja (`mubreda-api`)

Solo cuando `https://mubreda.net` ya muestre el CMS:

```bash
pm2 stop mubreda-api
pm2 save
```

No borres el proceso hasta confirmar todo. **No** hagas `pm2 stop cms-mubreda-api`.

---

## 5) Verificación post-cutover

| URL | Esperado |
|-----|----------|
| https://mubreda.net | CMS (home Mu Breda) |
| https://api.mubreda.net/api/health | JSON OK |
| https://api.mubreda.net/api/launcher/manifest | JSON con `version` |
| Launcher → actualizar | Baja patches |

---

## Si hay que volver atrás

1. Nginx de `mubreda.net` otra vez al proxy del landing (`mubreda-api` :3001).
2. `pm2 start mubreda-api`
3. `cms-mubreda-api` no se toca → launcher sigue igual.

---

## Actualizar el sitio después

```powershell
cd C:\Users\Neo\CMSMuBreda
npm run build
scp -r dist\* ubuntu@51.79.51.175:/var/www/mubreda-web/dist/
```

(o `scp -r dist ubuntu@...:/var/www/mubreda-web/` reemplazando la carpeta)
