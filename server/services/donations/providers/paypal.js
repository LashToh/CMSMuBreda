import { config } from '../../../config/index.js';
import { AppError } from '../../../utils/errors.js';

function cfg() {
  return config.donations.paypal;
}

export function isConfigured() {
  return Boolean(cfg().email);
}

/**
 * Classic PayPal HTML button / redirect fields (IPN notify_url).
 * Mirrors WebEngine donation/paypal.php + api/paypal.php flow.
 */
export function buildCheckoutForm({ username, pack, transactionId }) {
  if (!isConfigured()) {
    throw new AppError('PayPal is not configured.', {
      status: 503,
      code: 'PROVIDER_NOT_CONFIGURED',
    });
  }

  const action = cfg().sandbox
    ? 'https://www.sandbox.paypal.com/cgi-bin/webscr'
    : 'https://www.paypal.com/cgi-bin/webscr';

  const fields = {
    cmd: '_xclick',
    business: cfg().email,
    item_name: pack.title || cfg().title,
    item_number: transactionId,
    amount: Number(pack.price).toFixed(2),
    currency_code: pack.fiatCurrency || cfg().currency || 'USD',
    no_shipping: '1',
    shipping: '0.00',
    tax: '0.00',
    no_note: '1',
    return: cfg().returnUrl,
    cancel_return: cfg().returnUrl,
    notify_url: cfg().notifyUrl,
    custom: username,
  };

  return {
    provider: 'paypal',
    mode: 'form_post',
    action,
    fields,
    externalId: transactionId,
  };
}

/**
 * Verify IPN by posting back to PayPal with cmd=_notify-validate.
 */
export async function verifyIpn(payload) {
  const body = new URLSearchParams({ cmd: '_notify-validate', ...payload }).toString();
  const url = cfg().sandbox
    ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
    : 'https://ipnpb.paypal.com/cgi-bin/webscr';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = (await res.text()).trim();
  return text === 'VERIFIED';
}
