import crypto from 'node:crypto';
import { config } from '../../../config/index.js';
import { AppError } from '../../../utils/errors.js';

function cfg() {
  return config.donations.mercadopago;
}

export function isConfigured() {
  return Boolean(cfg().accessToken);
}

export async function createPreference({ username, pack, transactionId, notificationUrl, returnUrl }) {
  if (!isConfigured()) {
    throw new AppError('Mercado Pago is not configured.', {
      status: 503,
      code: 'PROVIDER_NOT_CONFIGURED',
    });
  }

  // Encode fulfillment metadata in item title (WebEngine-compatible): username|amount|COINS|currencyKey
  const title = `${username}|${pack.creditAmount}|COINS|${pack.creditCurrency}`;
  const body = {
    items: [
      {
        id: pack.id,
        title,
        description: pack.description || config.donations.mercadopago.description,
        quantity: 1,
        unit_price: Number(pack.price),
        currency_id: pack.fiatCurrency || 'ARS',
      },
    ],
    external_reference: transactionId,
    back_urls: {
      success: returnUrl,
      failure: returnUrl,
      pending: returnUrl,
    },
    auto_return: 'approved',
    notification_url: notificationUrl,
    metadata: {
      transaction_id: transactionId,
      username,
      package_id: pack.id,
      credit_currency: pack.creditCurrency,
      credit_amount: String(pack.creditAmount),
    },
  };

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg().accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AppError(data.message || 'Mercado Pago preference failed.', {
      status: 502,
      code: 'MP_API_ERROR',
      details: data,
    });
  }

  return {
    provider: 'mercadopago',
    checkoutUrl: data.init_point || data.sandbox_init_point,
    externalId: data.id,
    raw: { id: data.id },
  };
}

/**
 * Verify X-Signature webhook header (HMAC-SHA256).
 * Manifest: id:{dataId};request-id:{x-request-id};ts:{ts}
 */
export function verifyWebhookSignature({ rawBody, signatureHeader, requestId, dataId }) {
  const secret = cfg().webhookSecret;
  if (!secret) {
    // Secret optional in WebEngine; require in production for CMS
    if (config.isProduction) return false;
    return true;
  }
  if (!signatureHeader) return false;

  const parts = {};
  for (const part of String(signatureHeader).split(',')) {
    const [k, v] = part.split('=').map((s) => s.trim());
    if (k) parts[k] = v;
  }
  const ts = parts.ts || '';
  const v1 = parts.v1 || '';
  if (!ts || !v1) return false;

  const id = dataId || '';
  const manifest = `id:${id};request-id:${requestId || ''};ts:${ts}`;
  const computed = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(v1));
  } catch {
    return false;
  }
}

export async function fetchPayment(paymentId) {
  if (!isConfigured()) {
    throw new AppError('Mercado Pago is not configured.', {
      status: 503,
      code: 'PROVIDER_NOT_CONFIGURED',
    });
  }
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${cfg().accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AppError(data.message || 'Mercado Pago payment fetch failed.', {
      status: 502,
      code: 'MP_API_ERROR',
    });
  }
  return data;
}
