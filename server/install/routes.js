import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sql from 'mssql';
import { isInstalled, markInstalled, writeEnvFile } from './state.js';
import { createAdminAccountSql, createAdminAccountMock } from './createAdmin.js';
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
    adminPassword,
    adminPasswordConfirm,
    adminEmail,
    jwtSecret,
    siteUrl,
    testConnection = true,
    skipSql = false,
  } = req.body || {};

  if (!jwtSecret || !siteUrl || !adminUsername || !adminPassword || !adminEmail) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Missing required install fields.');
  }
  if (String(adminPassword) !== String(adminPasswordConfirm || '')) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Admin passwords do not match.');
  }
  if (!/^[a-zA-Z0-9]{4,10}$/.test(String(adminUsername))) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Admin username must be 4–10 alphanumeric characters.');
  }
  if (String(adminPassword).length < 4 || String(adminPassword).length > 20) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Admin password must be 4–20 characters.');
  }
  if (String(jwtSecret).length < 16) {
    return fail(res, 400, 'VALIDATION_ERROR', 'JWT secret must be at least 16 characters.');
  }

  const useMockOnly = skipSql === true || skipSql === 'true' || !dbHost;
  const port = Number(dbPort) || 1433;

  if (!useMockOnly) {
    if (!dbHost || !dbUser || !dbPassword) {
      return fail(res, 400, 'VALIDATION_ERROR', 'Database credentials are required.');
    }

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
  }

  const envPatch = {
    NODE_ENV: 'production',
    MU_DATABASE_MODE: useMockOnly ? 'mock' : 'production',
    HASH_METHOD: hashMethod,
    JWT_SECRET: jwtSecret,
    ADMIN_USERNAMES: adminUsername,
    CORS_ORIGIN: siteUrl.replace(/\/$/, ''),
    COOKIE_SECURE: useMockOnly ? 'false' : 'true',
    TRUST_PROXY: '1',
    ENABLE_DONATIONS: 'true',
    DONATIONS_MOCK: useMockOnly ? 'true' : 'false',
    ENABLE_RESET: 'false',
    ENABLE_GRAND_RESET: 'false',
    ENABLE_CLEAR_PK: 'false',
    ENABLE_UNSTUCK: 'true',
    ENABLE_WEBSHOP_DELIVERY: 'false',
  };

  if (!useMockOnly) {
    Object.assign(envPatch, {
      DB_HOST: dbHost,
      DB_PORT: String(port),
      DB_DATABASE: dbDatabase,
      DB_USER: dbUser,
      DB_PASSWORD: dbPassword,
      DB_ENCRYPT: 'false',
      DB_TRUST_CERT: 'true',
    });
  }

  writeEnvFile(envPatch);

  let adminResult;
  try {
    if (useMockOnly) {
      // Note: mock is blocked when NODE_ENV=production at runtime — for cPanel always use SQL.
      // This path is for emergency local tooling only when skipSql=true and NODE_ENV later set to development.
      adminResult = await createAdminAccountMock({
        username: adminUsername,
        password: adminPassword,
        email: adminEmail,
      });
    } else {
      adminResult = await createAdminAccountSql({
        dbHost,
        dbPort: port,
        dbDatabase,
        dbUser,
        dbPassword,
        username: adminUsername,
        password: adminPassword,
        email: adminEmail,
        hashMethod,
      });
    }
  } catch (err) {
    return fail(
      res,
      500,
      'ADMIN_CREATE_FAILED',
      `Could not create admin account: ${err.message || 'unknown error'}`,
    );
  }

  markInstalled({
    adminUsername,
    adminEmail,
    siteUrl: siteUrl.replace(/\/$/, ''),
    dbHost: useMockOnly ? null : dbHost,
    dbDatabase: useMockOnly ? null : dbDatabase,
    adminCreated: adminResult.created,
    adminExisted: adminResult.existed,
  });

  return ok(
    res,
    {
      installed: true,
      admin: {
        username: adminUsername,
        created: adminResult.created,
        existed: adminResult.existed,
      },
    },
    adminResult.existed
      ? 'Installed. Admin username already existed in MEMB_INFO and was granted AdminCP access. Restart Node, then login at /login → /admin.'
      : 'Installed. Admin account created. Restart the Node.js app, then login → /admin (AdminCP).',
    201,
  );
});

export function serveInstallPage(_req, res) {
  // Install page uses inline <script>; relax CSP only for this HTML.
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "font-src 'self' https: data:",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "img-src 'self' data:",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline'",
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
    ].join('; '),
  );

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
