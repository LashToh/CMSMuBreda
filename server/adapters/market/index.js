import { AppError } from '../../utils/errors.js';

const bridgeUnavailable = () => {
  throw new AppError('The game market bridge is not connected.', {
    status: 503,
    code: 'MARKET_BRIDGE_UNAVAILABLE',
  });
};

/**
 * Web-to-game boundary for the player market.
 *
 * Replace this adapter only when the GameServer can authoritatively lock, move, and deliver
 * items. The CMS must never write inventory rows or claim that an unconfirmed action succeeded.
 */
export const marketAdapter = Object.freeze({
  async getStatus() {
    return {
      connected: false,
      previewOnly: true,
      stats: null,
      capabilities: {
        inventory: false,
        publish: false,
        cancel: false,
        buy: false,
        offer: false,
        wallet: false,
        withdraw: false,
        history: false,
      },
    };
  },
  async listListings() { return { items: [], total: 0 }; },
  getInventory: bridgeUnavailable,
  getAccountMarket: bridgeUnavailable,
  getOffers: bridgeUnavailable,
  getWallet: bridgeUnavailable,
  getHistory: bridgeUnavailable,
  publishListing: bridgeUnavailable,
  cancelListing: bridgeUnavailable,
  buyListing: bridgeUnavailable,
  makeOffer: bridgeUnavailable,
  decideOffer: bridgeUnavailable,
  withdrawBalance: bridgeUnavailable,
});
