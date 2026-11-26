import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema } from '../validators/auth.js';
import { guidesSchema } from '../validators/guides.js';
import { imageUpload } from '../middleware/upload.js';
import authRoutes from './auth.js';
import accountRoutes from './account.js';
import donationsRoutes from './donations.js';
import launcherRoutes from './launcher.js';
import marketRoutes from './market.js';
import * as publicController from '../controllers/publicController.js';
import * as adminController from '../controllers/adminController.js';
import * as authController from '../controllers/authController.js';
import * as visitController from '../controllers/visitController.js';

const router = Router();

// Public pages read these on their own (the home page asks for the server status every 30 s
// and for the rankings on every tab), so they get a limit of their own, much higher: the
// strict one is for logins, accounts and payments. The Season 6 launcher downloads the client
// file by file (a few hundred on the first run), so it is a public read too.
const PUBLIC_READS = ['/health', '/server', '/about', '/guides', '/rankings', '/news', '/downloads', '/shop/categories', '/shop/items', '/market/status', '/market/listings', '/vote/sites', '/launcher/s6'];
const isPublicRead = (req) =>
  (req.method === 'GET' && PUBLIC_READS.some((p) => req.path === p || req.path.startsWith(`${p}/`))) ||
  // Page-view pings are as frequent as reads: they must not use up the strict budget of logins and payments.
  (req.method === 'POST' && req.path === '/visits');

const publicReadLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.publicReadMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isPublicRead(req),
});

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isPublicRead,
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

router.use(publicReadLimiter);
router.use(apiLimiter);

router.get('/health', publicController.health);
router.post('/visits', visitController.track);
router.get('/server', publicController.serverInfo);
router.get('/about', publicController.about);
router.get('/guides', publicController.guides);
router.get('/rankings/:type?', publicController.rankings);

router.get('/news', publicController.newsList);
router.get('/news/:id', publicController.newsOne);
router.get('/downloads', publicController.downloads);

router.use('/market', marketRoutes);

router.get('/shop/categories', publicController.shopCategories);
router.get('/shop/items', publicController.shopItems);
router.get('/shop/items/:id', publicController.shopItem);
router.post('/shop/purchase', requireAuth, publicController.shopPurchase);
router.get('/shop/history', requireAuth, publicController.shopHistory);

router.post('/giftcodes/redeem', requireAuth, publicController.redeemGift);
router.get('/vote/sites', publicController.voteSites);
router.post('/vote/start', requireAuth, publicController.voteStart);

router.use('/donations', donationsRoutes);
router.use('/launcher', launcherRoutes);

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
admin.get('/visits', visitController.report);
admin.get('/news', adminController.listNews);
admin.post('/news', adminController.createNews);
admin.put('/news/:id', adminController.updateNews);
admin.delete('/news/:id', adminController.deleteNews);
admin.get('/downloads', adminController.listDownloads);
admin.post('/downloads', adminController.upsertDownload);
admin.delete('/downloads/:id', adminController.deleteDownload);
admin.get('/giftcodes', adminController.listGiftCodes);
admin.post('/giftcodes', adminController.createGiftCode);
admin.get('/logs', adminController.auditLogs);
admin.get('/config', adminController.configView);
admin.get('/config-full', adminController.getConfigFull);
admin.put('/config-full', adminController.saveConfigFull);
admin.put('/settings', adminController.saveSettings);
admin.get('/accounts/search', adminController.searchAccounts);
admin.get('/donations/packages', adminController.listDonationPackages);
admin.post('/donations/packages', adminController.saveDonationPackage);
admin.delete('/donations/packages/:id', adminController.deleteDonationPackage);
admin.get('/secrets', adminController.getSecrets);
admin.put('/secrets', adminController.saveSecrets);
admin.get('/about', adminController.getAbout);
admin.put('/about', adminController.saveAbout);
admin.post('/about/reset', adminController.resetAbout);
admin.get('/guides', adminController.getGuides);
admin.put('/guides', validateBody(guidesSchema), adminController.saveGuides);
admin.post('/guides/reset', adminController.resetGuides);
admin.post('/uploads', imageUpload, adminController.uploadImage);
admin.get('/discovery/tables', adminController.discoverTables);
admin.get('/discovery/tables/:table/columns', adminController.discoverColumns);
router.use('/admin', admin);

export default router;
