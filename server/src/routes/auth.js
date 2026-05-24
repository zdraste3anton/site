import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', ...authController.registerValidators, authController.register);
router.post('/login', ...authController.loginValidators, authController.login);
router.get('/me', authMiddleware, authController.me);

export default router;
