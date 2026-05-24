import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma.js';
import { signToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';

const SALT_ROUNDS = 10;

export async function registerUser({ username, email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ApiError(409, 'Пользователь с таким email уже зарегистрирован', 'EMAIL_EXISTS');
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      username: String(username).trim().slice(0, 80),
      email: normalizedEmail,
      passwordHash,
    },
    select: { id: true, username: true, email: true, createdAt: true },
  });
  const token = signToken({ sub: user.id, email: user.email });
  return { user, token };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new ApiError(401, 'Неверный email или пароль', 'INVALID_CREDENTIALS');
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new ApiError(401, 'Неверный email или пароль', 'INVALID_CREDENTIALS');
  }
  const token = signToken({ sub: user.id, email: user.email });
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true, createdAt: true },
  });
}
