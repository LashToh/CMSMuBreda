import { ok, fail } from '../utils/response.js';
import * as donations from '../services/donations/index.js';

export async function packages(_req, res, next) {
  try {
    if (!donations.donationsEnabled()) {
      return fail(res, 503, 'FEATURE_DISABLED', 'Donations are disabled.');
    }
    return ok(res, {
      items: donations.listPublicPackages(),
      providers: donations.listProvidersStatus(),
      mockMode: donations.mockModeEnabled(),
      custom: donations.getCustomDonationMeta(),
    });
  } catch (err) {
    return next(err);
  }
}

export async function checkout(req, res, next) {
  try {
    const result = await donations.startCheckout(req.user.username, {
      packageId: req.body.packageId,
      provider: req.body.provider,
      amount: req.body.amount,
      fiatCurrency: req.body.fiatCurrency,
    });
    return ok(res, result, 'Checkout created.');
  } catch (err) {
    return next(err);
  }
}

export async function mockComplete(req, res, next) {
  try {
    const result = await donations.completeMockDonation(
      req.user.username,
      req.body.transactionId,
    );
    return ok(res, result, result.message);
  } catch (err) {
    return next(err);
  }
}

export async function history(req, res, next) {
  try {
    if (!donations.donationsEnabled()) {
      return fail(res, 503, 'FEATURE_DISABLED', 'Donations are disabled.');
    }
    return ok(res, { items: donations.history(req.user.username) });
  } catch (err) {
    return next(err);
  }
}

export async function webhookMercadoPago(req, res, next) {
  try {
    await donations.handleMercadoPagoWebhook({
      rawBody: req.body,
      signatureHeader: req.headers['x-signature'],
      requestId: req.headers['x-request-id'],
      query: req.query,
    });
    return res.status(200).send('OK');
  } catch (err) {
    if (err.code === 'INVALID_SIGNATURE') {
      return res.status(400).send(err.message);
    }
    return next(err);
  }
}

export async function webhookAstroPay(req, res, next) {
  try {
    await donations.handleAstroPayWebhook({
      rawBody: req.body,
      signatureHeader: req.headers.signature || req.headers['Signature'],
    });
    return res.status(200).send('OK');
  } catch (err) {
    if (err.code === 'INVALID_SIGNATURE' || err.code === 'INVALID_PAYLOAD') {
      return res.status(400).send(err.message);
    }
    return next(err);
  }
}

export async function webhookPaypal(req, res, next) {
  try {
    await donations.handlePaypalIpn(req.body || {});
    return res.status(200).send('OK');
  } catch (err) {
    // PayPal expects 200 even on business errors in some setups; return 400 on verify fail
    if (err.code === 'INVALID_SIGNATURE' || err.code === 'RECEIVER_MISMATCH') {
      return res.status(400).send(err.message);
    }
    console.error('[paypal-ipn]', err.message);
    return res.status(200).send('OK');
  }
}
