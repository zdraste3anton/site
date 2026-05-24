import { ApiError } from '../utils/apiError.js';

function prismaConnectionUserMessage(err) {
  const msg = String(err?.message || '');
  if (/P1001|P1017|Can't reach database server|connection refused|ECONNREFUSED/i.test(msg)) {
    return {
      message:
        'Сервер PostgreSQL недоступен (localhost:5432). Запустите службу PostgreSQL, создайте БД characterforge и проверьте DATABASE_URL в server/.env. См. server/POSTGRESQL-WINDOWS.md',
      code: 'DB_UNAVAILABLE',
      status: 503,
    };
  }
  return null;
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isDev = process.env.NODE_ENV !== 'production';

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Недействительный или просроченный токен', code: 'INVALID_TOKEN' });
  }

  const dbMsg = prismaConnectionUserMessage(err);
  if (dbMsg) {
    console.error('[API Error] Database unreachable:', err.message);
    return res.status(dbMsg.status).json({ message: dbMsg.message, code: dbMsg.code });
  }

  console.error('[API Error]', err.message);
  if (isDev && err.stack) {
    console.error(err.stack);
  }

  return res.status(500).json({
    message: isDev ? err.message || 'Внутренняя ошибка сервера' : 'Внутренняя ошибка сервера',
    code: 'INTERNAL',
  });
}
