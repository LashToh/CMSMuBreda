import { mu } from '../../adapters/mu/index.js';
import { AppError } from '../../utils/errors.js';
import { appendAudit } from '../../data/cmsStore.js';
import {
  createPendingTransaction,
  findTransactionByExternalId,
  findTransactionById,
  updateTransaction,
} from './transactions.js';

/**
 * Idempotent credit fulfillment after a verified payment.
 */
export async function fulfillDonation({
  transactionId,
  externalId,
  provider,
  username,
  creditCurrency,
  creditAmount,
  meta = {},
}) {
  if (externalId) {
    const existing = findTransactionByExternalId(provider, externalId);
    if (existing?.status === 'completed') {
      return { alreadyProcessed: true, transaction: existing };
    }
  }

  let tx = transactionId ? findTransactionById(transactionId) : null;
  if (tx?.status === 'completed') {
    return { alreadyProcessed: true, transaction: tx };
  }

  if (!tx && !username) {
    throw new AppError('Donation transaction not found.', { status: 404, code: 'NOT_FOUND' });
  }

  const creditUser = username || tx.username;
  const currency = creditCurrency || tx.creditCurrency || 'wcoinc';
  const amount = Number(creditAmount ?? tx.creditAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Invalid credit amount.', { status: 400, code: 'INVALID_AMOUNT' });
  }

  await mu.currency.add(creditUser, currency, amount);

  const completedAt = new Date().toISOString();
  if (tx) {
    tx = updateTransaction(tx.id, {
      status: 'completed',
      externalId: externalId || tx.externalId,
      completedAt,
      meta: { ...tx.meta, ...meta },
    });
  } else {
    // Webhook without prior pending row (e.g. MP description payload only)
    tx = createPendingTransaction({
      username: creditUser,
      packageId: meta.packageId || 'webhook',
      provider,
      fiatCurrency: meta.fiatCurrency || '',
      fiatAmount: meta.fiatAmount || 0,
      creditCurrency: currency,
      creditAmount: amount,
      meta,
    });
    tx = updateTransaction(tx.id, {
      status: 'completed',
      externalId: externalId || null,
      completedAt,
    });
  }

  appendAudit({
    action: 'donation.completed',
    username: creditUser,
    meta: {
      transactionId: tx.id,
      provider,
      externalId,
      creditCurrency: currency,
      creditAmount: amount,
    },
  });

  return {
    alreadyProcessed: false,
    transaction: tx,
    balances: await mu.currency.getBalances(creditUser),
  };
}
