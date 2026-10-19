import { config } from '../../config/index.js';
import { AppError } from '../../utils/errors.js';
import { getDonationStore } from './transactions.js';
import { createPendingTransaction, listTransactionsForUser, updateTransaction } from './transactions.js';
import { getPackage, listPackages } from './packages.js';
import { fulfillDonation } from './fulfill.js';
import {
  BONUS_PERCENT,
  calculateWcoinc,
  currencyForProvider,
  getCustomDonationMeta,
} from './rates.js';
import * as mercadopago from './providers/mercadopago.js';
import * as astropay from './providers/astropay.js';
import * as paypal from './providers/paypal.js';

export { getCustomDonationMeta, calculateWcoinc, currencyForProvider };

export function donationsEnabled() {
  return Boolean(config.features.donations);
}

export function mockModeEnabled() {
  return Boolean(config.donations.mockMode) || config.isMock;
}

const REAL_PROVIDERS = ['mercadopago', 'astropay', 'paypal'];

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
  const astroConfigured = astropay.isConfigured();
  const paypalConfigured = paypal.isConfigured();
  const mpFeature = Boolean(config.donations.mercadopago.enabled);
  const astroFeature = Boolean(config.donations.astropay.enabled);
  const paypalFeature = Boolean(config.donations.paypal.enabled);
  const mockOn = mockModeEnabled();

  return {
    mercadopago: {
      enabled: mpFeature && mpConfigured,
      configured: mpConfigured,
      reason: providerReason('mercadopago', { featureEnabled: mpFeature, configured: mpConfigured }),
    },
    astropay: {
      enabled: astroFeature && astroConfigured,
      configured: astroConfigured,
      reason: providerReason('astropay', { featureEnabled: astroFeature, configured: astroConfigured }),
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
 * Public package list: only gateways allowed for that pack's currency
 * (ARS → MP, USD → AstroPay/PayPal) + mock when mock mode is on.
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
      providers: visibleIds
        .filter((id) => packSet.has(id) || (id === 'astropay' && packSet.has('stripe')))
        .map((id) => {
          const base = status[id] || { enabled: false, configured: false, reason: 'disabled' };
          const enabled = Boolean(base.enabled);
          return {
            id,
            enabled,
            configured: Boolean(base.configured),
            reason: enabled ? null : base.reason || 'not_configured',
          };
        }),
    };
  });
}

function publicBaseUrl() {
  return config.donations.publicBaseUrl.replace(/\/$/, '');
}

function buildCustomPack(provider, amount, fiatCurrencyHint) {
  const selected = String(provider || '').toLowerCase();
  const expectedFiat = currencyForProvider(selected);
  if (!expectedFiat) {
    throw new AppError('Provider not available for custom amount.', {
      status: 400,
      code: 'INVALID_PROVIDER',
    });
  }

  const fiat = String(fiatCurrencyHint || expectedFiat).toUpperCase();
  if (fiat !== expectedFiat) {
    throw new AppError(
      `Provider ${selected} only accepts ${expectedFiat}.`,
      { status: 400, code: 'INVALID_CURRENCY' },
    );
  }

  let quote;
  try {
    quote = calculateWcoinc(amount, fiat);
  } catch (err) {
    throw new AppError(err.message || 'Invalid amount.', {
      status: 400,
      code: err.code || 'INVALID_AMOUNT',
    });
  }

  return {
    id: 'custom',
    title: `Custom ${quote.fiatAmount} ${quote.fiatCurrency}`,
    description: quote.bonusApplied
      ? `Custom donation (+${Math.round(BONUS_PERCENT * 100)}% bonus)`
      : 'Custom donation',
    fiatCurrency: quote.fiatCurrency,
    price: quote.fiatAmount,
    creditCurrency: 'wcoinc',
    creditAmount: quote.creditAmount,
    providers: [selected, 'mock'],
    quote,
  };
}

