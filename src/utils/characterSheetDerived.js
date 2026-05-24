import { abilityModifier, formatModifier } from './dndModifiers';
import { SPELLS } from '../data/spellsData';


const CLASS_HIT_DIE = {
  wizard: 6,
  sorcerer: 6,
  bard: 8,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  artificer: 8,
  fighter: 10,
  paladin: 10,
  ranger: 10,
};

const KNOWN_CLASS_IDS = new Set(Object.keys(CLASS_HIT_DIE));


export function resolveCharacterClassId(classId, className) {
  const raw = String(classId || '').toLowerCase().trim();
  if (raw && KNOWN_CLASS_IDS.has(raw)) return raw;
  const nm = String(className || '').toLowerCase();
  if (nm.includes('волшебник') || nm.includes('маг') || nm.includes('wizard')) return 'wizard';
  if (nm.includes('чародей') || nm.includes('чарод')) return 'sorcerer';
  if (nm.includes('колдун')) return 'warlock';
  if (nm.includes('бард')) return 'bard';
  if (nm.includes('жрец') || nm.includes('клирик')) return 'cleric';
  if (nm.includes('друид')) return 'druid';
  if (nm.includes('воин')) return 'fighter';
  if (nm.includes('монах')) return 'monk';
  if (nm.includes('паладин')) return 'paladin';
  if (nm.includes('плут')) return 'rogue';
  if (nm.includes('изобрет')) return 'artificer';
  if (nm.includes('следопыт')) return 'ranger';
  return '';
}


const CLASS_SKILL_FOCUS = {
  wizard: ['arcana', 'history', 'investigation'],
  sorcerer: ['arcana', 'deception', 'intimidation'],
  warlock: ['arcana', 'deception', 'intimidation'],
  bard: ['performance', 'persuasion', 'deception'],
  cleric: ['insight', 'religion', 'medicine'],
  druid: ['nature', 'perception', 'insight'],
  fighter: ['athletics', 'intimidation', 'acrobatics'],
  monk: ['acrobatics', 'insight', 'stealth'],
  paladin: ['athletics', 'insight', 'intimidation'],
  rogue: ['stealth', 'deception', 'sleight_of_hand'],
  artificer: ['investigation', 'arcana', 'sleight_of_hand'],
  ranger: ['survival', 'nature', 'perception'],
};


const NON_SPELLCASTING_CLASS_IDS = new Set(['fighter', 'monk', 'rogue']);

export function isNonSpellcastingClass(classId, className) {
  const id = resolveCharacterClassId(classId, className);
  return NON_SPELLCASTING_CLASS_IDS.has(id);
}


const CLASS_SPELL_START = {
  cleric: { cantrips: ['light', 'sacred-flame'], first: ['cure-wounds', 'shield-of-faith'] },
  wizard: { cantrips: ['fire-bolt', 'mage-hand'], first: ['mage-armor', 'sleep'] },
  ranger: { cantrips: [], first: ['hunters-mark', 'animal-friendship'] },
  bard: { cantrips: ['vicious-mockery', 'minor-illusion'], first: ['thunderwave', 'cure-wounds'] },
  sorcerer: { cantrips: ['fire-bolt', 'light'], first: ['mage-armor', 'shield'] },
  warlock: { cantrips: ['eldritch-blast', 'mage-hand'], first: ['hex', 'armour-of-agathys'] },
  druid: { cantrips: ['guidance', 'thorn-whip'], first: ['entangle', 'cure-wounds'] },
  paladin: { cantrips: [], first: ['bless', 'shield-of-faith'] },
  artificer: { cantrips: ['mage-hand', 'acid-splash'], first: ['shield', 'sanctuary'] },
};

export const SKILL_DEFINITIONS = [
  { id: 'acrobatics', name: 'Акробатика', ability: 'dex' },
  { id: 'animal_handling', name: 'Уход за животными', ability: 'wis' },
  { id: 'arcana', name: 'Магия', ability: 'int' },
  { id: 'athletics', name: 'Атлетика', ability: 'str' },
  { id: 'deception', name: 'Обман', ability: 'cha' },
  { id: 'history', name: 'История', ability: 'int' },
  { id: 'insight', name: 'Проницательность', ability: 'wis' },
  { id: 'intimidation', name: 'Запугивание', ability: 'cha' },
  { id: 'investigation', name: 'Анализ', ability: 'int' },
  { id: 'medicine', name: 'Медицина', ability: 'wis' },
  { id: 'nature', name: 'Природа', ability: 'int' },
  { id: 'perception', name: 'Внимание', ability: 'wis' },
  { id: 'performance', name: 'Выступление', ability: 'cha' },
  { id: 'persuasion', name: 'Убеждение', ability: 'cha' },
  { id: 'religion', name: 'Религия', ability: 'int' },
  { id: 'sleight_of_hand', name: 'Ловкость рук', ability: 'dex' },
  { id: 'stealth', name: 'Скрытность', ability: 'dex' },
  { id: 'survival', name: 'Выживание', ability: 'wis' },
];

function proficiencyBonus(level) {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
}

export function computeArmorClass(attributes) {
  if (!attributes) return 10;
  return 10 + abilityModifier(attributes.dex ?? 10);
}

export function computeMaxHp(classId, attributes, level = 1) {
  const die = CLASS_HIT_DIE[classId] || 8;
  const con = abilityModifier(attributes?.con ?? 10);
  const avg = Math.floor(die / 2) + 1;
  const first = Math.max(1, die + con);
  if (level <= 1) return first;
  let total = first;
  for (let lv = 2; lv <= level; lv += 1) {
    total += Math.max(1, avg + con);
  }
  return total;
}

export function computeInitiativeBonus(attributes) {
  return formatModifier(abilityModifier(attributes?.dex ?? 10));
}

