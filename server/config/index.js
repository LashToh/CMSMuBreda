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

  db: {
    host: env('DB_HOST', env('DB_SERVER', '127.0.0.1')),
    port: envInt('DB_PORT', 1433),
    user: env('DB_USER', ''),
    password: env('DB_PASSWORD', ''),
    database: env('DB_DATABASE', env('DB_NAME', 'MuOnline')),
    database2: env('DB_DATABASE_2', ''),
    encrypt: envBool('DB_ENCRYPT', false),
    trustServerCertificate: envBool('DB_TRUST_CERT', true),
  },

  api: {
    port: envInt('PORT', envInt('API_PORT', 3001)),
    corsOrigin: env('CORS_ORIGIN', 'http://localhost:5173'),
    trustProxy: envInt('TRUST_PROXY', 1),
  },

  auth: {
    jwtSecret: env('JWT_SECRET', 'dev-only-change-me'),
    jwtExpiresIn: env('JWT_EXPIRES_IN', '7d'),
    cookieName: env('COOKIE_NAME', 'mubreda_session'),
    cookieSecure: envBool('COOKIE_SECURE', nodeEnv === 'production'),
    cookieSameSite: env('COOKIE_SAME_SITE', 'lax'),
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
};

if (config.isProduction && config.auth.jwtSecret === 'dev-only-change-me') {
  console.warn('[config] WARNING: JWT_SECRET is using the insecure default in production.');
}

export default config;
