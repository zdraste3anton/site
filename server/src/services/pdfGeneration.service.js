import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import PDFDocument from 'pdfkit';
import { normalizeSkillsForPdf } from '../utils/normalizeSkillsForPdf.js';
import { prisma } from '../utils/prisma.js';
import {
  levelLabelFromSpell,
  normalizeSpellMechanics,
  spellShapeForMechanics,
} from '../../../src/utils/spellMechanics.js';

const require = createRequire(import.meta.url);
const dejavuRoot = path.dirname(require.resolve('dejavu-fonts-ttf/package.json'));

const DEJAVU_SANS_TTF = path.join(dejavuRoot, 'ttf', 'DejaVuSans.ttf');
const DEJAVU_SANS_TTF_ABS = path.resolve(DEJAVU_SANS_TTF);
const DEJAVU_SANS_BOLD_TTF = path.join(dejavuRoot, 'ttf', 'DejaVuSans-Bold.ttf');
const DEJAVU_SANS_BOLD_TTF_ABS = path.resolve(DEJAVU_SANS_BOLD_TTF);
const FONT_NAME = 'DejaVu';
const FONT_BOLD = 'DejaVuBold';

function assertPdfFont() {
  const exists = fs.existsSync(DEJAVU_SANS_TTF_ABS);
  console.log('[PDF] font path (absolute):', DEJAVU_SANS_TTF_ABS);
  console.log('[PDF] font file exists:', exists);
  if (!exists) {
    const msg = `Не найден шрифт для PDF: ${DEJAVU_SANS_TTF_ABS} (npm-пакет dejavu-fonts-ttf).`;
    console.error('[PDF]', msg);
    throw new Error(msg);
  }
  const boldExists = fs.existsSync(DEJAVU_SANS_BOLD_TTF_ABS);
  console.log('[PDF] bold font path (absolute):', DEJAVU_SANS_BOLD_TTF_ABS);
  console.log('[PDF] bold font file exists:', boldExists);
}

function safeStringList(items, mapLine) {
  if (!Array.isArray(items)) return [];
  const out = [];
  for (const item of items) {
    if (item == null) continue;
    try {
      const line = mapLine(item);
      if (line != null) out.push(line);
    } catch (err) {
      console.warn('[PDF] skip invalid row:', err?.message || err);
    }
  }
  return out;
}

function safeText(value, fallback = '—') {
  const s = value == null ? '' : String(value);
  const t = s.replace(/\s+/g, ' ').trim();
  return t || fallback;
}

