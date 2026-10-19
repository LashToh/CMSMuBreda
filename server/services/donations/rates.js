/**
 * Custom donation conversion rules.
 * 1 ARS = 1 WCoinC · 1 USD = 1000 WCoinC
 * Bonus +10% WC when amount exceeds thresholds.
 */

export const WC_RATES = Object.freeze({
  ARS: 1,
  USD: 1000,
});

/** Amount must be strictly greater than these to unlock the bonus. */
export const BONUS_THRESHOLD = Object.freeze({
  ARS: 50_000,
  USD: 50,
});

export const BONUS_PERCENT = 0.1;

export const PROVIDER_CURRENCY = Object.freeze({
  mercadopago: 'ARS',
  astropay: 'USD',
  paypal: 'USD',
  mock: 'USD',
});

export function currencyForProvider(provider) {
  return PROVIDER_CURRENCY[String(provider || '').toLowerCase()] || null;
}

export function getCustomDonationMeta() {
  return {
    rates: { ...WC_RATES },
    bonusThreshold: { ...BONUS_THRESHOLD },
    bonusPercent: BONUS_PERCENT,
    providerCurrency: { ...PROVIDER_CURRENCY },
  };
}

/**
 * @returns {{ creditAmount: number, baseAmount: number, bonusAmount: number, bonusApplied: boolean, rate: number, fiatCurrency: string, fiatAmount: number }}
 */
export function calculateWcoinc(amount, fiatCurrency) {
  const fiat = String(fiatCurrency || '').toUpperCase();
  const rate = WC_RATES[fiat];
  if (!rate) {
    const err = new Error(`Unsupported currency: ${fiat}`);
    err.code = 'INVALID_CURRENCY';
    throw err;
  }

  const fiatAmount = Number(amount);
  if (!Number.isFinite(fiatAmount) || fiatAmount <= 0) {
    const err = new Error('Invalid donation amount.');
    err.code = 'INVALID_AMOUNT';
    throw err;
  }

  const baseAmount = Math.floor(fiatAmount * rate);
  if (baseAmount <= 0) {
    const err = new Error('Amount too small.');
    err.code = 'INVALID_AMOUNT';
    throw err;
  }

  const threshold = BONUS_THRESHOLD[fiat] ?? Infinity;
  const bonusApplied = fiatAmount > threshold;
  const bonusAmount = bonusApplied ? Math.floor(baseAmount * BONUS_PERCENT) : 0;

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
