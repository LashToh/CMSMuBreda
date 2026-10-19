/** Mirrors server/services/donations/rates.js for instant UI preview. */

export const WC_RATES = {
  ARS: 1,
  USD: 1000,
};

export const BONUS_THRESHOLD = {
  ARS: 50_000,
  USD: 50,
};

export const BONUS_PERCENT = 0.1;

export const PROVIDER_CURRENCY = {
  mercadopago: 'ARS',
  astropay: 'USD',
  paypal: 'USD',
  mock: 'USD',
};

export function currencyForProvider(provider) {
  return PROVIDER_CURRENCY[String(provider || '').toLowerCase()] || null;
}

export function calculateWcoinc(amount, fiatCurrency, meta = {}) {
  const rates = meta.rates || WC_RATES;
  const thresholds = meta.bonusThreshold || BONUS_THRESHOLD;
  const bonusPercent = meta.bonusPercent ?? BONUS_PERCENT;
  const fiat = String(fiatCurrency || '').toUpperCase();
  const rate = rates[fiat];
  const fiatAmount = Number(amount);

  if (!rate || !Number.isFinite(fiatAmount) || fiatAmount <= 0) {
    return {
      fiatCurrency: fiat,
      fiatAmount: 0,
      rate: rate || 0,
      baseAmount: 0,
      bonusAmount: 0,
      bonusApplied: false,
      creditAmount: 0,
    };
  }

  const baseAmount = Math.floor(fiatAmount * rate);
  const threshold = thresholds[fiat] ?? Infinity;
  const bonusApplied = fiatAmount > threshold;
  const bonusAmount = bonusApplied ? Math.floor(baseAmount * bonusPercent) : 0;

  return {
    fiatCurrency: fiat,
    fiatAmount,
    rate,
    baseAmount,
    bonusAmount,
    bonusApplied,
    creditAmount: baseAmount + bonusAmount,
  };
}