function safeJsonParse(value) {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function clampNumber(raw, fallback = 0) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function formatModifier(mod) {
  const n = clampNumber(mod, 0);
  if (n >= 0) return `+${n}`;
  return String(n);
}

function abilityModifier(score) {
  const n = clampNumber(score, 10);
  return Math.floor((n - 10) / 2);
}

function wrapHeight(doc, text, width, opts = {}) {
  return doc.heightOfString(String(text || ''), { width, ...opts });
}

function drawDivider(doc, x1, y, x2) {
  doc.save();
  doc.strokeColor('#CFCFCF').lineWidth(0.7).moveTo(x1, y).lineTo(x2, y).stroke();
  doc.restore();
}

function resolvePortraitForPdf(portraitUrl) {
  const url = String(portraitUrl || '').trim();
  if (!url || !/^data:image\/(png|jpe?g);base64,/i.test(url)) {
    return null;
  }
  const match = url.match(/^data:image\/(png|jpe?g);base64,(.+)$/i);
  if (!match) return null;
  try {
    const format = match[1].toLowerCase().includes('png') ? 'png' : 'jpeg';
    return { buffer: Buffer.from(match[2], 'base64'), format };
  } catch {
    return null;
  }
}

function drawBox(doc, x, y, w, h, title) {
  doc.save();
  doc.lineWidth(1);
  doc.fillColor('#F4F4F4').rect(x, y, w, h).fill();
  doc.strokeColor('#B8B8B8').rect(x, y, w, h).stroke();

  if (title) {
    const padX = 10;
    const barH = 22;
    doc.fillColor('#EDEDED').rect(x, y, w, barH).fill();
    doc.strokeColor('#B8B8B8').rect(x, y, w, barH).stroke();
    
    doc.fillColor('#111111').font(FONT_BOLD).fontSize(9).text(String(title), x + padX, y + 6, {
      width: w - padX * 2,
      ellipsis: true,
    });
  }
  doc.restore();
}

function drawSectionTitle(doc, title, x, y, w) {
  doc.save();
  doc.font(FONT_BOLD).fontSize(14).fillColor('#111111').text(String(title), x, y, { width: w });
  doc.restore();
}

function drawStatBox(doc, label, value, modifier, x, y, w, h) {
  drawBox(doc, x, y, w, h, null);
  doc.save();
  doc.fillColor('#111111').font(FONT_NAME);
  doc.fontSize(9).fillColor('#4A4A4A').text(String(label), x + 8, y + 6, { width: w - 16, align: 'center' });
  doc.fontSize(18).fillColor('#111111').text(String(value), x + 8, y + 18, { width: w - 16, align: 'center' });
  doc.fontSize(11)
    .fillColor('#8A5A16')
    .text(formatModifier(modifier), x + 8, y + h - 18, { width: w - 16, align: 'center' });
  doc.restore();
}

function drawTextList(doc, items, x, y, w, h, opts = {}) {
  const {
    fontSize = 9,
    lineGap = 3,
    leftPad = 10,
    topPad = 10,
    maxItems = Infinity,
  } = opts;

  const list = Array.isArray(items) ? items.filter(Boolean).map((s) => String(s)) : [];

  doc.save();
  doc.font(FONT_NAME).fontSize(fontSize).fillColor('#111111');

  let cy = y + topPad;
  const maxY = y + h - 10;
  const rendered = [];
  const overflow = [];

  for (let i = 0; i < list.length && i < maxItems; i += 1) {
    const raw = safeText(list[i], '');
    if (!raw) continue;

    const lineW = w - leftPad - 10;
    const needed = wrapHeight(doc, raw, lineW, { lineGap });
    if (cy + needed > maxY) {
      overflow.push(...list.slice(i));
      break;
    }

    doc.fillColor('#111111').text(raw, x + leftPad, cy, { width: lineW, lineGap });
    rendered.push(raw);
    cy += needed + 2;
  }

  doc.restore();
  return { rendered, overflow, yEnd: cy };
}

function ensureSpace(doc, neededHeight, marginY = 40) {
  const bottom = doc.page.height - marginY;
  if (doc.y + neededHeight <= bottom) return;
  doc.addPage();
  doc.y = marginY;
}

function normalizeSpellArrayForPdf(raw) {
  if (!raw) return [];
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      
      return t
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map((name, i) => ({ id: `csv_${i}_${name.slice(0, 24)}`, name }));
    }
  }
  return Array.isArray(raw) ? raw : [];
}

function normalizeNameKey(name) {
  return safeText(name, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

async function enrichCharacterSpellsFromCompendium(characterSpells) {
  const list = normalizeSpellArrayForPdf(characterSpells);
  if (!list.length) return { spells: [], found: 0, missing: 0 };

  const all = await prisma.spell.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      level: true,
      levelGroup: true,
      school: true,
      tagsJson: true,
      classesJson: true,
    },
  });
  const dict = new Map();
  for (const sp of all) {
    dict.set(normalizeNameKey(sp.name), sp);
  }

  let found = 0;
  let missing = 0;

  const enriched = list.map((sp) => {
    const base = typeof sp === 'string' ? { name: sp } : sp || {};
    const key = normalizeNameKey(base.name);
    const full = key ? dict.get(key) : null;
    if (full) found += 1;
    else missing += 1;

    return {
      ...full,
      ...base,
      ...(base.description ? null : full?.description ? { description: full.description } : null),
      ...(base.school ? null : full?.school ? { school: full.school } : null),
      ...(base.level != null ? null : full?.level != null ? { level: full.level } : null),
      ...(base.levelGroup ? null : full?.levelGroup ? { levelGroup: full.levelGroup } : null),
    };
  });

  return { spells: enriched, found, missing };
}

