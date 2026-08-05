import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/index.js';
import { writeEnvFile } from '../install/state.js';
import { appendAudit } from '../data/cmsStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SECRETS_PATH = path.join(__dirname, '../data/admin-secrets.json');

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

/**
 * Apply stored AdminCP secrets onto live config (env remains the base).
 */
export function applyRuntimeSecrets(data = readFile()) {
  if (data.donations) {
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

  if (data.currency?.wcoinc) {
    const w = data.currency.wcoinc;
    config.mu.currencies.wcoinc = {
      ...config.mu.currencies.wcoinc,
      ...(w.table != null ? { table: w.table } : {}),
      ...(w.column != null ? { column: w.column } : {}),
      ...(w.userColumn != null ? { userColumn: w.userColumn } : {}),
    };
  }

  return data;
}

export function loadRuntimeSecretsOnBoot() {
  applyRuntimeSecrets();
}

/** Safe view for AdminCP — never returns raw secrets. */
export function getSecretsPublicView() {
  const stored = readFile();
  const mp = config.donations.mercadopago;
  const st = config.donations.stripe;
  const pp = config.donations.paypal;
  const w = config.mu.currencies.wcoinc;

  return {
    donations: {
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
    },
    currency: {
      wcoinc: {
        table: w.table || '',
        column: w.column || 'WCoinC',
        userColumn: w.userColumn || 'AccountID',
      },
    },
    storage: fs.existsSync(SECRETS_PATH) ? 'admin-secrets.json + .env' : 'env-only',
    note: 'Solo admins. Dejá vacíos los campos secretos para conservar el valor actual.',
    _hasStoredFile: Boolean(stored && Object.keys(stored).length),
  };
}

function mergeProvider(next, live, key, incoming, fields) {
  next.donations[key] = next.donations[key] || {};
  const target = next.donations[key];
  for (const f of fields) {
    if (incoming[f] === undefined) continue;
    const val = incoming[f];
    if (typeof val === 'boolean' || typeof val === 'number') {
      target[f] = val;
      continue;
    }
    const str = String(val ?? '').trim();
    if (str === '') {
      if (target[f] == null && live[f]) target[f] = live[f];
      continue;
    }
    target[f] = str;
  }
  if (incoming.enabled != null) target.enabled = Boolean(incoming.enabled);
}

/**
 * Merge partial updates. Empty secret strings mean "keep existing".
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

  if (payload.currency?.wcoinc) {
    next.currency = next.currency || {};
    next.currency.wcoinc = {
      ...(next.currency.wcoinc || {}),
      ...payload.currency.wcoinc,
    };
  }

  writeFile(next);
  applyRuntimeSecrets(next);

  const envPatch = {};
  const d = next.donations || {};
  if (d.publicBaseUrl) envPatch.DONATIONS_PUBLIC_BASE_URL = d.publicBaseUrl;
  if (d.mockMode != null) envPatch.DONATIONS_MOCK = d.mockMode ? 'true' : 'false';
  if (d.mercadopago?.accessToken) envPatch.MP_ACCESS_TOKEN = d.mercadopago.accessToken;
  if (d.mercadopago?.webhookSecret) envPatch.MP_WEBHOOK_SECRET = d.mercadopago.webhookSecret;
  if (d.stripe?.secretKey) envPatch.STRIPE_SECRET_KEY = d.stripe.secretKey;
  if (d.stripe?.webhookSecret) envPatch.STRIPE_WEBHOOK_SECRET = d.stripe.webhookSecret;
  if (d.stripe?.publishableKey) envPatch.STRIPE_PUBLISHABLE_KEY = d.stripe.publishableKey;
  if (d.paypal?.email) envPatch.PAYPAL_EMAIL = d.paypal.email;
  if (d.paypal?.notifyUrl) envPatch.PAYPAL_NOTIFY_URL = d.paypal.notifyUrl;
  if (d.paypal?.returnUrl) envPatch.PAYPAL_RETURN_URL = d.paypal.returnUrl;
  const w = next.currency?.wcoinc;
  if (w?.table) envPatch.CURRENCY_WCOINC_TABLE = w.table;
  if (w?.column) envPatch.CURRENCY_WCOINC_COLUMN = w.column;
  if (w?.userColumn) envPatch.CURRENCY_WCOINC_USER_COLUMN = w.userColumn;

  if (Object.keys(envPatch).length) writeEnvFile(envPatch);

  appendAudit({
    action: 'admin.secrets.update',
    username: adminUsername,
    meta: { keys: Object.keys(envPatch) },
  });

  return getSecretsPublicView();
}
