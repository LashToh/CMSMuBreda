import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema } from '../validators/auth.js';
import authRoutes from './auth.js';
import accountRoutes from './account.js';
import donationsRoutes from './donations.js';
import * as publicController from '../controllers/publicController.js';
import * as adminController from '../controllers/adminController.js';
import * as authController from '../controllers/authController.js';

const router = Router();

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.registerMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Too many registration attempts. Please try again later.',
  },
});

router.use(apiLimiter);

router.get('/health', publicController.health);
router.get('/server', publicController.serverInfo);
router.get('/rankings/:type?', publicController.rankings);

router.get('/news', publicController.newsList);
router.get('/news/:id', publicController.newsOne);
router.get('/downloads', publicController.downloads);

router.get('/shop/categories', publicController.shopCategories);
router.get('/shop/items', publicController.shopItems);
router.get('/shop/items/:id', publicController.shopItem);
router.post('/shop/purchase', requireAuth, publicController.shopPurchase);
router.get('/shop/history', requireAuth, publicController.shopHistory);

router.post('/giftcodes/redeem', requireAuth, publicController.redeemGift);
router.get('/vote/sites', publicController.voteSites);
router.post('/vote/start', requireAuth, publicController.voteStart);

router.use('/donations', donationsRoutes);

router.use('/auth', authRoutes);
router.use('/account', accountRoutes);

// Backward-compatible alias used by the Season 21 Register modal
router.post(
  '/register',
  registerLimiter,
  validateBody(registerSchema),
  authController.register,
);

const admin = Router();
admin.use(requireAuth, requireAdmin);
admin.get('/dashboard', adminController.dashboard);
admin.get('/news', adminController.listNews);
admin.post('/news', adminController.createNews);
admin.put('/news/:id', adminController.updateNews);
admin.delete('/news/:id', adminController.deleteNews);
admin.get('/downloads', adminController.listDownloads);
admin.post('/downloads', adminController.upsertDownload);
admin.get('/giftcodes', adminController.listGiftCodes);
admin.post('/giftcodes', adminController.createGiftCode);
admin.get('/logs', adminController.auditLogs);
admin.get('/config', adminController.configView);
admin.get('/discovery/tables', adminController.discoverTables);
admin.get('/discovery/tables/:table/columns', adminController.discoverColumns);
router.use('/admin', admin);

export default router;
