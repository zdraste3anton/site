export function requireGigachatAuth(req, res, next) {
  const key = process.env.GIGACHAT_AUTH_KEY;
  const trimmed = key != null ? String(key).trim() : '';
  if (!trimmed) {
    return res.status(503).json({
      message: 'Сервис ИИ не настроен',
      code: 'GIGACHAT_NOT_CONFIGURED',
    });
  }
  next();
}
