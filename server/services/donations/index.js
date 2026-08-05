import { config } from '../../config/index.js';
import { AppError } from '../../utils/errors.js';
import { getDonationStore } from './transactions.js';
import { createPendingTransaction, listTransactionsForUser, updateTransaction } from './transactions.js';
import { getPackage, listPackages } from './packages.js';
import { fulfillDonation } from './fulfill.js';
import * as mercadopago from './providers/mercadopago.js';
import * as stripe from './providers/stripe.js';
import * as paypal from './providers/paypal.js';

export function donationsEnabled() {
  return Boolean(config.features.donations);
}

export function mockModeEnabled() {
  return Boolean(config.donations.mockMode) || config.isMock;
}

const REAL_PROVIDERS = ['mercadopago', 'stripe', 'paypal'];

function providerReason(id, { featureEnabled, configured }) {
  if (id === 'mock') {
    return mockModeEnabled() ? null : 'mock_disabled';
  }
  if (!featureEnabled) return 'disabled';
  if (!configured) return 'not_configured';
  return null;
}

export function listProvidersStatus() {
  const mpConfigured = mercadopago.isConfigured();
  const stripeConfigured = stripe.isConfigured();
  const paypalConfigured = paypal.isConfigured();
  const mpFeature = Boolean(config.donations.mercadopago.enabled);
  const stripeFeature = Boolean(config.donations.stripe.enabled);
  const paypalFeature = Boolean(config.donations.paypal.enabled);
  const mockOn = mockModeEnabled();

  return {
    mercadopago: {
      enabled: mpFeature && mpConfigured,
      configured: mpConfigured,
      reason: providerReason('mercadopago', { featureEnabled: mpFeature, configured: mpConfigured }),
    },
    stripe: {
      enabled: stripeFeature && stripeConfigured,
      configured: stripeConfigured,
      reason: providerReason('stripe', { featureEnabled: stripeFeature, configured: stripeConfigured }),
    },
    paypal: {
      enabled: paypalFeature && paypalConfigured,
      configured: paypalConfigured,
      reason: providerReason('paypal', { featureEnabled: paypalFeature, configured: paypalConfigured }),
    },
    mock: {
      enabled: mockOn,
      configured: true,
      reason: providerReason('mock', { featureEnabled: mockOn, configured: true }),
    },
  };
}

function providerAvailable(provider) {
  const status = listProvidersStatus();
  if (provider === 'mock') return status.mock.enabled;
  return Boolean(status[provider]?.enabled);
}

/**
 * Public package list: always expose MP / Stripe / PayPal (+ mock in mock mode)
 * with per-provider enabled flag so the CMS can show disabled buttons + reasons.
 */
export function listPublicPackages() {
  const store = getDonationStore();
  const status = listProvidersStatus();
  const visibleIds = [...REAL_PROVIDERS, ...(mockModeEnabled() ? ['mock'] : [])];

  return listPackages(store.donationPackages).map((p) => {
    const packSet = new Set((p.providers || []).map((x) => String(x).toLowerCase()));

    return {
      id: p.id,
      title: p.title,
      description: p.description,
      fiatCurrency: p.fiatCurrency,
      price: p.price,
      creditCurrency: p.creditCurrency,
      creditAmount: p.creditAmount,
      order: p.order,
      providers: visibleIds.map((id) => {
        const supported = packSet.size === 0 || packSet.has(id);
        const base = status[id] || { enabled: false, configured: false, reason: 'disabled' };
        const enabled = supported && Boolean(base.enabled);
        let reason = null;
        if (!supported) reason = 'not_supported';
        else if (!base.enabled) reason = base.reason || 'not_configured';
        return {
          id,
          enabled,
          configured: Boolean(base.configured),
          reason,
        };
      }),
    };
  });
}

function publicBaseUrl() {
  return config.donations.publicBaseUrl.replace(/\/$/, '');
}

