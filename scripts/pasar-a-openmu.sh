#!/usr/bin/env bash
# Pasa la web (CMS) del server Season 21 (SQL Server) al Season 6 (OpenMU, PostgreSQL).
# Se corre en el VPS de la web, desde la carpeta del CMS:
#   cd /var/www/CMSMuBreda && bash scripts/pasar-a-openmu.sh
# Antes hay que copiar los archivos nuevos del CMS (adaptador openmu) y tener los datos que
# muestra la opcion 9 de servidor.ps1 en el VPS del juego.
# Guarda una copia de .env y de server/data/admin-secrets.json; para volver atras:
#   bash scripts/pasar-a-openmu.sh volver
set -e
cd "$(dirname "$0")/.."
SECRETS=server/data/admin-secrets.json
STAMP=$(date +%Y%m%d-%H%M%S)

# El proceso de pm2 que corre esta carpeta (en este VPS hay otros, como la landing vieja)
pm2_name() {
  pm2 jlist | node -e '
    let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
      const cwd = process.argv[1];
      const p = JSON.parse(s).find((x) => x.pm2_env && x.pm2_env.pm_cwd === cwd);
      process.stdout.write(p ? p.name : "");
    });' "$(pwd)"
}

if [ "$1" = "volver" ]; then
  last_env=$(ls -1t .env.antes-openmu-* 2>/dev/null | head -1)
  last_sec=$(ls -1t $SECRETS.antes-openmu-* 2>/dev/null | head -1)
  [ -n "$last_env" ] && cp "$last_env" .env && echo "Restaurado .env desde $last_env"
  [ -n "$last_sec" ] && cp "$last_sec" "$SECRETS" && echo "Restaurado $SECRETS desde $last_sec"
  pm2 restart "$(pm2_name)"
  exit 0
fi

[ -f server/adapters/mu/openmu.js ] || { echo "Falta server/adapters/mu/openmu.js: copia primero los archivos nuevos del CMS."; exit 1; }

read -r -p "IP del VPS del juego [51.79.7.173]: " DBHOST; DBHOST=${DBHOST:-51.79.7.173}
read -r -p "Puerto de la base [1433]: " DBPORT; DBPORT=${DBPORT:-1433}
read -r -s -p "DB_PASSWORD que mostro la opcion 9 de servidor.ps1: " DBPW; echo
read -r -p "Tu cuenta del juego (Season 6) que va a ser admin de la web: " ADMINUSER
[ -n "$DBPW" ] && [ -n "$ADMINUSER" ] || { echo "Faltan datos."; exit 1; }

# 1) Copias de seguridad
cp .env ".env.antes-openmu-$STAMP"
[ -f "$SECRETS" ] && cp "$SECRETS" "$SECRETS.antes-openmu-$STAMP"
echo "Copias guardadas (.env.antes-openmu-$STAMP)."

# 2) Librerias nuevas (PostgreSQL y BCrypt)
npm install pg@^8.13.1 bcryptjs@^2.4.3 --no-audit --no-fund

# 3) .env: cada clave se cambia si esta, o se agrega
set_env() {
  local key="$1" value="$2"
  if grep -q "^$key=" .env; then
    sed -i "s|^$key=.*|$key=$value|" .env
  else
    echo "$key=$value" >> .env
  fi
}
set_env MU_DATABASE_MODE production
set_env MU_BACKEND openmu
set_env DB_HOST "$DBHOST"
set_env DB_PORT "$DBPORT"
set_env DB_USER breda_web
set_env DB_PASSWORD "$DBPW"
set_env DB_DATABASE openmu
set_env ADMIN_USERNAMES "$ADMINUSER"
set_env HASH_METHOD bcrypt
set_env SERVER_SEASON 6
set_env GS_HOST "$DBHOST"
set_env GS_PORT 55901

# 4) Lo cargado desde el AdminCP pisa al .env: se cambia ahi tambien
if [ -f "$SECRETS" ]; then
  DBHOST="$DBHOST" DBPORT="$DBPORT" DBPW="$DBPW" ADMINUSER="$ADMINUSER" node -e '
    const fs = require("fs");
    const p = process.argv[1];
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    d.db = Object.assign({}, d.db, {
      host: process.env.DBHOST, port: Number(process.env.DBPORT), user: "breda_web",
      password: process.env.DBPW, database: "openmu", database2: "", databaseRanking: "",
    });
    if (d.hash) d.hash.method = "bcrypt";
    if (d.server) { d.server.gsHost = process.env.DBHOST; d.server.gsPort = 55901; }
    // The admins of the AdminCP are accounts of the game: the Season 6 one goes in too.
    const admins = new Set([].concat(d.adminUsernames || []).map((a) => String(a).toLowerCase()));
    admins.add(process.env.ADMINUSER.toLowerCase());
    d.adminUsernames = [...admins];
    fs.writeFileSync(p, JSON.stringify(d, null, 2), "utf8");
  ' "$SECRETS"
  echo "AdminCP: base actualizada en $SECRETS."
fi

# 5) Reiniciar la API y probar
APP=$(pm2_name)
[ -n "$APP" ] || { echo "No encuentro en pm2 el proceso de esta carpeta ($(pwd)): pm2 list"; exit 1; }
pm2 restart "$APP"
sleep 4
echo
echo "Estado del server segun la web:"
PORTNUM=$(grep -E "^PORT=" .env | cut -d= -f2); PORTNUM=${PORTNUM:-$(grep -E "^API_PORT=" .env | cut -d= -f2)}
curl -s "http://127.0.0.1:${PORTNUM:-3001}/api/server"
echo
echo "Si algo fallo: pm2 logs $APP --lines 50"
echo "Para volver al Season 21: bash scripts/pasar-a-openmu.sh volver"
