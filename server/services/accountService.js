import { mu } from '../adapters/mu/index.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

export async function getAccountOverview(username) {
  const account = await mu.accounts.findByUsername(username);
  if (!account) throw new AppError('Account not found.', { status: 404, code: 'NOT_FOUND' });

  const [characters, balances, vip, online] = await Promise.all([
    mu.characters.listByAccount(username),
    mu.currency.getBalances(username),
    mu.vip.getStatus(username),
    mu.accounts.isOnline(username),
  ]);

  return {
    username: account.username,
    email: account.email,
    guid: account.guid,
    online,
    characters,
    balances,
    vip: config.features.vip ? vip : { active: false, type: 0, expiresAt: null, disabled: true },
    features: {
      reset: config.features.reset,
      grandReset: config.features.grandReset,
      clearPk: config.features.clearPk,
      unstuck: config.features.unstuck,
      vip: config.features.vip,
      webshop: config.features.webshop,
      giftCodes: config.features.giftCodes,
    },
  };
}