function normalizeSpellForPdf(spell) {
  if (spell == null) {
    return {
      name: '—',
      level: null,
      levelLabel: '—',
      school: '—',
      range: '',
      duration: '',
      effect: '',
      description: 'Описание не найдено в справочнике',
    };
  }

  if (typeof spell === 'string') {
    const name = safeText(spell, '—');
    return {
      name,
      level: null,
      levelLabel: '—',
      school: '—',
      range: '',
      duration: '',
      effect: '',
      description: 'Описание не найдено в справочнике',
    };
  }

  const name = safeText(spell.name, '—');
  const levelNum = spell.level != null ? clampNumber(spell.level, null) : null;
  const levelTag = safeText(spell.levelTag, '');
  const levelLabel =
    levelTag ||
    (levelNum === 0
      ? 'Заговор'
      : levelNum != null
        ? `${levelNum} уровень`
        : '—');

  const school =
    safeText(spell.school, '') ||
    (Array.isArray(spell.schools) && spell.schools.length ? safeText(spell.schools[0], '—') : '—');

  const description =
    safeText(spell.description, '') ||
    safeText(spell.desc, '') ||
    safeText(spell.text, '') ||
    'Описание не найдено в справочнике';

  
  const firstSentence = String(description).split(/(?<=[.!?])\s+/)[0] || '';

  return {
    name,
    level: levelNum,
    levelLabel,
    school,
    range: safeText(spell.range, ''),
    duration: safeText(spell.duration, ''),
    effect: safeText(spell.effect || spell.damage || firstSentence, ''),
    description,
  };
}

function pdfMechanicCell(v) {
  const t = safeText(v, '').trim();
  return t || 'нет';
}


