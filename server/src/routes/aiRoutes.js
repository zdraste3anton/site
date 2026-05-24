import { Router } from 'express';
import { requireGigachatAuth } from '../middleware/requireGigachat.js';
import * as aiController from '../controllers/aiController.js';

const router = Router();

router.post('/attributes', requireGigachatAuth, aiController.attributes);
router.post('/story', requireGigachatAuth, aiController.story);

export default router;