export async function startCheckout(username, { packageId, provider }) {
  if (!donationsEnabled()) {
    throw new AppError('Donations are disabled.', { status: 503, code: 'FEATURE_DISABLED' });
  }

  const store = getDonationStore();
  const pack = getPackage(packageId, store.donationPackages);
  if (!pack) {
    throw new AppError('Package not found.', { status: 404, code: 'NOT_FOUND' });
  }

  const selected = String(provider || '').toLowerCase();
  if (!pack.providers?.includes(selected)) {
    throw new AppError('Provider not available for this package.', {
      status: 400,
      code: 'INVALID_PROVIDER',
    });
  }
  if (!providerAvailable(selected)) {
    throw new AppError('Payment provider is not configured.', {
      status: 503,
      code: 'PROVIDER_NOT_CONFIGURED',
    });
  }

  const tx = createPendingTransaction({
    username,
    packageId: pack.id,
    provider: selected,
    fiatCurrency: pack.fiatCurrency,
    fiatAmount: pack.price,
    creditCurrency: pack.creditCurrency,
    creditAmount: pack.creditAmount,
  });

  const returnUrl = config.donations.successUrl || `${publicBaseUrl()}/donate?status=success`;
  const cancelUrl = config.donations.cancelUrl || `${publicBaseUrl()}/donate?status=cancel`;
  const notifyBase = `${publicBaseUrl()}/api/donations/webhooks`;

  if (selected === 'mock') {
    return {
      mode: 'mock',
      transactionId: tx.id,
      message: 'Mock checkout ready. Call /api/donations/mock/complete to credit WCoinC.',
    };
  }

  if (selected === 'mercadopago') {
    const result = await mercadopago.createPreference({
      username,
      pack,
      transactionId: tx.id,
      notificationUrl: `${notifyBase}/mercadopago`,
      returnUrl,
    });
    updateTransaction(tx.id, { externalId: result.externalId });
    return {
      mode: 'redirect',
      transactionId: tx.id,
      checkoutUrl: result.checkoutUrl,
      provider: 'mercadopago',
    };
  }

  if (selected === 'stripe') {
    const result = await stripe.createCheckoutSession({
      username,
      pack,
      transactionId: tx.id,
      successUrl: returnUrl.includes('?') ? `${returnUrl}&session_id={CHECKOUT_SESSION_ID}` : `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl,
    });
    updateTransaction(tx.id, { externalId: result.externalId });
    return {
      mode: 'redirect',
      transactionId: tx.id,
      checkoutUrl: result.checkoutUrl,
      provider: 'stripe',
    };
  }

  if (selected === 'paypal') {
    const result = paypal.buildCheckoutForm({ username, pack, transactionId: tx.id });
    return {
      mode: 'form_post',
      transactionId: tx.id,
      provider: 'paypal',
      action: result.action,
      fields: result.fields,
    };
  }

  throw new AppError('Unknown provider.', { status: 400, code: 'INVALID_PROVIDER' });
}

export async function completeMockDonation(username, transactionId) {
  if (!donationsEnabled()) {
    throw new AppError('Donations are disabled.', { status: 503, code: 'FEATURE_DISABLED' });
  }
  if (!mockModeEnabled()) {
    throw new AppError('Mock donations are disabled.', { status: 403, code: 'FORBIDDEN' });
  }

  const { findTransactionById } = await import('./transactions.js');
  const tx = findTransactionById(transactionId);
  if (!tx || tx.username.toLowerCase() !== username.toLowerCase()) {
    throw new AppError('Transaction not found.', { status: 404, code: 'NOT_FOUND' });
  }
  if (tx.provider !== 'mock') {
    throw new AppError('Not a mock transaction.', { status: 400, code: 'INVALID_PROVIDER' });
  }

  const result = await fulfillDonation({
    transactionId: tx.id,
    externalId: `mock_${tx.id}`,
    provider: 'mock',
    username: tx.username,
    creditCurrency: tx.creditCurrency,
    creditAmount: tx.creditAmount,
    meta: { mock: true },
  });

  return {
    ...result,
    message: result.alreadyProcessed
      ? 'Donation already credited.'
      : `Credited ${tx.creditAmount} ${tx.creditCurrency.toUpperCase()}.`,
  };
}

export async function handleMercadoPagoWebhook({ rawBody, signatureHeader, requestId, query }) {
  if (!donationsEnabled() || !config.donations.mercadopago.enabled) {
    return { ignored: true };
  }

  let payload = {};
  try {
    if (Buffer.isBuffer(rawBody)) {
      const text = rawBody.toString('utf8').trim();
      payload = text ? JSON.parse(text) : {};
    } else if (typeof rawBody === 'string') {
      payload = rawBody.trim() ? JSON.parse(rawBody) : {};
    } else if (rawBody && typeof rawBody === 'object') {
      payload = rawBody;
    }
  } catch {
    payload = {};
  }

  const dataId = query?.['data.id'] || payload?.data?.id || '';
  const rawForSig = Buffer.isBuffer(rawBody)
    ? rawBody.toString('utf8')
    : typeof rawBody === 'string'
      ? rawBody
      : JSON.stringify(payload);

  const okSig = mercadopago.verifyWebhookSignature({
    rawBody: rawForSig,
    signatureHeader,
    requestId,
    dataId,
  });
  if (!okSig) {
    throw new AppError('Invalid Mercado Pago signature.', { status: 400, code: 'INVALID_SIGNATURE' });
  }

  const action = payload.action;
  const paymentId = payload?.data?.id || query?.id || dataId;
  if (!paymentId || (action && !['payment.created', 'payment.updated'].includes(action))) {
    // topic=payment without action still process if we have an id
    if (!paymentId) return { ignored: true };
  }

  if (action && !['payment.created', 'payment.updated'].includes(action) && !query?.topic) {
    return { ignored: true };
  }

  const payment = await mercadopago.fetchPayment(paymentId);
  const status = payment.status;
  const statusDetail = payment.status_detail;
  const externalRef = payment.external_reference;
  const description = payment.description || payment.additional_info?.items?.[0]?.title || '';
  const info = String(description).split('|');
  const username = (info[0] || payment.metadata?.username || '').replace(/[^a-zA-Z0-9_]/g, '');
  const creditAmount = Math.abs(Number(info[1] || payment.metadata?.credit_amount || 0));
  const type = info[2] || payment.metadata?.type || 'COINS';
  const creditCurrency = info[3] || payment.metadata?.credit_currency || 'wcoinc';

  if (status !== 'approved' || statusDetail !== 'accredited') {
    return { ignored: true, status, statusDetail };
  }
  if (type !== 'COINS' || !username || creditAmount <= 0) {
    throw new AppError('Invalid payment metadata.', { status: 400, code: 'INVALID_METADATA' });
  }

  return fulfillDonation({
    transactionId: externalRef || payment.metadata?.transaction_id,
    externalId: String(paymentId),
    provider: 'mercadopago',
    username,
    creditCurrency,
    creditAmount,
    meta: {
      fiatAmount: payment.transaction_amount,
      fiatCurrency: payment.currency_id,
      packageId: payment.metadata?.package_id,
    },
  });
}

export async function handleStripeWebhook({ rawBody, signatureHeader }) {
  if (!donationsEnabled() || !config.donations.stripe.enabled) {
    return { ignored: true };
  }

  if (!stripe.verifyWebhookSignature(rawBody, signatureHeader)) {
    throw new AppError('Invalid Stripe signature.', { status: 400, code: 'INVALID_SIGNATURE' });
  }

  const event = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody));
  if (event.type !== 'checkout.session.completed') {
    return { ignored: true };
  }

  const session = event.data?.object || {};
  if (session.payment_status !== 'paid') {
    return { ignored: true, payment_status: session.payment_status };
  }

  const metadata = session.metadata || {};
  const username = metadata.username;
  const creditAmount = Number(metadata.amount || 0);
  const creditCurrency = metadata.credit_currency || metadata.configId || 'wcoinc';
  const type = metadata.type || 'COINS';

  if (type !== 'COINS' || !username || creditAmount <= 0) {
    throw new AppError('Invalid Stripe metadata.', { status: 400, code: 'INVALID_METADATA' });
  }

  return fulfillDonation({
    transactionId: metadata.transaction_id,
    externalId: session.id,
    provider: 'stripe',
    username,
    creditCurrency,
    creditAmount,
    meta: {
      fiatAmount: (session.amount_total || 0) / 100,
      fiatCurrency: session.currency,
      packageId: metadata.package_id,
      paymentIntent: session.payment_intent,
    },
  });
}

export async function handlePaypalIpn(payload) {
  if (!donationsEnabled() || !config.donations.paypal.enabled) {
    return { ignored: true };
  }

  const verified = await paypal.verifyIpn(payload);
  if (!verified) {
    throw new AppError('PayPal IPN verification failed.', { status: 400, code: 'INVALID_SIGNATURE' });
  }

  const receiver = String(payload.receiver_email || '').toLowerCase();
  if (receiver !== String(config.donations.paypal.email).toLowerCase()) {
    throw new AppError('PayPal receiver email mismatch.', { status: 400, code: 'RECEIVER_MISMATCH' });
  }

  if (payload.payment_status !== 'Completed') {
    return { ignored: true, payment_status: payload.payment_status };
  }

  const { findTransactionById } = await import('./transactions.js');
  const transactionId = payload.item_number;
  const tx = transactionId ? findTransactionById(transactionId) : null;
  const username = payload.custom || tx?.username;
  if (!username) {
    throw new AppError('Missing PayPal custom username.', { status: 400, code: 'INVALID_METADATA' });
  }

  let creditAmount = tx?.creditAmount;
  let creditCurrency = tx?.creditCurrency || 'wcoinc';

  if (!creditAmount) {
    // Fallback: open-amount conversion (WebEngine style)
    const gross = Number(payload.mc_gross || 0);
    creditAmount = Math.floor(gross * Number(config.donations.paypal.conversionRate || 100));
  }

  return fulfillDonation({
    transactionId: tx?.id,
    externalId: payload.txn_id,
    provider: 'paypal',
    username,
    creditCurrency,
    creditAmount,
    meta: {
      fiatAmount: Number(payload.mc_gross || 0),
      fiatCurrency: payload.mc_currency,
      payerEmail: payload.payer_email,
    },
  });
}

export function history(username) {
  return listTransactionsForUser(username);
}
