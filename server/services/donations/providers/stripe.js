import crypto from 'node:crypto';
import { config } from '../../../config/index.js';
import { AppError } from '../../../utils/errors.js';

function cfg() {
  return config.donations.stripe;
}

export function isConfigured() {
  return Boolean(cfg().secretKey);
}

function formEncode(data, prefix = '') {
  const parts = [];
  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      parts.push(formEncode(value, fullKey));
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item !== null && typeof item === 'object') {
          parts.push(formEncode(item, `${fullKey}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (value !== undefined && value !== null) {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.join('&');
}

async function stripeRequest(method, endpoint, data) {
  if (!isConfigured()) {
    throw new AppError('Stripe is not configured.', {
      status: 503,
      code: 'PROVIDER_NOT_CONFIGURED',
    });
  }

  const url = new URL(`https://api.stripe.com/v1/${endpoint}`);
  const headers = {
    Authorization: `Bearer ${cfg().secretKey}`,
  };

  const init = { method, headers };
  if (method === 'POST') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    init.body = formEncode(data);
  } else if (data) {
    for (const [k, v] of Object.entries(data)) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AppError(json?.error?.message || 'Stripe API error.', {
      status: 502,
      code: 'STRIPE_API_ERROR',
      details: json?.error,
    });
  }
  return json;
}

export async function createCheckoutSession({ username, pack, transactionId, successUrl, cancelUrl }) {
  const session = await stripeRequest('POST', 'checkout/sessions', {
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: String(pack.fiatCurrency || cfg().currency || 'usd').toLowerCase(),
          unit_amount: Math.round(Number(pack.price) * 100),
          product_data: {
            name: pack.title,
            description: pack.description || '',
          },
        },
      },
    ],
    metadata: {
      transaction_id: transactionId,
      username,
      package_id: pack.id,
      amount: String(pack.creditAmount),
      type: 'COINS',
      credit_currency: pack.creditCurrency,
      configId: pack.creditCurrency,
    },
  });

  return {
    provider: 'stripe',
    checkoutUrl: session.url,
    externalId: session.id,
    raw: { id: session.id },
  };
}

export function verifyWebhookSignature(rawBody, signatureHeader, toleranceSec = 300) {
  const secret = cfg().webhookSecret;
  if (!secret || !signatureHeader) return false;

  const parts = {};
  const signatures = [];
  for (const piece of String(signatureHeader).split(',')) {
    const [k, v] = piece.split('=');
    if (k === 't') parts.t = v;
    if (k === 'v1') signatures.push(v);
  }
  if (!parts.t || !signatures.length) return false;

  const ts = Number(parts.t);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;

  const payload = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${parts.t}.${payload}`)
    .digest('hex');

  return signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
    } catch {
      return false;
    }
  });
}
