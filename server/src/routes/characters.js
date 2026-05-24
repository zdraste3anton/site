import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as characterController from '../controllers/characterController.js';

const router = Router();

router.use(authMiddleware);

router.post('/', ...characterController.createCharacterValidators, characterController.create);
router.get('/', characterController.list);

router.get('/:id/pdf', characterController.pdf);
router.get('/:id', characterController.getOne);

router.put('/:id', characterController.update);
router.patch('/:id', characterController.update);
router.delete('/:id', characterController.remove);

export default router;
