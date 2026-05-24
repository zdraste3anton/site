import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import compendiumRouter from './routes/compendium.js';
import charactersRouter from './routes/characters.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { prisma } from './utils/prisma.js';

export function createApp() {
  const app = express();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.use(
    cors({
      origin: [frontendUrl, 'http://127.0.0.1:3000', 'http://localhost:3000'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '15mb' }));

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        console.log(`[API] ${req.method} ${req.originalUrl}`);
      }
      next();
    });
  }

  app.get('/api/health', async (req, res) => {
    const hasUrl = Boolean(process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim());
    let db = 'not_configured';
    if (hasUrl) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        db = 'ok';
      } catch {
        db = 'error';
      }
    }
    res.json({ ok: true, db });
  });

  app.use('/api/auth', authRouter);
  app.use('/api', compendiumRouter);
  app.use('/api/characters', charactersRouter);
  app.use('/api/ai', aiRoutes);

  app.use('/api', (req, res) => {
    res.status(404).json({
      message: `Маршрут не найден: ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND',
    });
  });

  app.use(errorHandler);

  return app;
}
