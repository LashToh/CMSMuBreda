import { config } from '../config/index.js';
import { marketAdapter } from '../adapters/market/index.js';
import { AppError } from '../utils/errors.js';

const MUTATING_METHODS = new Set([
  'publishListing',
  'cancelListing',
  'buyListing',
  'makeOffer',
  'decideOffer',
  'withdrawBalance',
]);

export async function getStatus() {
  const bridge = await marketAdapter.getStatus();
  return {
    enabled: Boolean(config.features.playerMarket),
    connected: Boolean(config.features.playerMarket && bridge.connected),
    previewOnly: !config.features.playerMarket || Boolean(bridge.previewOnly),
    capabilities: bridge.capabilities,
    stats: bridge.stats || null,
  };
}

export async function listListings(filters) {
  const status = await getStatus();
  if (!status.connected) return { items: [], total: 0, connected: false };
  const result = await marketAdapter.listListings(filters);
  return { ...result, connected: true };
}

async function requireBridge() {
  if (!config.features.playerMarket) {
    throw new AppError('The player market is not enabled.', {
      status: 503,
      code: 'MARKET_DISABLED',
    });
  }
  const status = await marketAdapter.getStatus();
  if (!status.connected) {
    throw new AppError('The game market bridge is not connected.', {
      status: 503,
      code: 'MARKET_BRIDGE_UNAVAILABLE',
    });
  }
}

async function invoke(method, ...args) {
  await requireBridge();
  if (MUTATING_METHODS.has(method) && (args.at(-1) == null || String(args.at(-1)).trim() === '')) {
    throw new AppError('Idempotency-Key is required for market changes.', {
      status: 400,
      code: 'IDEMPOTENCY_KEY_REQUIRED',
    });
  }
  return marketAdapter[method](...args);
}

export const getInventory = (username) => invoke('getInventory', username);
export const getAccountMarket = (username) => invoke('getAccountMarket', username);
export const getOffers = (username) => invoke('getOffers', username);
export const getWallet = (username) => invoke('getWallet', username);
export const getHistory = (username, filters) => invoke('getHistory', username, filters);
export const publishListing = (username, input, idempotencyKey) => invoke('publishListing', username, input, idempotencyKey);
export const cancelListing = (username, listingId, idempotencyKey) => invoke('cancelListing', username, listingId, idempotencyKey);
export const buyListing = (username, listingId, idempotencyKey) => invoke('buyListing', username, listingId, idempotencyKey);
export const makeOffer = (username, listingId, input, idempotencyKey) => invoke('makeOffer', username, listingId, input, idempotencyKey);
export const decideOffer = (username, offerId, input, idempotencyKey) => invoke('decideOffer', username, offerId, input, idempotencyKey);
export const withdrawBalance = (username, input, idempotencyKey) => invoke('withdrawBalance', username, input, idempotencyKey);
