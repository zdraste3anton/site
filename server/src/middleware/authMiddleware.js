import { prisma } from '../utils/prisma.js';
import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';


export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const m = header.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      throw new ApiError(401, 'Требуется авторизация', 'UNAUTHORIZED');
    }
    const decoded = verifyToken(m[1]);
    const userId = decoded.sub;
    if (!userId) {
      throw new ApiError(401, 'Неверный токен', 'INVALID_TOKEN');
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, createdAt: true },
    });
    if (!user) {
      throw new ApiError(401, 'Пользователь не найден', 'USER_NOT_FOUND');
    }
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}
