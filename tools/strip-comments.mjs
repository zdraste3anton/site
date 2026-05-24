import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parser from '@babel/parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const roots = [
  path.join(root, 'src'),
  path.join(root, 'server', 'src'),
  path.join(root, 'server', 'scripts'),
  path.join(root, 'server', 'prisma', 'seed.mjs'),
];

const parserPlugins = [
  'jsx',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  'optionalChaining',
  'nullishCoalescingOperator',
  'objectRestSpread',
  'dynamicImport',
  'topLevelAwait',
  'importMeta',
  'numericSeparator',
];

function walkJs(dir, acc) {
  if (!fs.existsSync(dir)) return;
  const st = fs.statSync(dir);
  if (st.isFile()) {
    if (dir.endsWith('.js') || dir.endsWith('.jsx') || dir.endsWith('.mjs')) acc.push(dir);
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === 'build') continue;
    walkJs(path.join(dir, name), acc);
  }
}

function collectFiles() {
  const set = new Set();
  for (const p of roots) {
    if (p.endsWith('.mjs')) {
      if (fs.existsSync(p)) set.add(path.normalize(p));
      continue;
    }
    const acc = [];
    walkJs(p, acc);
    for (const f of acc) set.add(path.normalize(f));
  }
  return [...set].sort();
}

function stripByAst(code, isModule) {
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: isModule ? 'module' : 'script',
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      errorRecovery: false,
      plugins: parserPlugins,
    });
  } catch {
    return null;
  }

  const ranges = [];
  const seen = new Set();
  const add = (start, end) => {
    if (start == null || end == null || end <= start) return;
    const key = `${start}:${end}`;
    if (seen.has(key)) return;
    seen.add(key);
    ranges.push([start, end]);
  };

  for (const c of ast.comments || []) {
    add(c.start, c.end);
  }

  ranges.sort((a, b) => b[0] - a[0]);
  let out = code;
  for (const [s, e] of ranges) {
    out = out.slice(0, s) + out.slice(e);
  }
  return out;
}

function detectModule(filePath, code) {
  if (filePath.endsWith('.mjs')) return true;
  return /(?:^|[\r\n])\s*(?:import\s|export\s)/m.test(code);
}

function normalizeEol(s) {
  return s.replace(/\r\n/g, '\n');
}

let changed = 0;
let failed = 0;
const changedFiles = [];

for (const file of collectFiles()) {
  const raw = fs.readFileSync(file, 'utf8');
  const code = normalizeEol(raw);
  const isModule = detectModule(file, code);
  const next = stripByAst(code, isModule);
  if (next === null) {
    console.error('PARSE_FAIL', path.relative(root, file));
    failed += 1;
    continue;
  }
  if (next !== code) {
    fs.writeFileSync(file, next, 'utf8');
    changed += 1;
    changedFiles.push(path.relative(root, file));
  }
}

console.log(JSON.stringify({ changed, failed, files: changedFiles }, null, 2));
