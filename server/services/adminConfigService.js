import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/index.js';
import { writeEnvFile } from '../install/state.js';
import { appendAudit, readStore, updateStore } from '../data/cmsStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SECRETS_PATH = path.join(__dirname, '../data/admin-secrets.json');

const FEATURE_KEYS = [
  'webshop',
  'webshopDelivery',
  'reset',
  'grandReset',
  'clearPk',
  'unstuck',
  'vip',
  'giftCodes',
  'voteRewards',
  'news',
  'downloads',
  'rankings',
  'donations',
];

const FEATURE_ENV = {
  webshop: 'ENABLE_WEBSHOP',
  webshopDelivery: 'ENABLE_WEBSHOP_DELIVERY',
  reset: 'ENABLE_RESET',
  grandReset: 'ENABLE_GRAND_RESET',
  clearPk: 'ENABLE_CLEAR_PK',
  unstuck: 'ENABLE_UNSTUCK',
  vip: 'ENABLE_VIP',
  giftCodes: 'ENABLE_GIFT_CODES',
  voteRewards: 'ENABLE_VOTE_REWARDS',
  news: 'ENABLE_NEWS',
  downloads: 'ENABLE_DOWNLOADS',
  rankings: 'ENABLE_RANKINGS',
  donations: 'ENABLE_DONATIONS',
};

const CURRENCY_KEYS = ['credits', 'wcoinc', 'wcoinp', 'goblin'];

const CURRENCY_ENV = {
  credits: {
    table: 'CURRENCY_CREDITS_TABLE',
    column: 'CURRENCY_CREDITS_COLUMN',
    userColumn: 'CURRENCY_CREDITS_USER_COLUMN',
  },
  wcoinc: {
    table: 'CURRENCY_WCOINC_TABLE',
    column: 'CURRENCY_WCOINC_COLUMN',
    userColumn: 'CURRENCY_WCOINC_USER_COLUMN',
  },
  wcoinp: {
    table: 'CURRENCY_WCOINP_TABLE',
    column: 'CURRENCY_WCOINP_COLUMN',
    userColumn: 'CURRENCY_WCOINP_USER_COLUMN',
  },
  goblin: {
    table: 'CURRENCY_GOBLIN_TABLE',
    column: 'CURRENCY_GOBLIN_COLUMN',
    userColumn: 'CURRENCY_GOBLIN_USER_COLUMN',
  },
};

