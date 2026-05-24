import { validationResult, body } from 'express-validator';
import * as authService from '../services/authService.js';

export const registerValidators = [
  body('username').trim().isLength({ min: 2, max: 80 }).withMessage('Имя пользователя: 2–80 символов'),
  body('email').trim().isEmail().withMessage('Некорректный email'),
  body('password').isLength({ min: 6, max: 128 }).withMessage('Пароль: минимум 6 символов'),
];

export const loginValidators = [
  body('email').trim().isEmail().withMessage('Некорректный email'),
  body('password').notEmpty().withMessage('Введите пароль'),
];

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
        code: 'VALIDATION',
        details: errors.array(),
      });
    }
    const { username, email, password } = req.body;
    const { user, token } = await authService.registerUser({ username, email, password });
    res.status(201).json({ user, token });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
        code: 'VALIDATION',
        details: errors.array(),
      });
    }
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });
    res.json({ user, token });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}
