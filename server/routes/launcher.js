import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Router } from 'express';
import { fail } from '../utils/response.js';

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

export default router;
