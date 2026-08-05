/**
 * Donation packages (fiat → WCoinC).
 * Amounts mirrored from WebEngine mp_packs_coin / sp_packs_coin (type_M → wcoinc).
 */
export const DEFAULT_DONATION_PACKAGES = [
  {
    id: 'wcoinc-1000-ars',
    title: '1,000 WCoinC',
    description: 'Paquete básico (Mercado Pago / ARS).',
    fiatCurrency: 'ARS',
    price: 100,
    creditCurrency: 'wcoinc',
    creditAmount: 1000,
    providers: ['mercadopago', 'mock'],
    active: true,
    order: 1,
  },
  {
    id: 'wcoinc-2000-ars',
    title: '2,000 WCoinC',
    description: 'Paquete medio (Mercado Pago / ARS).',
    fiatCurrency: 'ARS',
    price: 200,
    creditCurrency: 'wcoinc',
    creditAmount: 2000,
    providers: ['mercadopago', 'mock'],
    active: true,
    order: 2,
  },
  {
    id: 'wcoinc-3000-ars',
    title: '3,000 WCoinC',
    description: 'Paquete grande (Mercado Pago / ARS).',
    fiatCurrency: 'ARS',
    price: 300,
    creditCurrency: 'wcoinc',
    creditAmount: 3000,
    providers: ['mercadopago', 'mock'],
    active: true,
    order: 3,
  },
  {
    id: 'wcoinc-1000-usd',
    title: '1,000 WCoinC',
    description: 'Starter pack (Stripe / PayPal / USD).',
    fiatCurrency: 'USD',
    price: 5,
    creditCurrency: 'wcoinc',
    creditAmount: 1000,
    providers: ['stripe', 'paypal', 'mock'],
    active: true,
    order: 10,
  },
  {
    id: 'wcoinc-2000-usd',
    title: '2,000 WCoinC',
    description: 'Standard pack (Stripe / PayPal / USD).',
    fiatCurrency: 'USD',
    price: 10,
    creditCurrency: 'wcoinc',
    creditAmount: 2000,
    providers: ['stripe', 'paypal', 'mock'],
    active: true,
    order: 11,
  },
  {
    id: 'wcoinc-4500-usd',
    title: '4,500 WCoinC',
    description: 'Value pack (Stripe / PayPal / USD).',
    fiatCurrency: 'USD',
    price: 20,
    creditCurrency: 'wcoinc',
    creditAmount: 4500,
    providers: ['stripe', 'paypal', 'mock'],
    active: true,
    order: 12,
  },
];

export function listPackages(storePackages) {
  const packs = Array.isArray(storePackages) && storePackages.length
    ? storePackages
    : DEFAULT_DONATION_PACKAGES;
  return packs.filter((p) => p.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getPackage(packageId, storePackages) {
  return listPackages(storePackages).find((p) => p.id === packageId) || null;
}
