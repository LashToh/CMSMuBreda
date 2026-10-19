# Guía paso a paso: API en VPS (`api.mubreda.net`)

Esta guía es para **principiantes**. Solo levantamos la **API**. El sitio web **no** se instala acá (seguís con tu beta).

Vas a necesitar a mano:

| Dato | Ejemplo |
|------|---------|
| IP del VPS | `123.45.67.89` |
| Usuario SSH | `root` o `ubuntu` |
| Contraseña o llave SSH del VPS | (la del panel del hosting) |
| Datos de SQL Server (MU) | host, puerto, user, password, DB |
| Acceso al DNS de `mubreda.net` | Cloudflare, registro, etc. |

---

## Paso 0 — Conectarte al VPS

1. En Windows abrí **PowerShell** o **Terminal**.
2. Escribí (cambiá usuario e IP):

```bash
ssh root@123.45.67.89
```

3. La primera vez pregunta si confías en el servidor → escribí `yes` y Enter.
4. Pedirá la contraseña (no se ve mientras escribís) → Enter.

Si entraste bien, vas a ver un prompt tipo `root@vps:~#`. **Ya estás dentro de Linux.**

> Tip: todo lo que pegues de acá en adelante se ejecuta **en el VPS**, no en tu PC.

---

## Paso 1 — Apuntar el dominio a la IP

En el panel DNS de `mubreda.net` (Cloudflare, Namecheap, etc.):

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| **A** | `api` | IP pública del VPS | Auto / 300 |

Resultado esperado: `api.mubreda.net` → tu VPS.

