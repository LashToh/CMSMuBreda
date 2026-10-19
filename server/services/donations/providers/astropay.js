import crypto from 'node:crypto';
import { config } from '../../../config/index.js';
import { AppError } from '../../../utils/errors.js';

function cfg() {
  return config.donations.astropay;
}

export function isConfigured() {
  return Boolean(cfg().apiKey && cfg().apiSecret);
}

function baseUrl() {
  return cfg().sandbox
    ? 'https://onetouch-api-sandbox.astropay.com'
    : 'https://onetouch-api.astropay.com';
}

function countryForPack(pack) {
  const fromCfg = String(cfg().country || '').trim().toUpperCase();
  if (fromCfg && /^[A-Z]{2}$/.test(fromCfg)) return fromCfg;
  const fiat = String(pack.fiatCurrency || '').toUpperCase();
  const map = {
    ARS: 'AR',
    BRL: 'BR',
    MXN: 'MX',
    CLP: 'CL',
    COP: 'CO',
    PEN: 'PE',
    UYU: 'UY',
    USD: 'US',
    EUR: 'ES',
  };
  return map[fiat] || 'AR';
}

function signBody(rawBody) {
  return crypto.createHmac('sha256', cfg().apiSecret).update(rawBody, 'utf8').digest('hex');
}

/**
 * Offsite Checkout deposit — redirect user to AstroPay hosted URL.
 * Docs: OneTouch merchant deposit + Signature HMAC-SHA256(body, apiSecret).
 */
export async function createDeposit({
  username,
  pack,
  transactionId,
  callbackUrl,
  redirectUrl,
  cancelUrl,
}) {
  if (!isConfigured()) {
    throw new AppError('AstroPay is not configured.', {
      status: 503,
      code: 'PROVIDER_NOT_CONFIGURED',
    });
  }

  const currency = String(
    pack.fiatCurrency || cfg().currency || 'USD',
  )
    .trim()
    .toUpperCase();

  const body = {
    amount: Number(pack.price),
    currency,
    country: countryForPack(pack),
    merchant_deposit_id: String(transactionId),
    callback_url: callbackUrl,
    redirect_url: redirectUrl,
    cancel_url: cancelUrl || redirectUrl,
    user: {
      merchant_user_id: String(username).slice(0, 64),
    },
    // Useful for merchant panel / support
    product: {
      mcc: '7994',
      merchant_code: 'mubreda',
      description: pack.title || 'MU Breda donation',
    },
  };

  const rawBody = JSON.stringify(body);
  const res = await fetch(`${baseUrl()}/merchant/v1/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Merchant-Gateway-Api-Key': cfg().apiKey,
      Signature: signBody(rawBody),
    },
    body: rawBody,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AppError(data?.error?.message || data?.message || 'AstroPay deposit failed.', {
      status: 502,
      code: 'ASTROPAY_API_ERROR',
      details: data,
    });
  }

  const checkoutUrl = data.url || data.redirect_url || data.fallback_url;
  if (!checkoutUrl) {
    throw new AppError('AstroPay did not return a checkout URL.', {
      status: 502,
      code: 'ASTROPAY_API_ERROR',
      details: data,
    });
  }

  return {
    provider: 'astropay',
    checkoutUrl,
    externalId: data.deposit_external_id || data.merchant_deposit_id || transactionId,
    raw: {
      merchant_deposit_id: data.merchant_deposit_id,
      deposit_external_id: data.deposit_external_id,
      status: data.status,
    },
  };
}

/**
 * Verify AstroPay callback Signature header = HMAC-SHA256(rawBody, apiSecret).
 */
export function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = cfg().apiSecret;
  if (!secret || !signatureHeader) return false;

  const payload = Buffer.isBuffer(rawBody)
    ? rawBody.toString('utf8')
    : typeof rawBody === 'string'
      ? rawBody
      : JSON.stringify(rawBody ?? {});

  const expected = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  const provided = String(signatureHeader).trim().toLowerCase().replace(/^sha256=/i, '');

  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
