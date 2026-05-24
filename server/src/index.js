import './loadEnv.js';
import { createApp } from './app.js';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';



try {
  if (process.env.NODE_ENV !== 'production') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const serverRoot = path.resolve(__dirname, '..');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: serverRoot });
  }
} catch (e) {
  console.error('[Prisma] generate failed:', e?.message || e);
}

function missingEnvMessage(name, hint) {
  return `
[CharacterForge API] ${name} is missing or empty in server/.env

${hint}

Скопируйте server/.env.example → server/.env и заполните значения.
Подробности: server/README.md
`;
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl || !String(dbUrl).trim()) {
  console.error(
    missingEnvMessage(
      'DATABASE_URL',
      'Укажите строку подключения PostgreSQL, например:\n  postgresql://USER:PASSWORD@localhost:5432/characterforge?schema=public\n\nСоздайте базу: CREATE DATABASE characterforge;'
    )
  );
  process.exit(1);
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || !String(jwtSecret).trim()) {
  console.error(
    missingEnvMessage(
      'JWT_SECRET',
      'Укажите длинную случайную строку (минимум 32 символа) для подписи JWT.'
    )
  );
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`CharacterForge API http://localhost:${PORT}`);
});