function readFile() {
  try {
    if (!fs.existsSync(SECRETS_PATH)) return {};
    return JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeFile(data) {
  fs.mkdirSync(path.dirname(SECRETS_PATH), { recursive: true });
  fs.writeFileSync(SECRETS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function mask(value) {
  const s = String(value || '');
  if (!s) return { set: false, hint: '' };
  if (s.length <= 4) return { set: true, hint: '••••' };
  return { set: true, hint: `••••${s.slice(-4)}` };
}

function asBool(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'boolean') return v;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

function asInt(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mergeSecretField(target, key, incoming, liveFallback) {
  if (incoming === undefined) return;
  const str = String(incoming ?? '').trim();
  if (str === '') {
    if (target[key] == null && liveFallback) target[key] = liveFallback;
    return;
  }
  target[key] = str;
}

function mergeProvider(next, live, key, incoming, fields) {
  next.donations = next.donations || {};
  next.donations[key] = next.donations[key] || {};
  const target = next.donations[key];
  for (const f of fields) {
    if (incoming[f] === undefined) continue;
    const val = incoming[f];
    if (typeof val === 'boolean' || typeof val === 'number') {
      target[f] = val;
      continue;
    }
    mergeSecretField(target, f, val, live[f]);
  }
  if (incoming.enabled != null) target.enabled = Boolean(incoming.enabled);
}

function currencyView(key) {
  const c = config.mu.currencies[key] || {};
  return {
    table: c.table || '',
    column: c.column || '',
    userColumn: c.userColumn || '',
  };
}

function applyCurrencyBlock(data) {
  if (!data.currency) return;
  for (const key of CURRENCY_KEYS) {
    const incoming = data.currency[key];
    if (!incoming) continue;
    config.mu.currencies[key] = {
      ...config.mu.currencies[key],
      ...(incoming.table != null ? { table: String(incoming.table) } : {}),
      ...(incoming.column != null ? { column: String(incoming.column) } : {}),
      ...(incoming.userColumn != null ? { userColumn: String(incoming.userColumn) } : {}),
    };
  }
}

function applyDonationsBlock(data) {
  if (!data.donations) return;
  const d = data.donations;
  if (d.publicBaseUrl != null) config.donations.publicBaseUrl = d.publicBaseUrl;
  if (d.successUrl != null) config.donations.successUrl = d.successUrl;
  if (d.cancelUrl != null) config.donations.cancelUrl = d.cancelUrl;
  if (d.mockMode != null) config.donations.mockMode = Boolean(d.mockMode);

  if (d.mercadopago) {
    Object.assign(config.donations.mercadopago, {
      ...(d.mercadopago.enabled != null ? { enabled: Boolean(d.mercadopago.enabled) } : {}),
      ...(d.mercadopago.accessToken ? { accessToken: d.mercadopago.accessToken } : {}),
      ...(d.mercadopago.webhookSecret ? { webhookSecret: d.mercadopago.webhookSecret } : {}),
      ...(d.mercadopago.description ? { description: d.mercadopago.description } : {}),
    });
  }
  if (d.stripe) {
    Object.assign(config.donations.stripe, {
      ...(d.stripe.enabled != null ? { enabled: Boolean(d.stripe.enabled) } : {}),
      ...(d.stripe.secretKey ? { secretKey: d.stripe.secretKey } : {}),
      ...(d.stripe.publishableKey ? { publishableKey: d.stripe.publishableKey } : {}),
      ...(d.stripe.webhookSecret ? { webhookSecret: d.stripe.webhookSecret } : {}),
      ...(d.stripe.currency ? { currency: d.stripe.currency } : {}),
    });
  }
  if (d.paypal) {
    Object.assign(config.donations.paypal, {
      ...(d.paypal.enabled != null ? { enabled: Boolean(d.paypal.enabled) } : {}),
      ...(d.paypal.sandbox != null ? { sandbox: Boolean(d.paypal.sandbox) } : {}),
      ...(d.paypal.email ? { email: d.paypal.email } : {}),
      ...(d.paypal.title ? { title: d.paypal.title } : {}),
      ...(d.paypal.currency ? { currency: d.paypal.currency } : {}),
      ...(d.paypal.returnUrl ? { returnUrl: d.paypal.returnUrl } : {}),
      ...(d.paypal.notifyUrl ? { notifyUrl: d.paypal.notifyUrl } : {}),
      ...(d.paypal.conversionRate != null
        ? { conversionRate: Number(d.paypal.conversionRate) }
        : {}),
    });
  }
}

/**
 * Apply stored AdminCP config onto live `config` object.
 */
export function applyAdminConfig(data = readFile()) {
  applyDonationsBlock(data);
  applyCurrencyBlock(data);

  if (data.server) {
    Object.assign(config.server, data.server);
  }

  if (data.features) {
    for (const key of FEATURE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(data.features, key)) {
        config.features[key] = Boolean(data.features[key]);
      }
    }
  }

  if (data.hash) {
    if (data.hash.method) config.hashMethod = String(data.hash.method).toLowerCase();
    if (data.hash.sha256Salt != null) config.sha256Salt = String(data.hash.sha256Salt);
  }

  if (data.registration) {
    const r = data.registration;
    if (r.defaultSnoNumb != null) config.registration.defaultSnoNumb = String(r.defaultSnoNumb);
    if (r.insertViCurrInfo != null) {
      config.registration.insertViCurrInfo = Boolean(r.insertViCurrInfo);
    }
    if (r.allowDuplicateEmails != null) {
      config.registration.allowDuplicateEmails = Boolean(r.allowDuplicateEmails);
    }
  }

  if (data.tools) {
    const t = data.tools;
    if (t.unstuckMap != null) config.tools.unstuckMap = asInt(t.unstuckMap, config.tools.unstuckMap);
    if (t.unstuckX != null) config.tools.unstuckX = asInt(t.unstuckX, config.tools.unstuckX);
    if (t.unstuckY != null) config.tools.unstuckY = asInt(t.unstuckY, config.tools.unstuckY);
    if (t.clearPkLevel != null) {
      config.tools.clearPkLevel = asInt(t.clearPkLevel, config.tools.clearPkLevel);
    }
  }

  if (data.adminUsernames != null) {
    const list = Array.isArray(data.adminUsernames)
      ? data.adminUsernames
      : String(data.adminUsernames)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    config.adminUsernames = list.map((s) => String(s).toLowerCase());
  }

  if (data.auth) {
    const a = data.auth;
    if (a.jwtExpiresIn) config.auth.jwtExpiresIn = String(a.jwtExpiresIn);
    if (a.jwtSecret) config.auth.jwtSecret = String(a.jwtSecret);
    if (a.cookieName) config.auth.cookieName = String(a.cookieName);
    if (a.cookieSecure != null) config.auth.cookieSecure = Boolean(a.cookieSecure);
    if (a.cookieSameSite) config.auth.cookieSameSite = String(a.cookieSameSite);
  }

  if (data.api) {
    if (data.api.corsOrigin != null) config.api.corsOrigin = String(data.api.corsOrigin);
    if (data.api.trustProxy != null) config.api.trustProxy = asInt(data.api.trustProxy, 1);
  }

  if (data.rateLimit) {
    const rl = data.rateLimit;
    if (rl.windowMs != null) config.rateLimit.windowMs = asInt(rl.windowMs, config.rateLimit.windowMs);
    if (rl.max != null) config.rateLimit.max = asInt(rl.max, config.rateLimit.max);
    if (rl.authMax != null) config.rateLimit.authMax = asInt(rl.authMax, config.rateLimit.authMax);
    if (rl.registerMax != null) {
      config.rateLimit.registerMax = asInt(rl.registerMax, config.rateLimit.registerMax);
    }
  }

  if (data.muSchema) {
    const s = data.muSchema;
    if (s.accounts) Object.assign(config.mu.accounts, s.accounts);
    if (s.characters) Object.assign(config.mu.characters, s.characters);
    if (s.membStat) Object.assign(config.mu.membStat, s.membStat);
    if (s.guild) Object.assign(config.mu.guild, s.guild);
    if (s.guildMember) Object.assign(config.mu.guildMember, s.guildMember);
    if (s.vip) Object.assign(config.mu.vip, s.vip);
  }

  if (data.db) {
    const d = data.db;
    if (d.host != null) config.db.host = String(d.host);
    if (d.port != null) config.db.port = asInt(d.port, config.db.port);
    if (d.user != null) config.db.user = String(d.user);
    if (d.password) config.db.password = String(d.password);
    if (d.database != null) config.db.database = String(d.database);
    if (d.database2 != null) config.db.database2 = String(d.database2);
    if (d.encrypt != null) config.db.encrypt = Boolean(d.encrypt);
    if (d.trustServerCertificate != null) {
      config.db.trustServerCertificate = Boolean(d.trustServerCertificate);
    }
  }

  // Also apply cmsStore overrides (legacy path used by older saves)
  const store = readStore();
  const overrides = store.cmsSettings || {};
  if (overrides.server) Object.assign(config.server, overrides.server);
  if (overrides.features) {
    for (const key of FEATURE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(overrides.features, key)) {
        config.features[key] = Boolean(overrides.features[key]);
      }
    }
  }

  return data;
}

export function loadAdminConfigOnBoot() {
  applyAdminConfig();
}

/** @deprecated use loadAdminConfigOnBoot */
export function loadRuntimeSecretsOnBoot() {
  loadAdminConfigOnBoot();
}

/** @deprecated use applyAdminConfig */
export function applyRuntimeSecrets(data) {
  return applyAdminConfig(data);
}

function donationsPublicView() {
  const mp = config.donations.mercadopago;
  const st = config.donations.stripe;
  const pp = config.donations.paypal;
  return {
    publicBaseUrl: config.donations.publicBaseUrl,
    successUrl: config.donations.successUrl || '',
    cancelUrl: config.donations.cancelUrl || '',
    mockMode: Boolean(config.donations.mockMode),
    mercadopago: {
      enabled: Boolean(mp.enabled),
      accessToken: mask(mp.accessToken),
      webhookSecret: mask(mp.webhookSecret),
      description: mp.description || '',
    },
    stripe: {
      enabled: Boolean(st.enabled),
      secretKey: mask(st.secretKey),
      publishableKey: mask(st.publishableKey),
      webhookSecret: mask(st.webhookSecret),
      currency: st.currency || 'usd',
    },
    paypal: {
      enabled: Boolean(pp.enabled),
      sandbox: Boolean(pp.sandbox),
      email: pp.email || '',
      title: pp.title || '',
      currency: pp.currency || 'USD',
      returnUrl: pp.returnUrl || '',
      notifyUrl: pp.notifyUrl || '',
      conversionRate: pp.conversionRate || 100,
    },
  };
}

/** Safe view for Integrations tab — never returns raw secrets. */
export function getSecretsPublicView() {
  const stored = readFile();
  return {
    donations: donationsPublicView(),
    currency: {
      credits: currencyView('credits'),
      wcoinc: currencyView('wcoinc'),
      wcoinp: currencyView('wcoinp'),
      goblin: currencyView('goblin'),
    },
    storage: fs.existsSync(SECRETS_PATH) ? 'admin-secrets.json + .env' : 'env-only',
    note: 'Solo admins. Dejá vacíos los campos secretos para conservar el valor actual.',
    _hasStoredFile: Boolean(stored && Object.keys(stored).length),
  };
}

/**
 * Full AdminCP config view (masked secrets).
 */
export function getFullConfigView() {
  const secrets = getSecretsPublicView();
  return {
    hosting: {
      nodeEnv: config.nodeEnv,
      port: config.api.port,
      muDatabaseMode: config.muDatabaseMode,
      readOnly: true,
      note: 'NODE_ENV / PORT se definen en el hosting. No editables desde AdminCP.',
    },
    general: {
      server: {
        name: config.server.name,
        season: config.server.season,
        exp: config.server.exp,
        masterExp: config.server.masterExp,
        drop: config.server.drop,
        maxLevel: config.server.maxLevel,
        maxMasterLevel: config.server.maxMasterLevel,
        resetLevel: config.server.resetLevel,
        discordUrl: config.server.discordUrl || '',
        downloadUrl: config.server.downloadUrl || '',
        instagramUrl: config.server.instagramUrl || '',
        facebookUrl: config.server.facebookUrl || '',
      },
      corsOrigin: config.api.corsOrigin,
      trustProxy: config.api.trustProxy,
    },
    features: { ...config.features },
    auth: {
      hashMethod: config.hashMethod,
      sha256Salt: mask(config.sha256Salt),
      adminUsernames: config.adminUsernames.join(', '),
      jwtExpiresIn: config.auth.jwtExpiresIn,
      jwtSecret: mask(config.auth.jwtSecret),
      cookieName: config.auth.cookieName,
      cookieSecure: Boolean(config.auth.cookieSecure),
      cookieSameSite: config.auth.cookieSameSite,
      registration: {
        defaultSnoNumb: config.registration.defaultSnoNumb,
        insertViCurrInfo: Boolean(config.registration.insertViCurrInfo),
        allowDuplicateEmails: Boolean(config.registration.allowDuplicateEmails),
      },
    },
    tools: { ...config.tools },
    currencies: secrets.currency,
    donations: secrets.donations,
    rateLimit: { ...config.rateLimit },
    muSchema: {
      accounts: { ...config.mu.accounts },
      characters: { ...config.mu.characters },
      membStat: { ...config.mu.membStat },
      guild: { ...config.mu.guild },
      guildMember: { ...config.mu.guildMember },
      vip: { ...config.mu.vip },
    },
    db: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: mask(config.db.password),
      database: config.db.database,
      database2: config.db.database2 || '',
      encrypt: Boolean(config.db.encrypt),
      trustServerCertificate: Boolean(config.db.trustServerCertificate),
      warning:
        'Cambiar DB_* puede romper la app hasta reiniciar / reconectar pools. Usá con cuidado.',
    },
    storage: secrets.storage,
    notes: {
      secretsEmptyKeep: 'Campos secretos vacíos = conservar valor actual.',
      restartFor: ['CORS_ORIGIN (middleware)', 'rate limits (middleware)', 'DB pool reconnect'],
      liveApply: 'La mayoría de valores se aplican en caliente y se espejan a .env.',
    },
  };
}

function patchCurrencyEnv(envPatch, currency) {
  if (!currency) return;
  for (const key of CURRENCY_KEYS) {
    const c = currency[key];
    if (!c) continue;
    const map = CURRENCY_ENV[key];
    if (c.table != null) envPatch[map.table] = String(c.table);
    if (c.column != null) envPatch[map.column] = String(c.column);
    if (c.userColumn != null) envPatch[map.userColumn] = String(c.userColumn);
  }
}

function buildEnvPatchFromStored(next) {
  const envPatch = {};
  const d = next.donations || {};
  if (d.publicBaseUrl) envPatch.DONATIONS_PUBLIC_BASE_URL = d.publicBaseUrl;
  if (d.successUrl != null) envPatch.DONATIONS_SUCCESS_URL = d.successUrl;
  if (d.cancelUrl != null) envPatch.DONATIONS_CANCEL_URL = d.cancelUrl;
  if (d.mockMode != null) envPatch.DONATIONS_MOCK = d.mockMode ? 'true' : 'false';
  if (d.mercadopago?.enabled != null) envPatch.MP_ENABLED = d.mercadopago.enabled ? 'true' : 'false';
  if (d.mercadopago?.accessToken) envPatch.MP_ACCESS_TOKEN = d.mercadopago.accessToken;
  if (d.mercadopago?.webhookSecret) envPatch.MP_WEBHOOK_SECRET = d.mercadopago.webhookSecret;
  if (d.mercadopago?.description) envPatch.MP_DESCRIPTION = d.mercadopago.description;
  if (d.stripe?.enabled != null) envPatch.STRIPE_ENABLED = d.stripe.enabled ? 'true' : 'false';
  if (d.stripe?.secretKey) envPatch.STRIPE_SECRET_KEY = d.stripe.secretKey;
  if (d.stripe?.webhookSecret) envPatch.STRIPE_WEBHOOK_SECRET = d.stripe.webhookSecret;
  if (d.stripe?.publishableKey) envPatch.STRIPE_PUBLISHABLE_KEY = d.stripe.publishableKey;
  if (d.stripe?.currency) envPatch.STRIPE_CURRENCY = d.stripe.currency;
  if (d.paypal?.enabled != null) envPatch.PAYPAL_ENABLED = d.paypal.enabled ? 'true' : 'false';
  if (d.paypal?.sandbox != null) envPatch.PAYPAL_SANDBOX = d.paypal.sandbox ? 'true' : 'false';
  if (d.paypal?.email) envPatch.PAYPAL_EMAIL = d.paypal.email;
  if (d.paypal?.notifyUrl) envPatch.PAYPAL_NOTIFY_URL = d.paypal.notifyUrl;
  if (d.paypal?.returnUrl) envPatch.PAYPAL_RETURN_URL = d.paypal.returnUrl;
  if (d.paypal?.title) envPatch.PAYPAL_TITLE = d.paypal.title;
  if (d.paypal?.currency) envPatch.PAYPAL_CURRENCY = d.paypal.currency;
  if (d.paypal?.conversionRate != null) {
    envPatch.PAYPAL_CONVERSION_RATE = String(d.paypal.conversionRate);
  }

  patchCurrencyEnv(envPatch, next.currency);

  const srv = next.server || {};
  if (srv.name != null) envPatch.SERVER_NAME = String(srv.name);
  if (srv.season != null) envPatch.SERVER_SEASON = String(srv.season);
  if (srv.exp != null) envPatch.SERVER_EXP = String(srv.exp);
  if (srv.masterExp != null) envPatch.SERVER_MASTER_EXP = String(srv.masterExp);
  if (srv.drop != null) envPatch.SERVER_DROP = String(srv.drop);
  if (srv.maxLevel != null) envPatch.SERVER_MAX_LEVEL = String(srv.maxLevel);
  if (srv.maxMasterLevel != null) envPatch.SERVER_MAX_MASTER_LEVEL = String(srv.maxMasterLevel);
  if (srv.resetLevel != null) envPatch.RESET_LEVEL = String(srv.resetLevel);
  if (srv.discordUrl != null) envPatch.DISCORD_URL = String(srv.discordUrl);
  if (srv.downloadUrl != null) envPatch.DOWNLOAD_URL = String(srv.downloadUrl);
  if (srv.instagramUrl != null) envPatch.INSTAGRAM_URL = String(srv.instagramUrl);
  if (srv.facebookUrl != null) envPatch.FACEBOOK_URL = String(srv.facebookUrl);

  if (next.features) {
    for (const key of FEATURE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(next.features, key) && FEATURE_ENV[key]) {
        envPatch[FEATURE_ENV[key]] = next.features[key] ? 'true' : 'false';
      }
    }
  }

  if (next.hash?.method) envPatch.HASH_METHOD = String(next.hash.method).toLowerCase();
  if (next.hash?.sha256Salt != null) envPatch.SHA256_SALT = String(next.hash.sha256Salt);

  const reg = next.registration || {};
  if (reg.defaultSnoNumb != null) envPatch.DEFAULT_SNO_NUMB = String(reg.defaultSnoNumb);
  if (reg.insertViCurrInfo != null) {
    envPatch.INSERT_VI_CURR_INFO = reg.insertViCurrInfo ? 'true' : 'false';
  }
  if (reg.allowDuplicateEmails != null) {
    envPatch.ALLOW_DUPLICATE_EMAILS = reg.allowDuplicateEmails ? 'true' : 'false';
  }

  const tools = next.tools || {};
  if (tools.unstuckMap != null) envPatch.UNSTUCK_MAP = String(tools.unstuckMap);
  if (tools.unstuckX != null) envPatch.UNSTUCK_X = String(tools.unstuckX);
  if (tools.unstuckY != null) envPatch.UNSTUCK_Y = String(tools.unstuckY);
  if (tools.clearPkLevel != null) envPatch.CLEAR_PK_LEVEL = String(tools.clearPkLevel);

  if (next.adminUsernames != null) {
    const list = Array.isArray(next.adminUsernames)
      ? next.adminUsernames
      : String(next.adminUsernames)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    envPatch.ADMIN_USERNAMES = list.join(',');
  }

  const auth = next.auth || {};
  if (auth.jwtExpiresIn) envPatch.JWT_EXPIRES_IN = String(auth.jwtExpiresIn);
  if (auth.jwtSecret) envPatch.JWT_SECRET = String(auth.jwtSecret);
  if (auth.cookieName) envPatch.COOKIE_NAME = String(auth.cookieName);
  if (auth.cookieSecure != null) envPatch.COOKIE_SECURE = auth.cookieSecure ? 'true' : 'false';
  if (auth.cookieSameSite) envPatch.COOKIE_SAME_SITE = String(auth.cookieSameSite);

  if (next.api?.corsOrigin != null) envPatch.CORS_ORIGIN = String(next.api.corsOrigin);
  if (next.api?.trustProxy != null) envPatch.TRUST_PROXY = String(next.api.trustProxy);

  const rl = next.rateLimit || {};
  if (rl.windowMs != null) envPatch.RATE_LIMIT_WINDOW_MS = String(rl.windowMs);
  if (rl.max != null) envPatch.RATE_LIMIT_MAX = String(rl.max);
  if (rl.authMax != null) envPatch.AUTH_RATE_LIMIT_MAX = String(rl.authMax);
  if (rl.registerMax != null) envPatch.REGISTER_RATE_LIMIT_MAX = String(rl.registerMax);

  const schema = next.muSchema || {};
  const acc = schema.accounts || {};
  if (acc.table != null) envPatch.MU_TABLE_ACCOUNTS = acc.table;
  if (acc.username != null) envPatch.MU_COL_USERNAME = acc.username;
  if (acc.password != null) envPatch.MU_COL_PASSWORD = acc.password;
  if (acc.email != null) envPatch.MU_COL_EMAIL = acc.email;
  if (acc.bloc != null) envPatch.MU_COL_BLOC = acc.bloc;
  if (acc.guid != null) envPatch.MU_COL_GUID = acc.guid;

  const ch = schema.characters || {};
  if (ch.table != null) envPatch.MU_TABLE_CHARACTERS = ch.table;
  if (ch.name != null) envPatch.MU_COL_CHAR_NAME = ch.name;
  if (ch.account != null) envPatch.MU_COL_CHAR_ACCOUNT = ch.account;
  if (ch.class != null) envPatch.MU_COL_CHAR_CLASS = ch.class;
  if (ch.level != null) envPatch.MU_COL_CHAR_LEVEL = ch.level;
  if (ch.resets != null) envPatch.MU_COL_CHAR_RESETS = ch.resets;
  if (ch.grandResets != null) envPatch.MU_COL_CHAR_GRAND_RESETS = ch.grandResets;
  if (ch.masterLevel != null) envPatch.MU_COL_CHAR_MASTER_LEVEL = ch.masterLevel;
  if (ch.pkLevel != null) envPatch.MU_COL_CHAR_PK_LEVEL = ch.pkLevel;
  if (ch.pkCount != null) envPatch.MU_COL_CHAR_PK_COUNT = ch.pkCount;
  if (ch.map != null) envPatch.MU_COL_CHAR_MAP = ch.map;
  if (ch.posX != null) envPatch.MU_COL_CHAR_POS_X = ch.posX;
  if (ch.posY != null) envPatch.MU_COL_CHAR_POS_Y = ch.posY;

  const ms = schema.membStat || {};
  if (ms.table != null) envPatch.MU_TABLE_MEMB_STAT = ms.table;
  if (ms.connectStat != null) envPatch.MU_COL_CONNECT_STAT = ms.connectStat;

  const g = schema.guild || {};
  if (g.table != null) envPatch.MU_TABLE_GUILD = g.table;
  const gm = schema.guildMember || {};
  if (gm.table != null) envPatch.MU_TABLE_GUILD_MEMBER = gm.table;

  const vip = schema.vip || {};
  if (vip.table != null) envPatch.VIP_TABLE = vip.table;
  if (vip.userColumn != null) envPatch.VIP_USER_COLUMN = vip.userColumn;
  if (vip.typeColumn != null) envPatch.VIP_TYPE_COLUMN = vip.typeColumn;
  if (vip.dateColumn != null) envPatch.VIP_DATE_COLUMN = vip.dateColumn;

  const db = next.db || {};
  if (db.host != null) envPatch.DB_HOST = String(db.host);
  if (db.port != null) envPatch.DB_PORT = String(db.port);
  if (db.user != null) envPatch.DB_USER = String(db.user);
  if (db.password) envPatch.DB_PASSWORD = String(db.password);
  if (db.database != null) envPatch.DB_DATABASE = String(db.database);
  if (db.database2 != null) envPatch.DB_DATABASE_2 = String(db.database2);
  if (db.encrypt != null) envPatch.DB_ENCRYPT = db.encrypt ? 'true' : 'false';
  if (db.trustServerCertificate != null) {
    envPatch.DB_TRUST_CERT = db.trustServerCertificate ? 'true' : 'false';
  }

  return envPatch;
}

function mergeCurrencyPayload(next, incoming) {
  if (!incoming) return;
  next.currency = next.currency || {};
  for (const key of CURRENCY_KEYS) {
    if (!incoming[key]) continue;
    next.currency[key] = {
      ...(next.currency[key] || {}),
      ...incoming[key],
    };
  }
}

/**
 * Merge partial updates for Integrations (donations + currencies).
 * Empty secret strings mean "keep existing".
 */
export function saveRuntimeSecretsAndEnv(payload, adminUsername) {
  const current = readFile();
  const next = structuredClone(current);
  next.donations = next.donations || {};
  const dIn = payload.donations || {};

  if (dIn.publicBaseUrl != null) next.donations.publicBaseUrl = String(dIn.publicBaseUrl).trim();
  if (dIn.successUrl != null) next.donations.successUrl = String(dIn.successUrl).trim();
  if (dIn.cancelUrl != null) next.donations.cancelUrl = String(dIn.cancelUrl).trim();
  if (dIn.mockMode != null) next.donations.mockMode = Boolean(dIn.mockMode);

  mergeProvider(next, config.donations.mercadopago, 'mercadopago', dIn.mercadopago || {}, [
    'accessToken',
    'webhookSecret',
    'description',
  ]);
  mergeProvider(next, config.donations.stripe, 'stripe', dIn.stripe || {}, [
    'secretKey',
    'publishableKey',
    'webhookSecret',
    'currency',
  ]);
  mergeProvider(next, config.donations.paypal, 'paypal', dIn.paypal || {}, [
    'email',
    'title',
    'currency',
    'returnUrl',
    'notifyUrl',
    'conversionRate',
  ]);
  if (dIn.paypal?.sandbox != null) {
    next.donations.paypal = next.donations.paypal || {};
    next.donations.paypal.sandbox = Boolean(dIn.paypal.sandbox);
  }

  mergeCurrencyPayload(next, payload.currency);

  writeFile(next);
  applyAdminConfig(next);

  const envPatch = buildEnvPatchFromStored(next);
  if (Object.keys(envPatch).length) writeEnvFile(envPatch);

  appendAudit({
    action: 'admin.secrets.update',
    username: adminUsername,
    meta: { keys: Object.keys(envPatch) },
  });

  return getSecretsPublicView();
}

/**
 * Save full AdminCP config (any subset of sections).
 */
export function saveFullConfig(payload, adminUsername) {
  const current = readFile();
  const next = structuredClone(current);

  if (payload.general?.server || payload.server) {
    const srv = payload.general?.server || payload.server;
    next.server = { ...(next.server || {}), ...srv };
  }

  if (payload.general?.corsOrigin != null || payload.api?.corsOrigin != null) {
    next.api = next.api || {};
    next.api.corsOrigin = String(
      payload.general?.corsOrigin ?? payload.api.corsOrigin,
    ).trim();
  }
  if (payload.general?.trustProxy != null || payload.api?.trustProxy != null) {
    next.api = next.api || {};
    next.api.trustProxy = asInt(
      payload.general?.trustProxy ?? payload.api.trustProxy,
      config.api.trustProxy,
    );
  }

  if (payload.features) {
    next.features = { ...(next.features || {}), ...payload.features };
  }

  if (payload.auth) {
    const a = payload.auth;
    next.auth = next.auth || {};
    next.hash = next.hash || {};
    next.registration = next.registration || {};

    if (a.hashMethod != null) next.hash.method = String(a.hashMethod).toLowerCase();
    mergeSecretField(next.hash, 'sha256Salt', a.sha256Salt, config.sha256Salt);

    if (a.adminUsernames != null) {
      next.adminUsernames = String(a.adminUsernames)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (a.jwtExpiresIn != null) next.auth.jwtExpiresIn = String(a.jwtExpiresIn).trim();
    mergeSecretField(next.auth, 'jwtSecret', a.jwtSecret, config.auth.jwtSecret);
    if (a.cookieName != null) next.auth.cookieName = String(a.cookieName).trim();
    if (a.cookieSecure != null) next.auth.cookieSecure = asBool(a.cookieSecure, false);
    if (a.cookieSameSite != null) next.auth.cookieSameSite = String(a.cookieSameSite).trim();

    if (a.registration) {
      const r = a.registration;
      if (r.defaultSnoNumb != null) next.registration.defaultSnoNumb = String(r.defaultSnoNumb);
      if (r.insertViCurrInfo != null) {
        next.registration.insertViCurrInfo = Boolean(r.insertViCurrInfo);
      }
      if (r.allowDuplicateEmails != null) {
        next.registration.allowDuplicateEmails = Boolean(r.allowDuplicateEmails);
      }
    }
  }

  if (payload.hash) {
    next.hash = next.hash || {};
    if (payload.hash.method != null) next.hash.method = String(payload.hash.method).toLowerCase();
    mergeSecretField(next.hash, 'sha256Salt', payload.hash.sha256Salt, config.sha256Salt);
  }

  if (payload.registration) {
    next.registration = { ...(next.registration || {}), ...payload.registration };
  }

  if (payload.tools) {
    next.tools = { ...(next.tools || {}), ...payload.tools };
  }

  if (payload.currencies || payload.currency) {
    mergeCurrencyPayload(next, payload.currencies || payload.currency);
  }

  if (payload.donations) {
    // Reuse secrets merge path for donations block
    const temp = { donations: next.donations || {} };
    const dIn = payload.donations;
    if (dIn.publicBaseUrl != null) temp.donations.publicBaseUrl = String(dIn.publicBaseUrl).trim();
    if (dIn.successUrl != null) temp.donations.successUrl = String(dIn.successUrl).trim();
    if (dIn.cancelUrl != null) temp.donations.cancelUrl = String(dIn.cancelUrl).trim();
    if (dIn.mockMode != null) temp.donations.mockMode = Boolean(dIn.mockMode);
    mergeProvider(temp, config.donations.mercadopago, 'mercadopago', dIn.mercadopago || {}, [
      'accessToken',
      'webhookSecret',
      'description',
    ]);
    mergeProvider(temp, config.donations.stripe, 'stripe', dIn.stripe || {}, [
      'secretKey',
      'publishableKey',
      'webhookSecret',
      'currency',
    ]);
    mergeProvider(temp, config.donations.paypal, 'paypal', dIn.paypal || {}, [
      'email',
      'title',
      'currency',
      'returnUrl',
      'notifyUrl',
      'conversionRate',
    ]);
    if (dIn.paypal?.sandbox != null) {
      temp.donations.paypal = temp.donations.paypal || {};
      temp.donations.paypal.sandbox = Boolean(dIn.paypal.sandbox);
    }
    next.donations = temp.donations;
  }

  if (payload.rateLimit) {
    next.rateLimit = { ...(next.rateLimit || {}), ...payload.rateLimit };
  }

  if (payload.muSchema) {
    next.muSchema = next.muSchema || {};
    for (const section of ['accounts', 'characters', 'membStat', 'guild', 'guildMember', 'vip']) {
      if (payload.muSchema[section]) {
        next.muSchema[section] = {
          ...(next.muSchema[section] || {}),
          ...payload.muSchema[section],
        };
      }
    }
  }

  if (payload.db) {
    next.db = next.db || {};
    const dbIn = payload.db;
    if (dbIn.host != null) next.db.host = String(dbIn.host).trim();
    if (dbIn.port != null) next.db.port = asInt(dbIn.port, config.db.port);
    if (dbIn.user != null) next.db.user = String(dbIn.user).trim();
    mergeSecretField(next.db, 'password', dbIn.password, config.db.password);
    if (dbIn.database != null) next.db.database = String(dbIn.database).trim();
    if (dbIn.database2 != null) next.db.database2 = String(dbIn.database2).trim();
    if (dbIn.encrypt != null) next.db.encrypt = Boolean(dbIn.encrypt);
    if (dbIn.trustServerCertificate != null) {
      next.db.trustServerCertificate = Boolean(dbIn.trustServerCertificate);
    }
  }

  if (payload.adminUsernames != null) {
    next.adminUsernames = Array.isArray(payload.adminUsernames)
      ? payload.adminUsernames
      : String(payload.adminUsernames)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
  }

  writeFile(next);
  applyAdminConfig(next);

  // Keep cmsStore in sync for legacy getCmsSettings
  if (next.server || next.features) {
    updateStore((s) => {
      s.cmsSettings = s.cmsSettings || { server: {}, features: {} };
      if (next.server) s.cmsSettings.server = { ...s.cmsSettings.server, ...next.server };
      if (next.features) s.cmsSettings.features = { ...s.cmsSettings.features, ...next.features };
      return s;
    });
  }

  const envPatch = buildEnvPatchFromStored(next);
  if (Object.keys(envPatch).length) writeEnvFile(envPatch);

  appendAudit({
    action: 'admin.config.full_update',
    username: adminUsername,
    meta: {
      sections: Object.keys(payload).filter((k) => payload[k] != null),
      envKeys: Object.keys(envPatch),
    },
  });

  return getFullConfigView();
}
