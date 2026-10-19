# Launcher client patches (api.mubreda.net)

- `GET /api/launcher/manifest` → `patches/manifest.json`
- `GET /patches/1.0.1/...` → files under `patches/1.0.1/`

Upload this folder to the VPS at `/var/www/CMSMuBreda/patches/`.
BMD binaries are gitignored — use `scp` / FileZilla.
