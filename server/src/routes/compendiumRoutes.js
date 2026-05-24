import { Router } from 'express';
import * as compendiumController from '../controllers/compendiumController.js';

const router = Router();

router.get('/races', compendiumController.listRaces);
router.get('/races/:id', compendiumController.getRace);
router.get('/classes', compendiumController.listClasses);
router.get('/classes/:id', compendiumController.getClass);
router.get('/spells', compendiumController.listSpells);
router.get('/spells/:id', compendiumController.getSpell);

export default router;
