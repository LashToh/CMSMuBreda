import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as accountController from '../controllers/accountController.js';

const router = Router();

router.use(requireAuth);
router.get('/', accountController.overview);
router.get('/characters', accountController.characters);
router.post('/tools/clear-pk', accountController.clearPk);
router.post('/tools/unstuck', accountController.unstuck);
router.post('/tools/reset', accountController.reset);
router.post('/tools/grand-reset', accountController.grandReset);

export default router;
