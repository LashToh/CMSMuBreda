import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sql from 'mssql';
import { isInstalled, markInstalled, writeEnvFile } from './state.js';
import { fail, ok } from '../utils/response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

function installAllowed() {
  if (!isInstalled()) return true;
  return process.env.INSTALL_ALLOW === 'true';
}

router.get('/status', (_req, res) => {
  return ok(res, {
    installed: isInstalled(),
    allow: installAllowed(),
  });
});

router.post('/', async (req, res) => {
  if (!installAllowed()) {
    return fail(res, 403, 'ALREADY_INSTALLED', 'CMS already installed. Set INSTALL_ALLOW=true to reopen.');
  }

  const {
    dbHost,
    dbPort = 1433,
    dbDatabase = 'MuOnline',
    dbUser,
    dbPassword,
    hashMethod = 'md5',
    adminUsername = 'admin',
    jwtSecret,
    siteUrl,
    testConnection = true,
  } = req.body || {};

  if (!dbHost || !dbUser || !dbPassword || !jwtSecret || !siteUrl) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Missing required install fields.');
  }
  if (String(jwtSecret).length < 16) {
    return fail(res, 400, 'VALIDATION_ERROR', 'JWT secret must be at least 16 characters.');
  }

  const port = Number(dbPort) || 1433;

  if (testConnection !== false && testConnection !== 'false') {
    let pool;
    try {
      pool = await sql.connect({
        server: dbHost,
        port,
        database: dbDatabase,
        user: dbUser,
        password: dbPassword,
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true,
        },
        connectionTimeout: 8000,
        requestTimeout: 8000,
      });
      await pool.request().query('SELECT 1 AS ok');
    } catch (err) {
      return fail(
        res,
        400,
        'DB_CONNECTION_FAILED',
        `SQL connection failed: ${err.message || 'unknown error'}`,
      );
    } finally {
      try {
        await pool?.close();
      } catch {
        /* ignore */
      }
    }
  }

  writeEnvFile({
    NODE_ENV: 'production',
    MU_DATABASE_MODE: 'production',
    DB_HOST: dbHost,
    DB_PORT: String(port),
    DB_DATABASE: dbDatabase,
    DB_USER: dbUser,
    DB_PASSWORD: dbPassword,
    DB_ENCRYPT: 'false',
    DB_TRUST_CERT: 'true',
    HASH_METHOD: hashMethod,
    JWT_SECRET: jwtSecret,
    ADMIN_USERNAMES: adminUsername,
    CORS_ORIGIN: siteUrl.replace(/\/$/, ''),
    COOKIE_SECURE: 'true',
    TRUST_PROXY: '1',
    ENABLE_DONATIONS: 'true',
    DONATIONS_MOCK: 'false',
    ENABLE_RESET: 'false',
    ENABLE_GRAND_RESET: 'false',
    ENABLE_CLEAR_PK: 'false',
    ENABLE_UNSTUCK: 'false',
    ENABLE_WEBSHOP_DELIVERY: 'false',
  });

  markInstalled({
    adminUsername,
    siteUrl: siteUrl.replace(/\/$/, ''),
    dbHost,
    dbDatabase,
  });

  return ok(
    res,
    { installed: true },
    'Installation saved. Restart the Node.js app in cPanel, then open your site.',
    201,
  );
});

export function serveInstallPage(_req, res) {
  if (!installAllowed()) {
    return res.status(403).type('html').send(`
      <!doctype html><html><body style="background:#090909;color:#f0d08a;font-family:Georgia;padding:2rem">
        <h1>Already installed</h1>
        <p>Remove server/data/.installed or set INSTALL_ALLOW=true to reopen the installer.</p>
        <p><a href="/" style="color:#c61717">Go to site</a></p>
      </body></html>
    `);
  }
  return res.sendFile(path.join(__dirname, 'installPage.html'));
}

export default router;
