import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as donationsController from '../controllers/donationsController.js';

const router = Router();

router.get('/packages', donationsController.packages);
router.get('/history', requireAuth, donationsController.history);
router.post('/checkout', requireAuth, donationsController.checkout);
router.post('/mock/complete', requireAuth, donationsController.mockComplete);

export default router;