function pdfDescEffectRedundant(description, effect) {
  const d = safeText(description, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const e = safeText(effect, '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!e) return true;
  if (!d) return false;
  if (d === e) return true;
  const min = 28;
  if (e.length >= min && d.startsWith(e)) return true;
  if (d.length >= min && e.startsWith(d)) return true;
  const n = 88;
  if (d.slice(0, n) === e.slice(0, n)) return true;
  return false;
}

function drawSpellCard(doc, spell, x, _y, w) {
  const pad = 10;
  const shaped = spellShapeForMechanics(spell);
  const mech = normalizeSpellMechanics(shaped);
  const s = normalizeSpellForPdf(spell);
  const name = safeText(s.name, '—');

  const redundant = pdfDescEffectRedundant(s.description, mech.effect);
  const descText = safeText(s.description, '').trim();
  const showLongDesc = !redundant && descText.length > 0;

  const titleFont = 12;
  const bodyFont = 9;
  const lineGap = 3;
  const metaLineGap = 2;
  const innerW = w - pad * 2;

  const statLines = [
    `Уровень: ${pdfMechanicCell(mech.levelLabel)}`,
    `Школа: ${pdfMechanicCell(mech.school)}`,
    `Кубики: ${pdfMechanicCell(mech.dice)}`,
    `Спасбросок: ${pdfMechanicCell(mech.savingThrow)}`,
    `Дистанция: ${pdfMechanicCell(mech.range)}`,
    `Длительность: ${pdfMechanicCell(mech.duration)}`,
  ];
  const effectLine = `Эффект: ${pdfMechanicCell(mech.effect)}`;

  doc.save();
  let h = pad;
  doc.font(FONT_BOLD).fontSize(titleFont);
  const titleH = wrapHeight(doc, name, innerW, { lineGap: metaLineGap });
  h += titleH + 8;
  doc.font(FONT_NAME).fontSize(bodyFont);
  for (const line of statLines) {
    h += wrapHeight(doc, line, innerW, { lineGap: metaLineGap }) + lineGap;
  }
  h += wrapHeight(doc, effectLine, innerW, { lineGap: metaLineGap }) + 8;
  if (showLongDesc) {
    doc.font(FONT_BOLD);
    h += wrapHeight(doc, 'Описание:', innerW) + lineGap;
    doc.font(FONT_NAME);
    h += wrapHeight(doc, descText, innerW, { lineGap });
  }
  h += pad;
  doc.restore();

  ensureSpace(doc, h + 14, 40);
  const cy = doc.y;
  drawBox(doc, x, cy, w, h, null);

  doc.save();
  let ty = cy + pad;
  doc.fillColor('#111111').font(FONT_BOLD).fontSize(titleFont).text(name, x + pad, ty, { width: innerW, lineGap: metaLineGap });
  ty += titleH + 8;
  doc.font(FONT_NAME).fontSize(bodyFont);
  for (const line of statLines) {
    doc.text(line, x + pad, ty, { width: innerW, lineGap: metaLineGap });
    ty += wrapHeight(doc, line, innerW, { lineGap: metaLineGap }) + lineGap;
  }
  doc.text(effectLine, x + pad, ty, { width: innerW, lineGap: metaLineGap });
  ty += wrapHeight(doc, effectLine, innerW, { lineGap: metaLineGap }) + 8;

  if (showLongDesc) {
    doc.font(FONT_BOLD).text('Описание:', x + pad, ty, { width: innerW });
    ty += wrapHeight(doc, 'Описание:', innerW) + lineGap;
    doc.font(FONT_NAME).text(descText, x + pad, ty, { width: innerW, lineGap });
  }

  doc.restore();
  doc.y = cy + h + 10;
}

function drawTwoColumnList(doc, items, x, y, w, h, opts = {}) {
  const { fontSize = 8.5, lineGap = 2 } = opts;
  const list = Array.isArray(items) ? items.filter(Boolean).map((s) => String(s)) : [];
  const colGap = 10;
  const colW = (w - colGap) / 2;
  const leftX = x;
  const rightX = x + colW + colGap;
  const topY = y;
  const maxY = y + h;

  doc.save();
  doc.font(FONT_NAME).fontSize(fontSize).fillColor('#111111');

  let cyL = topY;
  let cyR = topY;
  let side = 'L';

  const lineW = colW - 6;
  for (const raw of list) {
    const line = safeText(raw, '');
    if (!line) continue;
    const needed = wrapHeight(doc, line, lineW, { lineGap });
    const canL = cyL + needed <= maxY;
    const canR = cyR + needed <= maxY;

    if (!canL && !canR) {
      doc.fillColor('#555555').text('…', rightX, maxY - 10);
      break;
    }

    if (side === 'L' && !canL && canR) side = 'R';
    if (side === 'R' && !canR && canL) side = 'L';

    const bx = side === 'L' ? leftX : rightX;
    const by = side === 'L' ? cyL : cyR;

    doc.fillColor('#111111').text(line, bx + 2, by, { width: lineW, lineGap });

    if (side === 'L') cyL += needed + 1;
    else cyR += needed + 1;
  }

  doc.restore();
  return { yEnd: Math.max(cyL, cyR) };
}

function fitLineToWidth(doc, text, width) {
  const t = String(text || '').trim();
  if (!t) return '';
  if (doc.widthOfString(t) <= width) return t;
  const ell = '…';
  let lo = 0;
  let hi = t.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const cand = t.slice(0, mid).trimEnd() + ell;
    if (doc.widthOfString(cand) <= width) lo = mid + 1;
    else hi = mid;
  }
  const cut = Math.max(1, lo - 1);
  return t.slice(0, cut).trimEnd() + ell;
}

function drawSkillsList(doc, items, x, y, w, h) {
  const list = Array.isArray(items) ? items.filter(Boolean).map((s) => String(s)) : [];
  const lineGap = 2;

  
  const useTwo = w >= 260; 
  const colGap = 14;
  const colW = useTwo ? (w - colGap) / 2 : w;
  const leftX = x;
  const rightX = x + colW + colGap;

  
  const tryRender = (fontSize) => {
    const lineH = fontSize + lineGap;
    const maxLines = Math.max(1, Math.floor(h / lineH));
    const perCol = useTwo ? Math.ceil(maxLines / 2) : maxLines;
    const capacity = useTwo ? perCol * 2 : perCol;

    doc.save();
    doc.font(FONT_NAME).fontSize(fontSize).fillColor('#111111');

    let i = 0;
    for (let row = 0; row < perCol && i < list.length; row += 1, i += 1) {
      const ty = y + row * lineH;
      doc.text(fitLineToWidth(doc, list[i], colW), leftX, ty, { lineBreak: false });
    }
    if (useTwo) {
      let j = i;
      for (let row = 0; row < perCol && j < list.length; row += 1, j += 1) {
        const ty = y + row * lineH;
        doc.text(fitLineToWidth(doc, list[j], colW), rightX, ty, { lineBreak: false });
      }
    }

    
    if (list.length > capacity) {
      const tx = useTwo ? rightX : leftX;
      const ty = y + (perCol - 1) * lineH;
      doc.fillColor('#555555').text('…', tx + colW - 10, ty, { lineBreak: false });
    }

    doc.restore();
    return list.length <= capacity;
  };

  if (!tryRender(8.8)) {
    tryRender(8.0);
  }
}

function measureSkillsTwoColumn(doc, items, w, opts = {}) {
  const { fontSize = 10, colGap = 14, lineGap = 2 } = opts;
  const list = Array.isArray(items) ? items.filter(Boolean).map((s) => String(s)) : [];
  const half = Math.ceil(list.length / 2);
  const left = list.slice(0, half);
  const right = list.slice(half);
  const colW = (w - colGap) / 2;

  doc.save();
  doc.font(FONT_NAME).fontSize(fontSize);

  const measureCol = (lines) => {
    let cy = 0;
    for (const line of lines) {
      const fs = pickSkillFontSize(doc, line, colW, fontSize);
      doc.fontSize(fs);
      cy += doc.heightOfString(line, { width: colW }) + lineGap;
    }
    doc.fontSize(fontSize);
    return cy;
  };

  const contentH = Math.max(measureCol(left), measureCol(right), fontSize + lineGap);
  doc.restore();
  return { contentH, list };
}

function pickSkillFontSize(doc, line, colW, baseFontSize) {
  doc.font(FONT_NAME).fontSize(baseFontSize);
  if (doc.widthOfString(String(line || '')) <= colW) return baseFontSize;
  const smaller = Math.max(8, baseFontSize - 1);
  doc.fontSize(smaller);
  if (doc.widthOfString(String(line || '')) <= colW) return smaller;
  return smaller;
}

function drawSkillsTwoColumn(doc, items, x, y, w, opts = {}) {
  const { fontSize = 10, colGap = 14, lineGap = 2 } = opts;
  const list = Array.isArray(items) ? items.filter(Boolean).map((s) => String(s)) : [];
  const half = Math.ceil(list.length / 2);
  const left = list.slice(0, half);
  const right = list.slice(half);

  const colW = (w - colGap) / 2;
  const leftX = x;
  const rightX = x + colW + colGap;

  doc.save();
  doc.fillColor('#111111');

  const drawCol = (lines, colX) => {
    let cy = y;
    for (const line of lines) {
      const fs = pickSkillFontSize(doc, line, colW, fontSize);
      doc.font(FONT_NAME).fontSize(fs);
      const blockH = doc.heightOfString(line, { width: colW });
      doc.text(line, colX, cy, { width: colW, lineBreak: true });
      cy += blockH + lineGap;
    }
    return cy;
  };

  const endY = Math.max(drawCol(left, leftX), drawCol(right, rightX));
  doc.restore();
  return { contentH: endY - y };
}

function normalizeFeatureLinesFromAny(raw) {
  if (!raw) return [];
  if (typeof raw === 'string') {
    const parsed = safeJsonParse(raw);
    if (parsed != null) return normalizeFeatureLinesFromAny(parsed);
    return raw
      .split(/\r?\n|,/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  if (Array.isArray(raw)) return raw.map((x) => safeText(x, '')).filter(Boolean);
  if (typeof raw === 'object') {
    const out = [];
    const TECH_KEYS = new Set([
      'tags',
      'tag',
      'accent',
      'icon',
      'color',
      'roleInParty',
      'primaryStats',
      'schools',
      'classes',
      'tagsJson',
      'classesJson',
      'bonusesJson',
      'traitsJson',
      'featuresJson',
      'id',
      'name',
      'description',
    ]);
    for (const [k, v] of Object.entries(raw)) {
      if (v == null) continue;
      if (TECH_KEYS.has(String(k))) continue;
      if (typeof v === 'string' || typeof v === 'number') out.push(`${k}: ${v}`);
      else if (Array.isArray(v)) out.push(`${k}: ${v.map((x) => String(x)).join(', ')}`);
      else out.push(`${k}: [объект]`);
    }
    return out.filter(Boolean);
  }
  return [];
}

async function deriveFeaturesForPdf(character) {
  const direct = [
    ...normalizeFeatureLinesFromAny(character.features),
    ...normalizeFeatureLinesFromAny(character.featuresJson),
    ...normalizeFeatureLinesFromAny(character.abilities),
    ...normalizeFeatureLinesFromAny(character.traits),
    ...normalizeFeatureLinesFromAny(character.traitsJson),
    ...normalizeFeatureLinesFromAny(character.race?.traits),
    ...normalizeFeatureLinesFromAny(character.race?.traitsJson),
    ...normalizeFeatureLinesFromAny(character.class?.features),
    ...normalizeFeatureLinesFromAny(character.class?.featuresJson),
  ];
  if (direct.length) return direct;

  const raceName = safeText(character.raceName, '');
  const className = safeText(character.className, '');

  let fromRace = [];
  let fromClass = [];
  try {
    if (raceName) {
      const race = await prisma.race.findFirst({
        where: { name: raceName },
        select: { traitsJson: true },
      });
      
      fromRace = normalizeFeatureLinesFromAny(race?.traitsJson?.traits || race?.traitsJson?.features || race?.traitsJson);
    }
  } catch {
    
  }
  try {
    if (className) {
      const cls = await prisma.dndClass.findFirst({
        where: { name: className },
        select: { featuresJson: true },
      });
      
      fromClass = normalizeFeatureLinesFromAny(
        cls?.featuresJson?.level1Features ||
          cls?.featuresJson?.level1Abilities ||
          cls?.featuresJson?.features ||
          cls?.featuresJson
      );
    }
  } catch {
    
  }

  const merged = [...fromRace, ...fromClass].map((x) => safeText(x, '')).filter(Boolean);
  
  const bad = /(accent|icon|violet|purple|orange|tags?\s*:|classes?\s*:|schools?\s*:|json)/i;
  return merged.filter((line) => !bad.test(line));
}

function wrapToLines(doc, text, width) {
  const raw = String(text || '').replace(/\r/g, '');
  if (!raw.trim()) return [];

  const out = [];
  const paragraphs = raw.split('\n');
  for (const para of paragraphs) {
    const p = para.trimEnd();
    if (!p) {
      out.push('');
      continue;
    }
    const words = p.split(/\s+/);
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (doc.widthOfString(candidate) <= width) {
        line = candidate;
      } else {
        if (line) out.push(line);
        
        
        line = word;
      }
    }
    if (line) out.push(line);
  }
  
  while (out.length && !String(out.at(-1)).trim()) out.pop();
  return out;
}

function ensureSpaceOrNewPage(doc, minBottomY) {
  if (doc.y <= minBottomY) return;
  doc.addPage();
}


export async function buildCharacterPdfBuffer(character) {
  console.log('[PDF] generating PDF for:', character?.name ?? '(no name)');
  if (!character || typeof character !== 'object') {
    const msg = 'buildCharacterPdfBuffer: character is missing or not an object';
    console.error('[PDF]', msg);
    throw new Error(msg);
  }
  assertPdfFont();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      if (process.env.NODE_ENV === 'development') {
        const debugPath = path.join(os.tmpdir(), 'characterforge-pdf-last.pdf');
        try {
          fs.writeFileSync(debugPath, buf);
          console.log('[PDF] debug sample written:', debugPath, 'size=', buf.length);
        } catch (e) {
          console.error('[PDF] debug sample write failed:', e?.message || e);
        }
      }
      resolve(buf);
    });
    doc.on('error', reject);

    doc.registerFont(FONT_NAME, DEJAVU_SANS_TTF_ABS);
    doc.registerFont(FONT_BOLD, DEJAVU_SANS_BOLD_TTF_ABS);
    doc.font(FONT_NAME);

    (async () => {
      try {

      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const margin = 40;
      const contentW = pageW - margin * 2;
      const contentH = pageH - margin * 2;

      
      const colGap = 12;
      const leftW = Math.round(contentW * 0.3);
      const midW = Math.round(contentW * 0.42);
      const rightW = contentW - leftW - midW - colGap * 2;
      const colX = [margin, margin + leftW + colGap, margin + leftW + colGap + midW + colGap];

      const rawAttrs = character.attributes || character.attributesJson;
      const attrs =
        rawAttrs && typeof rawAttrs === 'object' && !Array.isArray(rawAttrs) ? rawAttrs : {};

      const skillLines = normalizeSkillsForPdf(character);

      const enriched = await enrichCharacterSpellsFromCompendium(character.spells);
      console.log('[PDF] spells compendium enrich:', {
        total: enriched.spells.length,
        foundInCompendium: enriched.found,
        missingInCompendium: enriched.missing,
      });

      const spellLines = safeStringList(enriched.spells, (sp) => {
        const s = normalizeSpellForPdf(sp);
        const left = safeText(s.name, '');
        if (!left) return null;
        const right = [safeText(s.school, ''), safeText(s.levelLabel, '')].filter(Boolean).join(' · ');
        return right ? `${left} — ${right}` : left;
      });

      const inventoryLines = Array.isArray(character.inventory)
        ? character.inventory.map((x) => safeText(x, '')).filter(Boolean)
        : [];

      const featureLines = await deriveFeaturesForPdf(character);
      console.log('[PDF] counts:', {
        skills: skillLines.length,
        features: featureLines.length,
        inventory: inventoryLines.length,
        spells: spellLines.length,
        storyChars: String(character.story || '').length,
      });

      
      const headerY = margin;
      const portraitData = resolvePortraitForPdf(character.portraitUrl);
      const portraitSize = portraitData ? 72 : 0;
      const portraitPad = portraitData ? 12 : 0;
      const headerH = portraitData ? 100 : 88;
      drawBox(doc, margin, headerY, contentW, headerH, null);

      const headerTextW = contentW - 28 - (portraitData ? portraitSize + portraitPad : 0);

      doc.fillColor('#111111').font(FONT_BOLD);
      doc.fontSize(22).text(safeText(character.name, 'Персонаж'), margin + 14, headerY + 12, {
        width: headerTextW,
        ellipsis: true,
      });

      drawDivider(doc, margin + 14, headerY + 50, margin + contentW - 14 - (portraitData ? portraitSize + portraitPad : 0));

      doc.fontSize(10).fillColor('#333333');
      const line1 = `Раса: ${safeText(character.raceName, '—')}     Класс: ${safeText(
        character.className,
        '—'
      )}     Уровень: ${character.level ?? 1}`;
      doc.text(line1, margin + 14, headerY + 58, { width: headerTextW });

      const combat = `КД: ${safeText(character.armorClass, '—')}     Хиты: ${safeText(
        character.hitPoints ?? character.hp,
        '—'
      )}     Инициатива: ${safeText(character.initiative, '—')}`;
      doc.text(combat, margin + 14, headerY + 72, { width: headerTextW });

      if (portraitData) {
        const imgX = margin + contentW - portraitSize - 14;
        const imgY = headerY + (headerH - portraitSize) / 2;
        try {
          doc.image(portraitData.buffer, imgX, imgY, {
            width: portraitSize,
            height: portraitSize,
            fit: [portraitSize, portraitSize],
            align: 'center',
            valign: 'center',
          });
        } catch (err) {
          console.warn('[PDF] skip portrait embed:', err?.message || err);
        }
      }

      
      const topY = headerY + headerH + 12;
      const bottomY = margin + contentH;
      const columnsBottom = bottomY;
      const colAreaH = columnsBottom - topY;

      
      const statCardH = 62;
      const statGapY = 8;
      const statW = leftW;
      const statX = colX[0];
      let statY = topY;
      drawBox(doc, statX, statY, statW, Math.min(colAreaH, statCardH * 3 + statGapY * 2 + 28), 'Характеристики');
      statY += 28;

      const order = [
        ['str', 'СИЛ'],
        ['dex', 'ЛОВ'],
        ['con', 'ТЕЛ'],
        ['int', 'ИНТ'],
        ['wis', 'МУД'],
        ['cha', 'ХАР'],
      ];
      for (let i = 0; i < order.length; i += 1) {
        const [k, label] = order[i];
        const v = attrs[k] ?? '—';
        const mod = abilityModifier(attrs[k] ?? 10);
        const boxX = statX + 10 + (i % 2) * ((statW - 30) / 2 + 10);
        const boxY = statY + Math.floor(i / 2) * (statCardH + statGapY);
        const boxW = (statW - 30) / 2;
        drawStatBox(doc, label, v, mod, boxX, boxY, boxW, statCardH);
      }

      
      const midX = colX[1];
      {
        const skills = skillLines.length ? skillLines : ['Навыки не указаны'];
        const innerW = midW - 20;
        const innerX = midX + 10;
        const innerY = topY + 32;

        
        let fontSize = 10;
        let measured = measureSkillsTwoColumn(doc, skills, innerW, { fontSize });
        let boxH = 22 + 10 + measured.contentH + 12;
        if (boxH > colAreaH) {
          fontSize = 9;
          measured = measureSkillsTwoColumn(doc, skills, innerW, { fontSize });
          boxH = 22 + 10 + measured.contentH + 12;
        }

        boxH = Math.min(colAreaH, boxH);

        drawBox(doc, midX, topY, midW, boxH, 'Навыки');

        const maxContentH = boxH - 22 - 10 - 12;
        let toRender = skills;
        let renderMeasured = measureSkillsTwoColumn(doc, toRender, innerW, { fontSize });
        if (renderMeasured.contentH > maxContentH && skills.length > 4) {
          const keep = Math.max(4, Math.floor((skills.length * maxContentH) / renderMeasured.contentH));
          toRender = skills.slice(0, keep);
        }
        drawSkillsTwoColumn(doc, toRender, innerX, innerY, innerW, { fontSize });
      }

      
      

      
      const rightX = colX[2];
      let rightY = topY;
      const featuresH = Math.floor(colAreaH * 0.56);
      drawBox(doc, rightX, rightY, rightW, featuresH, 'Особенности');
      drawTextList(
        doc,
        featureLines.length ? featureLines : ['Особенности не указаны'],
        rightX,
        rightY + 22,
        rightW,
        featuresH - 22,
        { fontSize: 8.6, maxItems: 999 }
      );
      rightY += featuresH + 10;

      const inventoryH = columnsBottom - rightY;
      drawBox(doc, rightX, rightY, rightW, inventoryH, 'Инвентарь');
      drawTextList(
        doc,
        inventoryLines.length ? inventoryLines : ['Пусто'],
        rightX,
        rightY + 22,
        rightW,
        inventoryH - 22,
        { fontSize: 8.6, maxItems: 999 }
      );

      
      const storyText = safeText(character.story, '').trim();
      if (storyText) {
        doc.addPage();
        doc.y = margin;
        drawBox(doc, margin, margin, contentW, contentH, 'История персонажа');
        doc.save();
        doc.font(FONT_NAME).fontSize(10).fillColor('#111111');
        const tx = margin + 12;
        const ty = margin + 30;
        const tw = contentW - 24;
        const th = contentH - 42;
        const lines = wrapToLines(doc, storyText, tw);
        const lh = 10 + 2;
        const fit = Math.max(1, Math.floor(th / lh));
        doc.text(lines.slice(0, fit).join('\n'), tx, ty, { width: tw, lineGap: 2 });
        doc.restore();

        let remaining = lines.slice(fit).join('\n').trim();
        while (remaining) {
          doc.addPage();
          doc.y = margin;
          drawBox(doc, margin, margin, contentW, contentH, 'История персонажа');
          doc.save();
          doc.font(FONT_NAME).fontSize(10).fillColor('#111111');
          const all = wrapToLines(doc, remaining, tw);
          const pageFit = Math.max(1, Math.floor(th / lh));
          doc.text(all.slice(0, pageFit).join('\n'), tx, ty, { width: tw, lineGap: 2 });
          remaining = all.slice(pageFit).join('\n').trim();
          doc.restore();
        }
      }

      
      const spellsAll = enriched.spells;
      if (spellsAll.length) {
        
        const byLevel = new Map();
        for (const sp of spellsAll) {
          const shaped = spellShapeForMechanics(sp);
          const lbl = levelLabelFromSpell(shaped);
          const lv =
            shaped.level === 0 || /заговор/i.test(lbl) ? 0 : shaped.level != null ? shaped.level : 99;
          const arr = byLevel.get(lv) || [];
          arr.push(sp);
          byLevel.set(lv, arr);
        }
        const levels = [...byLevel.keys()].sort((a, b) => a - b);

        doc.addPage();
        doc.y = margin;
        drawSectionTitle(doc, 'Заклинания', margin, doc.y, contentW);
        doc.y += 18;

        for (const lv of levels) {
          const title =
            lv === 0 ? 'Заговоры' : lv === 99 ? 'Заклинания' : `Заклинания ${lv} уровня`;
          ensureSpace(doc, 36, margin);
          drawSectionTitle(doc, title, margin, doc.y, contentW);
          doc.y += 12;
          const items = byLevel.get(lv) || [];
          for (const sp of items) {
            drawSpellCard(doc, sp, margin, doc.y, contentW);
          }
          doc.y += 6;
        }
      }

        doc.end();
      } catch (e) {
        reject(e);
      }
    })();
  });
}