Esperá unos minutos. Podés chequear en [https://dnschecker.org](https://dnschecker.org) buscando `api.mubreda.net`.

---

## Paso 2 — Actualizar el sistema e instalar Node

Pegá estos comandos **uno por uno** (Enter después de cada bloque):

```bash
sudo apt update
sudo apt upgrade -y
```

Instalar Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Comprobar:

```bash
node -v
npm -v
```

Deberías ver algo como `v20.x.x`.

Instalar PM2 (mantiene la API encendida):

```bash
sudo npm i -g pm2
```

---

## Paso 3 — Subir el proyecto al VPS

### Opción A — Con Git (recomendada)

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/LashToh/CMSMuBreda.git CMSMuBreda
cd CMSMuBreda
sudo chown -R $USER:$USER .
```

Si el repo es privado, Git te pedirá usuario/token de GitHub.

### Opción B — Sin Git (ZIP / carpeta desde tu PC)

En tu **PC** (PowerShell), desde fuera del VPS:

```powershell
scp -r C:\Users\Neo\CMSMuBreda root@123.45.67.89:/var/www/CMSMuBreda
```

Luego en el **VPS**:

```bash
cd /var/www/CMSMuBreda
```

---

## Paso 4 — Instalar dependencias

```bash
cd /var/www/CMSMuBreda
npm install
```

**No** hace falta `npm run build` (no servimos el sitio desde acá).

---

## Paso 5 — Crear el archivo `.env`

```bash
cd /var/www/CMSMuBreda
nano .env
```

`nano` es un editor de texto. Se abre en negro.

1. Pegá esto (botón derecho del mouse suele pegar en SSH):

```env
NODE_ENV=production
MU_DATABASE_MODE=production
SERVE_SPA=false
API_PORT=3001
PORT=3001
TRUST_PROXY=1

CORS_ORIGIN=https://mubreda.net,https://www.mubreda.net
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
COOKIE_DOMAIN=.mubreda.net
COOKIE_NAME=mubreda_session
DONATIONS_PUBLIC_BASE_URL=https://mubreda.net
PUBLIC_BASE_URL=https://mubreda.net

DB_HOST=IP_O_HOST_DE_TU_SQL
DB_PORT=1433
DB_USER=tu_usuario_sql
DB_PASSWORD=tu_password_sql
DB_DATABASE=MuOnline
DB_ENCRYPT=false
DB_TRUST_CERT=true

JWT_SECRET=poné_una_frase_larga_aleatoria_aca
JWT_EXPIRES_IN=7d

HASH_METHOD=md5
ADMIN_USERNAMES=admin

SERVER_NAME=MU Breda
SERVER_SEASON=21
```

2. Cambiá `DB_*` y `JWT_SECRET` por valores reales.
3. Guardar en nano: `Ctrl + O` → Enter.
4. Salir: `Ctrl + X`.

---

## Paso 6 — Encender la API con PM2

```bash
cd /var/www/CMSMuBreda
pm2 start app.js --name mubreda-api
pm2 save
pm2 startup
```

El último comando (`pm2 startup`) te imprime **otra línea** que empieza con `sudo ...`.  
**Copiá esa línea, pegala y dale Enter.** Así la API arranca sola si el VPS se reinicia.

Probar en el VPS:

```bash
curl -s http://127.0.0.1:3001/api/health
```

Si responde JSON con `"success":true`, la API está viva.

Ver logs si algo falla:

```bash
pm2 logs mubreda-api
```

(Salís de los logs con `Ctrl + C`.)

---

## Paso 7 — Firewall (puertos web)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

Cuando pregunte `Proceed with operation` → `y` → Enter.

**No** abras el 3001 a internet: solo Nginx habla con Node por dentro.

---

## Paso 8 — Nginx (puente entre internet y Node)

Instalar:

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Crear la config:

```bash
sudo nano /etc/nginx/sites-available/api.mubreda.net
```

Pegá **exactamente** esto:

```nginx
server {
    listen 80;
    server_name api.mubreda.net;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Guardar: `Ctrl+O` → Enter · Salir: `Ctrl+X`.

Activar el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/api.mubreda.net /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Si `nginx -t` dice `syntax is ok`, vas bien.

---

## Paso 9 — HTTPS (candado verde)

El DNS de `api` tiene que estar ya apuntando al VPS.

```bash
sudo certbot --nginx -d api.mubreda.net
```

- Pedirá email → poné el tuyo.
- Aceptá términos (`Y`).
- Pregunta de newsletter → `N` está bien.

Al terminar, abrí en el navegador de tu PC:

**https://api.mubreda.net/api/health**

Debería mostrar JSON OK.

---

## Paso 10 — Instalador web

Abrí:

**https://api.mubreda.net/install**

Completá:

1. Datos de SQL Server  
2. Método de hash (casi siempre `md5`)  
3. Usuario admin + email + password  
4. URL del sitio: `https://mubreda.net`

Cuando termine, en el VPS:

```bash
pm2 restart mubreda-api
```

---

## Paso 11 — Conectar tu sitio beta (cuando quieras)

En el frontend beta, al buildear:

```env
VITE_API_URL=https://api.mubreda.net
```

---

## Comandos útiles (día a día)

| Qué querés | Comando |
|------------|---------|
| Ver si está corriendo | `pm2 status` |
| Ver errores | `pm2 logs mubreda-api` |
| Reiniciar API | `pm2 restart mubreda-api` |
| Parar API | `pm2 stop mubreda-api` |
| Editar `.env` | `nano /var/www/CMSMuBreda/.env` |
| Después de editar `.env` | `pm2 restart mubreda-api` |

---

## Si algo falla

| Problema | Qué mirar |
|----------|-----------|
| `Connection refused` en SSH | IP / usuario / firewall del panel VPS |
| Certbot no valida el dominio | DNS A de `api` aún no apunta al VPS |
| `/api/health` no abre | `pm2 status` + `pm2 logs mubreda-api` + `sudo nginx -t` |
| Install falla con SQL | El SQL debe aceptar la **IP del VPS** (firewall Windows / SQL) |
| `Permission denied` | Anteponé `sudo` al comando |

---

## Resumen ultra corto

1. SSH al VPS  
2. DNS A `api` → IP  
3. Instalar Node + PM2  
4. Subir proyecto + `npm install`  
5. Crear `.env`  
6. `pm2 start app.js --name mubreda-api`  
7. Nginx + Certbot  
8. Abrir `/install`  
9. `pm2 restart mubreda-api`

Cuando estés en un paso concreto y se trabe, mandame la captura o el texto del error y te digo el siguiente comando exacto.
