import { ok } from '../utils/response.js';
import * as market from '../services/marketService.js';

function handler(work) {
  return async (req, res, next) => {
    try {
      return ok(res, await work(req));
    } catch (error) {
      return next(error);
    }
  };
}

export const status = handler(() => market.getStatus());
export const listings = handler((req) => market.listListings(req.validatedQuery));
export const inventory = handler((req) => market.getInventory(req.user.username));
export const accountMarket = handler((req) => market.getAccountMarket(req.user.username));
export const offers = handler((req) => market.getOffers(req.user.username));
export const wallet = handler((req) => market.getWallet(req.user.username));
export const history = handler((req) => market.getHistory(req.user.username, req.query));
export const publish = handler((req) => market.publishListing(req.user.username, req.validated, req.get('Idempotency-Key')));
export const cancel = handler((req) => market.cancelListing(req.user.username, req.params.listingId, req.get('Idempotency-Key')));
export const buy = handler((req) => market.buyListing(req.user.username, req.params.listingId, req.get('Idempotency-Key')));
export const offer = handler((req) => market.makeOffer(req.user.username, req.params.listingId, req.validated, req.get('Idempotency-Key')));
export const decideOffer = handler((req) => market.decideOffer(req.user.username, req.params.offerId, req.validated, req.get('Idempotency-Key')));
export const withdraw = handler((req) => market.withdrawBalance(req.user.username, req.validated, req.get('Idempotency-Key')));
