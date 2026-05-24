
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, '..');
dotenv.config({ path: path.join(serverRoot, '.env'), override: true });

const raw = process.env.DATABASE_URL?.trim();
if (!raw) {
  console.error('DATABASE_URL is missing in server/.env');
  process.exit(1);
}

const normalized = raw.replace(/^postgresql:/i, 'postgres:');
const u = new URL(normalized);
const dbName = (u.pathname || '/').replace(/^\//, '').split('?')[0];
if (!dbName) {
  console.error('Could not parse database name from DATABASE_URL');
  process.exit(1);
}

u.pathname = '/postgres';
const adminUrl = u.toString().replace(/^postgres:/i, 'postgresql:');

const client = new pg.Client({ connectionString: adminUrl });
try {
  await client.connect();
  const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (rows.length === 0) {
    const safe = dbName.replace(/"/g, '""');
    await client.query(`CREATE DATABASE "${safe}"`);
    console.log(`[ensure-database] Created database "${dbName}"`);
  } else {
    console.log(`[ensure-database] Database "${dbName}" already exists`);
  }
} catch (e) {
  console.error('[ensure-database] Failed:', e.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
