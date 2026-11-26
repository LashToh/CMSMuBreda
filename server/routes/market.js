import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import * as controller from '../controllers/marketController.js';
import { fail } from '../utils/response.js';
import {
  listingQuerySchema,
  publishListingSchema,
  offerSchema,
  offerDecisionSchema,
  withdrawalSchema,
} from '../validators/market.js';

const router = Router();

function requireIdempotencyKey(req, res, next) {
  const key = req.get('Idempotency-Key');
  if (!key || !/^[A-Za-z0-9._:-]{8,128}$/.test(key)) {
    return fail(res, 400, 'IDEMPOTENCY_KEY_REQUIRED', 'A valid Idempotency-Key is required.');
  }
  return next();
}

router.get('/status', controller.status);
router.get('/listings', validateQuery(listingQuerySchema), controller.listings);

router.use(requireAuth);
router.get('/inventory', controller.inventory);
router.get('/me', controller.accountMarket);
router.get('/offers', controller.offers);
router.get('/wallet', controller.wallet);
router.get('/history', controller.history);
router.post('/listings', requireIdempotencyKey, validateBody(publishListingSchema), controller.publish);
router.delete('/listings/:listingId', requireIdempotencyKey, controller.cancel);
router.post('/listings/:listingId/buy', requireIdempotencyKey, controller.buy);
router.post('/listings/:listingId/offers', requireIdempotencyKey, validateBody(offerSchema), controller.offer);
router.post('/offers/:offerId/decision', requireIdempotencyKey, validateBody(offerDecisionSchema), controller.decideOffer);
router.post('/wallet/withdraw', requireIdempotencyKey, validateBody(withdrawalSchema), controller.withdraw);

export default router;