function spellRowFromId(spellId) {
  const s = SPELLS.find((x) => x.id === spellId);
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    school: s.school,
    level: s.level,
    levelTag: s.level === 0 ? 'Заговор' : `${s.level} ур.`,
  };
}


export function deriveDefaultSpells(classId, className) {
  const hardcoded = deriveHardcodedRuStartContent(className);
  if (hardcoded && Array.isArray(hardcoded.spells)) return [...hardcoded.spells];
  const cid = resolveCharacterClassId(classId, className);
  if (!cid) return [];
  if (NON_SPELLCASTING_CLASS_IDS.has(cid)) return [];
  const spec = CLASS_SPELL_START[cid];
  if (!spec) return [];
  const out = [];
  for (const id of spec.cantrips || []) {
    const row = spellRowFromId(id);
    if (row) out.push(row);
  }
  for (const id of spec.first || []) {
    const row = spellRowFromId(id);
    if (row) out.push(row);
  }
  return out;
}


export function deriveHardcodedRuStartContent(className) {
  const nm = String(className || '').trim().toLowerCase();
  if (nm === 'жрец') {
    return {
      spells: [
        { id: 'light', name: 'Свет', school: '—', level: 0, levelTag: 'Заговор' },
        { id: 'cure-wounds', name: 'Лечение ран', school: '—', level: 1, levelTag: '1 ур.' },
      ],
      inventory: ['Священный символ', 'Кольчуга', 'Булава'],
    };
  }
  if (nm === 'маг') {
    return {
      spells: [
        { id: 'fire-bolt', name: 'Огненный снаряд', school: '—', level: 0, levelTag: 'Заговор' },
        { id: 'shield', name: 'Щит', school: '—', level: 1, levelTag: '1 ур.' },
      ],
      inventory: ['Посох', 'Роба', 'Книга заклинаний'],
    };
  }
  if (nm === 'воин') {
    return {
      spells: [],
      inventory: ['Длинный меч', 'Щит', 'Тяжёлый доспех'],
    };
  }
  return null;
}


const STARTING_INVENTORY_BY_CLASS_ID = {
  wizard: ['Посох', 'Книга заклинаний', 'Компонентная сумка'],
  sorcerer: ['Кинжал', 'Мешочек с компонентами', 'Лёгкий арбалет', 'Набор путешественника'],
  warlock: ['Кожаный доспех', 'Кинжал', 'Мешочек с компонентами', 'Набор учёного'],
  bard: ['Рапира', 'Лютня', 'Кожаный доспех', 'Набор артиста'],
  cleric: ['Кольчуга', 'Булава', 'Щит', 'Священный символ', 'Набор жреца'],
  druid: ['Кожаный доспех', 'Щит', 'Дубинка', 'Фокус друида', 'Набор исследователя'],
  fighter: ['Кольчуга', 'Длинный меч', 'Щит', 'Набор путешественника'],
  monk: ['Короткий меч', 'Дартс (10)', 'Набор путешественника', 'Взломщикские инструменты'],
  paladin: ['Кольчуга', 'Длинный меч', 'Щит', 'Набор путешественника'],
  rogue: ['Кожаный доспех', 'Кинжал', 'Кинжал', 'Набор взломщика'],
  artificer: ['Кожаный доспех', 'Молот', 'Воровские инструменты', 'Набор изобретателя'],
  ranger: ['Кожаный доспех', 'Длинный лук', 'Колчан со стрелами (20)', 'Набор путешественника'],
};

export function deriveDefaultInventory(classId, className) {
  const hardcoded = deriveHardcodedRuStartContent(className);
  if (hardcoded?.inventory?.length) return [...hardcoded.inventory];
  const cid = resolveCharacterClassId(classId, className);
  if (cid && STARTING_INVENTORY_BY_CLASS_ID[cid]) return [...STARTING_INVENTORY_BY_CLASS_ID[cid]];
  return ['Кожаный доспех', 'Кинжал', 'Набор путешественника'];
}

function skillBonusOverrides(character) {
  const raw = character.skillOverrides;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw;
}



export function buildDefaultSkillOverrideMap(character) {
  const rows = buildSkillRows({ ...character, skillOverrides: null });
  const out = {};
  for (const r of rows) {
    out[r.id] = r.value;
  }
  return out;
}

export function buildSkillRows(character) {
  if (!character || typeof character !== 'object') {
    character = { attributes: {}, level: 1, classId: '', className: '', skillOverrides: null };
  }
  const attrs = character.attributes || {};
  const level = Number(character.level) || 1;
  const pb = proficiencyBonus(level);
  const cid = resolveCharacterClassId(character.classId, character.className);
  const focus = new Set(
    CLASS_SKILL_FOCUS[cid] || CLASS_SKILL_FOCUS[character.classId] || ['perception', 'insight', 'athletics']
  );
  const overrides = skillBonusOverrides(character);

  return SKILL_DEFINITIONS.map((def) => {
    const mod = abilityModifier(attrs[def.ability] ?? 10);
    const proficient = focus.has(def.id);
    const ov = overrides && overrides[def.id];
    const total =
      typeof ov === 'number' && Number.isFinite(ov) ? Math.trunc(ov) : mod + (proficient ? pb : 0);
    return {
      id: def.id,
      name: def.name,
      bonus: formatModifier(total),
      value: total,
      highlighted: proficient,
    };
  }).sort((a, b) => {
    if (a.highlighted !== b.highlighted) return a.highlighted ? -1 : 1;
    return b.value - a.value;
  });
}

export function normalizePortraitUrl(character) {
  return character.portraitUrl || character.portraitImage || '';
}

export function displayRaceClass(character) {
  const race = character.race || '—';
  const cls = character.className || character.class || '—';
  return `${race} · ${cls}`;
}
