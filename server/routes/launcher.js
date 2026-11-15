import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Router } from 'express';
import { ok, fail } from '../utils/response.js';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PATCHES_ROOT = path.resolve(__dirname, '../../patches');
const MANIFEST_PATH = path.join(PATCHES_ROOT, 'manifest.json');

/**
 * GET /api/launcher/manifest
 * Client autoupdate for MuBreda-Launcher.
 */
router.get('/manifest', async (_req, res) => {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf8');
    const json = JSON.parse(raw);
    return res.json(json);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return fail(res, 404, 'NOT_FOUND', 'Launcher manifest not published yet.');
    }
    console.error('[launcher/manifest]', err.message);
    return fail(res, 500, 'SERVER_ERROR', 'Failed to read launcher manifest.');
  }
});

// Patch binaries: GET /api/launcher/files/1.0.1/Data/...
// Served under /api so nginx that only proxies /api still works.
router.use(
  '/files',
  express.static(PATCHES_ROOT, {
    fallthrough: false,
    maxAge: '1h',
    index: false,
  }),
);

// ---- Season 6 (LauncherS6) ---------------------------------------------------------------
// The WHOLE client as the Season 6 launcher checks it (an old or broken client repairs itself),
// published by "Test Server/publicar-cliente-launcher.ps1":
//   patches-s6/manifest.json        GET /api/launcher/s6/manifest
//   patches-s6/<version>/<path>     GET /api/launcher/s6/files/<version>/<path>
// A file that didn't change keeps the url of the version that brought it, so a new version
// only uploads what changed.
export const PATCHES_S6_ROOT = path.resolve(__dirname, '../../patches-s6');
const S6_MANIFEST_PATH = path.join(PATCHES_S6_ROOT, 'manifest.json');

async function sendS6Manifest(res, pick) {
  try {
    const manifest = JSON.parse(await readFile(S6_MANIFEST_PATH, 'utf8'));
    // Every start of the launcher asks for it: never from a cache.
    res.set('Cache-Control', 'no-cache');
    return ok(res, pick(manifest));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return fail(res, 404, 'NOT_FOUND', 'Season 6 client not published yet.');
    }
    console.error('[launcher/s6/manifest]', err.message);
    return fail(res, 500, 'SERVER_ERROR', 'Failed to read the Season 6 manifest.');
  }
}

/** GET /api/launcher/s6/manifest: { version, releasedAt, files: [{ path, size, sha256, url }], delete } */
router.get('/s6/manifest', (_req, res) => sendS6Manifest(res, (m) => m));

/** GET /api/launcher/s6/version: the light version of the above. */
router.get('/s6/version', (_req, res) =>
  sendS6Manifest(res, (m) => ({
    version: m.version,
    releasedAt: m.releasedAt,
    files: m.files?.length ?? 0,
    manifestUrl: '/api/launcher/s6/manifest',
  })),
);

// The files never change under the same version folder, so they can be cached for long.
router.use(
  '/s6/files',
  express.static(PATCHES_S6_ROOT, {
    fallthrough: false,
    maxAge: '7d',
    index: false,
    dotfiles: 'deny',
  }),
);

export default router;
