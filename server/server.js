import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { closePools } from './db/pool.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

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

app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

app.use('/api', apiRoutes);

// Production: serve Vite build + SPA fallback (API routes already mounted)
if (config.isProduction) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.api.port, () => {
  console.log(`[CMSMuBreda] API listening on http://localhost:${config.api.port}`);
  console.log(`[CMSMuBreda] MU_DATABASE_MODE=${config.muDatabaseMode}`);
  console.log(`[CMSMuBreda] HASH_METHOD=${config.hashMethod}`);
  console.log(`[CMSMuBreda] CORS_ORIGIN=${config.api.corsOrigin}`);
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