export async function startCheckout(username, { packageId, provider, amount, fiatCurrency }) {
  if (!donationsEnabled()) {
    throw new AppError('Donations are disabled.', { status: 503, code: 'FEATURE_DISABLED' });
  }

  let selected = String(provider || '').toLowerCase();
  if (selected === 'stripe') selected = 'astropay';

  const isCustom = amount != null && amount !== '';
  let pack;

  if (isCustom) {
    pack = buildCustomPack(selected, amount, fiatCurrency);
  } else {
    const store = getDonationStore();
    pack = getPackage(packageId, store.donationPackages);
    if (!pack) {
      throw new AppError('Package not found.', { status: 404, code: 'NOT_FOUND' });
    }

    const packProviders = (pack.providers || []).map((x) => String(x).toLowerCase());
    const allowed =
      packProviders.length === 0 ||
      packProviders.includes(selected) ||
      (selected === 'astropay' && packProviders.includes('stripe'));
    if (!allowed) {
      throw new AppError('Provider not available for this package.', {
        status: 400,
        code: 'INVALID_PROVIDER',
      });
    }
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
    meta: isCustom
      ? {
          custom: true,
          baseAmount: pack.quote?.baseAmount,
          bonusAmount: pack.quote?.bonusAmount,
          bonusApplied: pack.quote?.bonusApplied,
        }
      : {},
  });

  const returnUrl = config.donations.successUrl || `${publicBaseUrl()}/donate?status=success`;
  const cancelUrl = config.donations.cancelUrl || `${publicBaseUrl()}/donate?status=cancel`;
  // Split deploy: site is static on mubreda.net — callbacks must hit the API host.
  const webhookRoot = String(config.donations.webhookBaseUrl || publicBaseUrl()).replace(
    /\/$/,
    '',
  );
  const webhookBase = `${webhookRoot}/api/donations/webhooks`;

  if (selected === 'mock') {
    return {
      mode: 'mock',
      transactionId: tx.id,
      creditAmount: pack.creditAmount,
      message: 'Mock checkout ready. Call /api/donations/mock/complete to credit WCoinC.',
    };
  }

  if (selected === 'mercadopago') {
    const result = await mercadopago.createPreference({
      username,
      pack,
      transactionId: tx.id,
      notificationUrl: `${webhookBase}/mercadopago`,
      returnUrl,
    });
    updateTransaction(tx.id, { externalId: result.externalId });
    return {
      mode: 'redirect',
      transactionId: tx.id,
      checkoutUrl: result.checkoutUrl,
      provider: 'mercadopago',
      creditAmount: pack.creditAmount,
    };
  }

  if (selected === 'astropay') {
    const result = await astropay.createDeposit({
      username,
      pack,
      transactionId: tx.id,
      callbackUrl: `${webhookBase}/astropay`,
      redirectUrl: returnUrl,
      cancelUrl,
    });
    updateTransaction(tx.id, { externalId: result.externalId });
    return {
      mode: 'redirect',
      transactionId: tx.id,
      checkoutUrl: result.checkoutUrl,
      provider: 'astropay',
      creditAmount: pack.creditAmount,
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
      creditAmount: pack.creditAmount,
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

export async function handleAstroPayWebhook({ rawBody, signatureHeader }) {
  if (!donationsEnabled() || !config.donations.astropay.enabled) {
    return { ignored: true };
  }

  const rawForSig = Buffer.isBuffer(rawBody)
    ? rawBody.toString('utf8')
    : typeof rawBody === 'string'
      ? rawBody
      : JSON.stringify(rawBody ?? {});

  if (!astropay.verifyWebhookSignature(rawForSig, signatureHeader)) {
    throw new AppError('Invalid AstroPay signature.', { status: 400, code: 'INVALID_SIGNATURE' });
  }

  let payload = {};
  try {
    payload = rawForSig.trim() ? JSON.parse(rawForSig) : {};
  } catch {
    throw new AppError('Invalid AstroPay payload.', { status: 400, code: 'INVALID_PAYLOAD' });
  }

  const status = String(payload.status || '').toUpperCase();
  if (status !== 'APPROVED') {
    return { ignored: true, status };
  }

  const { findTransactionById } = await import('./transactions.js');
  const transactionId =
    payload.merchant_deposit_id ||
    payload.merchant_payment_id ||
    payload.external_reference ||
    '';
  const tx = transactionId ? findTransactionById(String(transactionId)) : null;

  const username = tx?.username || String(payload.user?.merchant_user_id || '').replace(
    /[^a-zA-Z0-9_]/g,
    '',
  );
  const creditAmount = Number(tx?.creditAmount || 0);
  const creditCurrency = tx?.creditCurrency || 'wcoinc';

  if (!username || creditAmount <= 0) {
    throw new AppError('Invalid AstroPay metadata.', { status: 400, code: 'INVALID_METADATA' });
  }

  const externalId = String(
    payload.deposit_external_id || payload.payment_external_id || transactionId,
  );

  return fulfillDonation({
    transactionId: tx?.id || transactionId || undefined,
    externalId,
    provider: 'astropay',
    username,
    creditCurrency,
    creditAmount,
    meta: {
      fiatAmount: payload.amount ?? payload.merchant_amount,
      fiatCurrency: payload.currency || payload.merchant_currency,
      packageId: tx?.packageId,
      endStatusDate: payload.end_status_date,
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
