
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, '..');


const nodeEnvBeforeDotenv = process.env.NODE_ENV;

dotenv.config({ path: path.join(serverRoot, '.env'), override: true });

if (nodeEnvBeforeDotenv === 'production' || process.env.NODE_ENV === 'production') {
  console.error('[clear-users] Отмена: NODE_ENV=production. Удаление запрещено.');
  process.exit(1);
}

const argv = process.argv.slice(2);
if (!argv.includes('--confirm')) {
  console.error('[clear-users] Отмена: нужен флаг подтверждения.');
  console.error('          Запуск: npm run db:clear-users -- --confirm');
  process.exit(1);
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error('[clear-users] В server/.env не задан DATABASE_URL.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const usersBefore = await prisma.user.count();
  const charactersBefore = await prisma.character.count();

  const { charDeleted, userDeleted } = await prisma.$transaction(async (tx) => {
    const c = await tx.character.deleteMany({});
    const u = await tx.user.deleteMany({});
    return { charDeleted: c.count, userDeleted: u.count };
  });

  console.log('[clear-users] Готово.');
  console.log(`  Удалено персонажей (Character): ${charDeleted} (было записей: ${charactersBefore})`);
  console.log(`  Удалено пользователей (User):   ${userDeleted} (было записей: ${usersBefore})`);
  console.log('[clear-users] Справочники races / classes / spells не изменялись.');
}

main()
  .catch((e) => {
    console.error('[clear-users] Ошибка:', e?.message || e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
