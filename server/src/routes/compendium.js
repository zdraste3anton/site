import { Router } from 'express';
import * as compendiumController from '../controllers/compendiumController.js';

const router = Router();

router.get('/races', compendiumController.listRaces);
router.get('/classes', compendiumController.listClasses);
router.get('/spells', compendiumController.listSpellsSimple);

export default router;
