import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { closePools } from './db/pool.js';
import apiRoutes from './routes/index.js';
import { PATCHES_ROOT } from './routes/launcher.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import * as donationsController from './controllers/donationsController.js';
import installRoutes, { serveInstallPage } from './install/routes.js';
import { isInstalled } from './install/state.js';
import { loadAdminConfigOnBoot } from './services/adminConfigService.js';

loadAdminConfigOnBoot();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

const app = express();

app.set('trust proxy', config.api.trustProxy);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

const corsOrigins = String(config.api.corsOrigin)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

// Donation webhooks need raw / urlencoded bodies before JSON parser
app.post(
  '/api/donations/webhooks/astropay',
  express.raw({ type: 'application/json' }),
  donationsController.webhookAstroPay,
);
app.post(
  '/api/donations/webhooks/mercadopago',
  express.raw({ type: '*/*' }),
  donationsController.webhookMercadoPago,
);
app.post(
  '/api/donations/webhooks/paypal',
  express.urlencoded({ extended: false }),
  donationsController.webhookPaypal,
);

app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

// cPanel / first-time setup (WebEngine-style installer)
app.get('/install', serveInstallPage);
app.use('/api/install', installRoutes);

// Client launcher patches: GET /patches/1.0.1/Data/...
app.use(
  '/patches',
  express.static(PATCHES_ROOT, {
    fallthrough: true,
    maxAge: '1h',
    index: false,
  }),
);

app.use('/api', apiRoutes);

// Production / cPanel: serve Vite build + SPA fallback (same Node process as API).
// API-only (api.mubreda.net): set SERVE_SPA=false — do not serve dist/.
const serveSpaFlag = String(process.env.SERVE_SPA ?? '').trim().toLowerCase();
const serveSpa =
  serveSpaFlag === 'false' || serveSpaFlag === '0'
    ? false
    : config.isProduction || serveSpaFlag === 'true' || serveSpaFlag === '1';
if (serveSpa) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/install') ||
      req.path.startsWith('/patches')
    ) {
      return next();
    }
    return res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

if (!isInstalled() && config.isProduction) {
  console.warn('[CMSMuBreda] Not installed yet — open /install to configure SQL + secrets.');
}

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.api.port, () => {
  console.log(`[CMSMuBreda] API listening on http://localhost:${config.api.port}`);
  console.log(`[CMSMuBreda] MU_DATABASE_MODE=${config.muDatabaseMode}`);
  console.log(`[CMSMuBreda] HASH_METHOD=${config.hashMethod}`);
  console.log(`[CMSMuBreda] CORS_ORIGIN=${config.api.corsOrigin}`);
  console.log(`[CMSMuBreda] Launcher patches dir: ${PATCHES_ROOT}`);
});
async function shutdown(signal) {
  console.log(`[CMSMuBreda] ${signal} received, shutting down...`);
  server.close();
  try {
    await closePools();
  } catch {
    /* ignore */
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;
