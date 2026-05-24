
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, '..');
const repoRoot = path.join(__dirname, '..', '..');


dotenv.config({ path: path.join(serverRoot, '.env'), override: true });

dotenv.config({ path: path.join(repoRoot, '.env'), override: false });
