/** Русские названия навыков D&D 5e для PDF и экспорта */
export const SKILL_LABELS_RU = {
  athletics: 'Атлетика',
  acrobatics: 'Акробатика',
  sleight_of_hand: 'Ловкость рук',
  stealth: 'Скрытность',
  arcana: 'Магия',
  history: 'История',
  investigation: 'Анализ',
  nature: 'Природа',
  religion: 'Религия',
  animal_handling: 'Уход за животными',
  insight: 'Проницательность',
  medicine: 'Медицина',
  perception: 'Внимание',
  survival: 'Выживание',
  deception: 'Обман',
  intimidation: 'Запугивание',
  performance: 'Выступление',
  persuasion: 'Убеждение',
};

const SKILL_LABEL_BY_ID = new Map(
  Object.entries(SKILL_LABELS_RU).map(([id, label]) => [id, label])
);

export function formatSkillKeyFallback(key) {
  const s = String(key || '')
    .trim()
    .replace(/_/g, ' ');
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function skillLabelRu(key) {
  const id = String(key || '')
    .trim()
    .toLowerCase();
  if (!id) return '';
  if (SKILL_LABEL_BY_ID.has(id)) return SKILL_LABEL_BY_ID.get(id);
  return formatSkillKeyFallback(id);
}

function formatSkillBonus(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= 0 ? `+${value}` : String(value);
  }
  const s = String(value).trim();
  if (!s) return '';
  if (/^[+-]?\d+$/.test(s)) {
    return s.startsWith('+') || s.startsWith('-') ? s : `+${s}`;
  }
  return s;
}

function formatSkillLine(key, value) {
  const label = skillLabelRu(key);
  const bonus = formatSkillBonus(value);
  return bonus ? `${label}: ${bonus}` : label;
}

function parseSkillStringLine(line) {
  const raw = String(line || '').trim();
  if (!raw) return '';
  const colon = raw.indexOf(':');
  if (colon === -1) {
    return skillLabelRu(raw);
  }
  const keyPart = raw.slice(0, colon).trim();
  const valuePart = raw.slice(colon + 1).trim();
  return formatSkillLine(keyPart, valuePart);
}

const CLASS_NAME_TO_ID = {
  бард: 'bard',
  жрец: 'cleric',
  колдун: 'warlock',
  друид: 'druid',
  боец: 'fighter',
  волшебник: 'wizard',
  изобретатель: 'artificer',
  монах: 'monk',
  паладин: 'paladin',
  плут: 'rogue',
  чародей: 'sorcerer',
  bard: 'bard',
  cleric: 'cleric',
  warlock: 'warlock',
  druid: 'druid',
  fighter: 'fighter',
  wizard: 'wizard',
  artificer: 'artificer',
  monk: 'monk',
  paladin: 'paladin',
  rogue: 'rogue',
  sorcerer: 'sorcerer',
};

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
};

const SKILL_DEFINITIONS = [
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

function abilityModifier(score) {
  const n = Number(score);
  if (Number.isNaN(n)) return 0;
  return Math.floor((n - 10) / 2);
}

function formatModifier(mod) {
  if (mod >= 0) return `+${mod}`;
  return String(mod);
}

function proficiencyBonus(level) {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
}

function resolveClassId(character) {
  if (character.classId && typeof character.classId === 'string') {
    const id = character.classId.trim().toLowerCase();
    if (CLASS_SKILL_FOCUS[id]) return id;
  }
  const cn = String(character.className || '')
    .trim()
    .toLowerCase();
  return CLASS_NAME_TO_ID[cn] || '';
}

function linesFromStructuredSkills(raw) {
  const lines = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item == null) continue;
      if (typeof item === 'string') {
        const s = item.trim();
        if (s) lines.push(parseSkillStringLine(s));
        continue;
      }
      if (typeof item === 'object') {
        if (item.id != null && String(item.id).trim()) {
          const bonus =
            item.bonus != null
              ? item.bonus
              : item.value != null
                ? item.value
                : item.modifier != null
                  ? item.modifier
                  : '';
          lines.push(formatSkillLine(item.id, bonus));
        } else if (typeof item.name === 'string' || typeof item.name === 'number') {
          const nameKey = String(item.name).trim();
          const bonus =
            item.bonus != null
              ? item.bonus
              : item.value != null
                ? item.value
                : '';
          lines.push(formatSkillLine(nameKey, bonus));
        } else {
          for (const [k, v] of Object.entries(item)) {
            if (k === 'id' || k === 'name' || k === 'bonus' || k === 'value' || k === 'modifier') {
              continue;
            }
            lines.push(formatSkillLine(k, v));
          }
        }
      }
    }
    return lines;
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw)) {
      lines.push(formatSkillLine(k, v));
    }
  }
  return lines;
}

function deriveSkillLinesFromSheet(character) {
  const attrs = character.attributes || character.attributesJson || {};
  if (!attrs || typeof attrs !== 'object' || Array.isArray(attrs)) return [];
  const level = Number(character.level) || 1;
  const pb = proficiencyBonus(level);
  const classId = resolveClassId(character);
  const focus = new Set(CLASS_SKILL_FOCUS[classId] || ['perception', 'insight', 'athletics']);

  const rows = SKILL_DEFINITIONS.map((def) => {
    const mod = abilityModifier(attrs[def.ability] ?? 10);
    const proficient = focus.has(def.id);
    const total = mod + (proficient ? pb : 0);
    return {
      name: def.name,
      bonus: formatModifier(total),
      value: total,
      highlighted: proficient,
    };
  }).sort((a, b) => {
    if (a.highlighted !== b.highlighted) return a.highlighted ? -1 : 1;
    return b.value - a.value;
  });

  return rows.map((r) => `${r.name}: ${r.bonus}`);
}


export function normalizeSkillsForPdf(character) {
  let raw = character.skills ?? character.skillsJson;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) raw = null;
    else {
      try {
        raw = JSON.parse(t);
      } catch {
        return [t];
      }
    }
  }

  let lines = linesFromStructuredSkills(raw);

  if (!lines.length) {
    lines = deriveSkillLinesFromSheet(character);
  }

  return lines;
}
