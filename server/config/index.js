import dotenv from 'dotenv';
import { featureFlags } from './features.js';
import { muSchema } from './muSchema.js';
import { serverInfo } from './serverInfo.js';

dotenv.config();

function env(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return value;
}

function envBool(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const nodeEnv = env('NODE_ENV', 'development');
const requestedMode = env('MU_DATABASE_MODE', 'mock').toLowerCase();

/** Mock is forbidden in production to prevent accidental fake data live. */
export const muDatabaseMode =
  nodeEnv === 'production' ? 'production' : requestedMode === 'production' ? 'production' : 'mock';

export const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  muDatabaseMode,
  isMock: muDatabaseMode === 'mock',
  /** Which game database the production mode talks to: mssql (MuDevs Season 21) | openmu (OpenMU Season 6, PostgreSQL). */
  muBackend: env('MU_BACKEND', 'mssql').toLowerCase() === 'openmu' ? 'openmu' : 'mssql',

  db: {
    host: env('DB_HOST', env('DB_SERVER', '127.0.0.1')),
    port: envInt('DB_PORT', 1433),
    user: env('DB_USER', ''),
    password: env('DB_PASSWORD', ''),
    database: env('DB_DATABASE', env('DB_NAME', env('MU_BACKEND', '').toLowerCase() === 'openmu' ? 'openmu' : 'MuOnline')),
    database2: env('DB_DATABASE_2', ''),
    /** Optional Ranking DB (Devil Square / Blood Castle). Empty = same as MuOnline. */
    databaseRanking: env('DB_DATABASE_RANKING', env('DB_RANKING', '')),
    encrypt: envBool('DB_ENCRYPT', false),
    trustServerCertificate: envBool('DB_TRUST_CERT', true),
  },

  api: {
    port: envInt('PORT', envInt('API_PORT', 3001)),
    // Comma-separated list supported (e.g. http://localhost:5173,http://localhost:5174)
    corsOrigin: env('CORS_ORIGIN', 'http://localhost:5173,http://localhost:5174'),
    trustProxy: envInt('TRUST_PROXY', 1),
  },

  auth: {
    jwtSecret: env('JWT_SECRET', 'dev-only-change-me'),
    jwtExpiresIn: env('JWT_EXPIRES_IN', '7d'),
    cookieName: env('COOKIE_NAME', 'mubreda_session'),
    cookieSecure: envBool('COOKIE_SECURE', nodeEnv === 'production'),
    cookieSameSite: env('COOKIE_SAME_SITE', 'lax'),
    /** e.g. .mubreda.com — required when frontend and API are on different subdomains */
    cookieDomain: env('COOKIE_DOMAIN', ''),
  },

  hashMethod: env('HASH_METHOD', 'md5').toLowerCase(),
  sha256Salt: env('SHA256_SALT', ''),

  registration: {
    defaultSnoNumb: env('DEFAULT_SNO_NUMB', '1111111111111'),
    insertViCurrInfo: envBool('INSERT_VI_CURR_INFO', false),
    allowDuplicateEmails: envBool('ALLOW_DUPLICATE_EMAILS', false),
  },

  rateLimit: {
    windowMs: envInt('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: envInt('RATE_LIMIT_MAX', 100),
    authMax: envInt('AUTH_RATE_LIMIT_MAX', 10),
    registerMax: envInt('REGISTER_RATE_LIMIT_MAX', 5),
  },

  adminUsernames: env('ADMIN_USERNAMES', 'admin')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),

  tools: {
    unstuckMap: envInt('UNSTUCK_MAP', 0),
    unstuckX: envInt('UNSTUCK_X', 125),
    unstuckY: envInt('UNSTUCK_Y', 125),
    clearPkLevel: envInt('CLEAR_PK_LEVEL', 3),
  },

  features: featureFlags,
  mu: muSchema,
  server: serverInfo,

  donations: {
    mockMode: envBool('DONATIONS_MOCK', requestedMode !== 'production'),
    publicBaseUrl: env('DONATIONS_PUBLIC_BASE_URL', env('PUBLIC_BASE_URL', 'http://localhost:5173')),
    /** API public origin for payment callbacks (e.g. https://api.mubreda.net). */
    webhookBaseUrl: env(
      'DONATIONS_WEBHOOK_BASE_URL',
      env('PUBLIC_API_BASE_URL', 'https://api.mubreda.net'),
    ),
    successUrl: env('DONATIONS_SUCCESS_URL', ''),
    cancelUrl: env('DONATIONS_CANCEL_URL', ''),
    mercadopago: {
      enabled: envBool('MP_ENABLED', true),
      accessToken: env('MP_ACCESS_TOKEN', ''),
      webhookSecret: env('MP_WEBHOOK_SECRET', ''),
      description: env('MP_DESCRIPTION', 'MU Breda donation'),
    },
    astropay: {
      enabled: envBool('ASTROPAY_ENABLED', true),
      apiKey: env('ASTROPAY_API_KEY', ''),
      apiSecret: env('ASTROPAY_API_SECRET', ''),
      sandbox: envBool('ASTROPAY_SANDBOX', true),
      country: env('ASTROPAY_COUNTRY', 'AR'),
      currency: env('ASTROPAY_CURRENCY', ''),
    },
    paypal: {
      enabled: envBool('PAYPAL_ENABLED', true),
      sandbox: envBool('PAYPAL_SANDBOX', true),
      email: env('PAYPAL_EMAIL', ''),
      title: env('PAYPAL_TITLE', 'Donation for WCoinC'),
      currency: env('PAYPAL_CURRENCY', 'USD'),
      returnUrl: env('PAYPAL_RETURN_URL', 'http://localhost:5173/donate?status=paypal'),
      notifyUrl: env('PAYPAL_NOTIFY_URL', 'http://localhost:3001/api/donations/webhooks/paypal'),
      conversionRate: envInt('PAYPAL_CONVERSION_RATE', 100),
    },
  },
};

if (config.isProduction && config.auth.jwtSecret === 'dev-only-change-me') {
  console.warn('[config] WARNING: JWT_SECRET is using the insecure default in production.');
}

export default config;
