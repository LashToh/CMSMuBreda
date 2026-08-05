import { readStore, updateStore, appendAudit } from '../../data/cmsStore.js';

function ensureDonationsShape(store) {
  if (!Array.isArray(store.donationPackages)) store.donationPackages = [];
  if (!Array.isArray(store.donationTransactions)) store.donationTransactions = [];
  return store;
}

export function getDonationStore() {
  return ensureDonationsShape(readStore());
}

export function createPendingTransaction({
  username,
  packageId,
  provider,
  fiatCurrency,
  fiatAmount,
  creditCurrency,
  creditAmount,
  meta = {},
}) {
  const id = `don_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const tx = {
    id,
    provider,
    externalId: null,
    username,
    packageId,
    fiatCurrency,
    fiatAmount,
    creditCurrency,
    creditAmount,
    status: 'pending',
    createdAt: new Date().toISOString(),
    completedAt: null,
    meta,
  };

  updateStore((store) => {
    ensureDonationsShape(store);
    store.donationTransactions.unshift(tx);
    store.donationTransactions = store.donationTransactions.slice(0, 5000);
    return store;
  });

  appendAudit({
    action: 'donation.pending',
    username,
    meta: { id, provider, packageId, creditAmount, creditCurrency },
  });

  return tx;
}

export function findTransactionById(id) {
  return getDonationStore().donationTransactions.find((t) => t.id === id) || null;
}

export function findTransactionByExternalId(provider, externalId) {
  if (!externalId) return null;
  return (
    getDonationStore().donationTransactions.find(
      (t) => t.provider === provider && t.externalId === String(externalId),
    ) || null
  );
}

export function updateTransaction(id, patch) {
  let updated = null;
  updateStore((store) => {
    ensureDonationsShape(store);
    const idx = store.donationTransactions.findIndex((t) => t.id === id);
    if (idx === -1) return store;
    store.donationTransactions[idx] = {
      ...store.donationTransactions[idx],
      ...patch,
    };
    updated = store.donationTransactions[idx];
    return store;
  });
  return updated;
}

export function listTransactionsForUser(username) {
  return getDonationStore().donationTransactions.filter(
    (t) => t.username.toLowerCase() === String(username).toLowerCase(),
  );
}
