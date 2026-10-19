/**
 * Donation packages (fiat → WCoinC).
 * ARS → Mercado Pago only. USD → AstroPay + PayPal.
 */

export function providersForFiat(fiatCurrency, { includeMock = true } = {}) {
  const fiat = String(fiatCurrency || 'USD').toUpperCase();
  const base = fiat === 'ARS' ? ['mercadopago'] : ['astropay', 'paypal'];
  return includeMock ? [...base, 'mock'] : base;
}

function normalizePackProviders(pack) {
  return {
    ...pack,
    providers: providersForFiat(pack.fiatCurrency, { includeMock: true }),
  };
}

export const DEFAULT_DONATION_PACKAGES = [
  {
    id: 'wcoinc-1000-ars',
    title: '1,000 WCoinC',
    description: 'Basic pack (ARS).',
    fiatCurrency: 'ARS',
    price: 100,
    creditCurrency: 'wcoinc',
    creditAmount: 1000,
    providers: providersForFiat('ARS'),
    active: true,
    order: 1,
  },
  {
    id: 'wcoinc-2000-ars',
    title: '2,000 WCoinC',
    description: 'Medium pack (ARS).',
    fiatCurrency: 'ARS',
    price: 200,
    creditCurrency: 'wcoinc',
    creditAmount: 2000,
    providers: providersForFiat('ARS'),
    active: true,
    order: 2,
  },
  {
    id: 'wcoinc-3000-ars',
    title: '3,000 WCoinC',
    description: 'Large pack (ARS).',
    fiatCurrency: 'ARS',
    price: 300,
    creditCurrency: 'wcoinc',
    creditAmount: 3000,
    providers: providersForFiat('ARS'),
    active: true,
    order: 3,
  },
  {
    id: 'wcoinc-1000-usd',
    title: '1,000 WCoinC',
    description: 'Starter pack (USD).',
    fiatCurrency: 'USD',
    price: 5,
    creditCurrency: 'wcoinc',
    creditAmount: 1000,
    providers: providersForFiat('USD'),
    active: true,
    order: 10,
  },
  {
    id: 'wcoinc-2000-usd',
    title: '2,000 WCoinC',
    description: 'Standard pack (USD).',
    fiatCurrency: 'USD',
    price: 10,
    creditCurrency: 'wcoinc',
    creditAmount: 2000,
    providers: providersForFiat('USD'),
    active: true,
    order: 11,
  },
  {
    id: 'wcoinc-4500-usd',
    title: '4,500 WCoinC',
    description: 'Value pack (USD).',
    fiatCurrency: 'USD',
    price: 20,
    creditCurrency: 'wcoinc',
    creditAmount: 4500,
    providers: providersForFiat('USD'),
    active: true,
    order: 12,
  },
];

/** ARS packs first, then USD; within each currency by price ascending. */
export function comparePackagesByValue(a, b) {
  const fiatRank = (fiat) => {
    const f = String(fiat || '').toUpperCase();
    if (f === 'ARS') return 0;
    if (f === 'USD') return 1;
    return 2;
  };
  const byFiat = fiatRank(a.fiatCurrency) - fiatRank(b.fiatCurrency);
  if (byFiat !== 0) return byFiat;
  const byPrice = Number(a.price || 0) - Number(b.price || 0);
  if (byPrice !== 0) return byPrice;
  return Number(a.creditAmount || 0) - Number(b.creditAmount || 0);
}

export function listPackages(storePackages) {
  const packs = Array.isArray(storePackages) && storePackages.length
    ? storePackages
    : DEFAULT_DONATION_PACKAGES;
  return packs
    .filter((p) => p.active !== false)
    .map(normalizePackProviders)
    .sort(comparePackagesByValue);
}

export function getPackage(packageId, storePackages) {
  return listPackages(storePackages).find((p) => p.id === packageId) || null;
}
