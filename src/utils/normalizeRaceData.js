

const STAT_MAP = {
  STR: 'Сила',
  DEX: 'Ловкость',
  CON: 'Телосложение',
  INT: 'Интеллект',
  WIS: 'Мудрость',
  CHA: 'Харизма',
};

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

function asObject(value) {
  if (value == null) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  }
  return {};
}

function asStringArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
    return value
      .split(/[\n;]|(?:\s*•\s*)/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}


function isLikelyStatBonusTag(tag) {
  const t = String(tag).trim();
  if (!t) return false;
  if (/^\+\d+\s/i.test(t)) return true;
  if (/^\+\d+\s*к\s/i.test(t)) return true;
  if (/\+1\s+ко\s+всем/i.test(t)) return true;
  return false;
}

function bonusLineFromTag(tag) {
  const t = String(tag).trim();
  if (/^\+\d+\s*ко\s*всем/i.test(t)) return t;
  if (/^\+\d+\s*к\s/i.test(t)) return t;
  const m = t.match(/^\+(\d+)\s+(.+)$/i);
  if (m) return `${m[2].trim()} +${m[1]}`;
  return t;
}


function prettyStatName(raw) {
  const t = String(raw ?? '').trim();
  if (!t) return t;
  const up = t.toUpperCase();
  if (STAT_MAP[up]) return STAT_MAP[up];
  const lower = t.toLowerCase();
  for (const ru of Object.values(STAT_MAP)) {
    if (ru.toLowerCase() === lower) return ru;
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function statLabelFromAbilityKey(key) {
  const raw = String(key ?? '').trim();
  if (!raw) return raw;
  const ku = raw.toUpperCase();
  if (STAT_MAP[ku]) return STAT_MAP[ku];
  return prettyStatName(raw);
}

function bonusesFromObject(raw) {
  if (raw == null || raw === '') return [];
  if (typeof raw === 'string') {
    const p = safeJsonParse(raw);
    if (p) return bonusesFromObject(p);
    return [];
  }
  if (Array.isArray(raw)) {
    if (raw.length && typeof raw[0] === 'object' && raw[0] !== null) {
      const lines = [];
      for (const row of raw) {
        if (!row || typeof row !== 'object') continue;
        const pick = String(row.pick ?? row.mode ?? row.type ?? '').toLowerCase();
        if (pick.includes('two') && (pick.includes('abil') || pick.includes('stat') || pick.includes('plus'))) {
          const add = Number(row.amount ?? row.value ?? row.bonus ?? 1);
          const n = Number.isFinite(add) && add > 0 ? Math.floor(add) : 1;
          lines.push(`+${n} к двум характеристикам на выбор`);
          continue;
        }
        const st = row.stat ?? row.ability ?? row.name ?? row.key ?? row.id;
        const val = row.value ?? row.bonus ?? row.modifier;
        if (st == null || val == null) continue;
        const label = statLabelFromAbilityKey(String(st));
        const n = Number(val);
        if (!Number.isNaN(n) && n !== 0) {
          lines.push(`${label} ${n > 0 ? `+${n}` : `${n}`}`);
        }
      }
      return lines.filter(Boolean);
    }
    return raw.map((x) => (typeof x === 'string' ? bonusLineFromTag(x) : String(x))).filter(Boolean);
  }
  if (typeof raw !== 'object') return [];
  if (Array.isArray(raw.list)) {
    return bonusesFromObject(raw.list);
  }
  const lines = [];
  const FLEX_KEYS = new Set([
    'two_plus_1',
    'twoplus1',
    'two_abilities',
    'flex_two',
    'plus_one_two_abilities',
    'two_ability_bonus',
  ]);
  for (const [key, val] of Object.entries(raw)) {
    if (key === 'list') continue;
    const kLower = String(key).trim().toLowerCase();
    if (FLEX_KEYS.has(kLower)) {
      const add = Number(val);
      const n = Number.isFinite(add) && add > 0 ? Math.floor(add) : 1;
      lines.push(`+${n} к двум характеристикам на выбор`);
      continue;
    }
    const label = statLabelFromAbilityKey(key);
    const n = Number(val);
    if (!Number.isNaN(n) && n !== 0) {
      lines.push(`${label} ${n > 0 ? `+${n}` : `${n}`}`);
    }
  }
  return lines;
}


function humanizeSpecialBonus(raw) {
  const t = String(raw ?? '').trim();
  const two = t.match(/^\+(\d+)\s*к\s*двум/i);
  if (two) {
    return `+${two[1]} к двум характеристикам на выбор`;
  }
  const all = t.match(/^\+(\d+)\s*ко\s*всем/i);
  if (all) {
    return `Все характеристики +${all[1]}`;
  }
  return t;
}

function isStatBonusLine(s) {
  return /^.+?\s+\+\d+\s*$/.test(String(s).trim());
}

function isFlexibleTwoReadable(s) {
  return /к\s+двум характеристикам на выбор/i.test(String(s));
}

function isAllStatsReadable(s) {
  return /^все характеристики\s*\+\d+$/i.test(String(s).trim());
}


function buildPreviewBadges(bonuses) {
  if (!bonuses.length) return [];
  if (bonuses.length === 1 && isAllStatsReadable(bonuses[0])) {
    const m = bonuses[0].match(/\+(\d+)\s*$/);
    return [`Все хар. +${m ? m[1] : 1}`];
  }
  const statLines = bonuses.filter(isStatBonusLine);
  const flex = bonuses.find(isFlexibleTwoReadable);
  if (statLines.length >= 1 && flex) {
    const n = flex.match(/^\+(\d+)/)?.[1] || '1';
    const abbrev = n === '1' ? 'ещё 2× +1' : `ещё 2× +${n}`;
    return [statLines[0], abbrev];
  }
  if (statLines.length >= 2) return statLines.slice(0, 2);
  if (statLines.length === 1) return [statLines[0]];
  if (flex) {
    const n = flex.match(/^\+(\d+)/)?.[1] || '1';
    return [n === '1' ? 'ещё 2× +1' : `ещё 2× +${n}`];
  }
  if (bonuses[0] && isAllStatsReadable(bonuses[0])) {
    const m = bonuses[0].match(/\+(\d+)\s*$/);
    return [`Все хар. +${m ? m[1] : 1}`];
  }
  return bonuses.slice(0, 2);
}


function toCanonicalBonusDisplay(line) {
  const s = String(line ?? '').trim();
  if (!s) return null;
  if (/^все характеристики\s*\+\d+$/i.test(s)) return s;
  if (/к\s+двум характеристикам на выбор/i.test(s)) return s;
  if (/^\+\d+\s*к\s/i.test(s) || /^\+\d+\s*ко\s*всем/i.test(s)) {
    return humanizeSpecialBonus(s);
  }
  const plusFirst = s.match(/^\+(\d+)\s+(.+)$/i);
  if (plusFirst) {
    const label = prettyStatName(plusFirst[2].trim());
    return `${label} +${plusFirst[1]}`;
  }
  const nameFirst = s.match(/^(.+?)\s*\+\s*(\d+)\s*$/i);
  if (nameFirst) {
    const label = prettyStatName(nameFirst[1].trim());
    return `${label} +${nameFirst[2]}`;
  }
  return s;
}


function semanticBonusKey(canonical) {
  const t = String(canonical).trim();
  if (/^все характеристики\s*\+\d+$/i.test(t)) {
    const m = t.match(/\+(\d+)\s*$/);
    return `all:${m ? m[1] : 1}`;
  }
  if (/к\s+двум характеристикам на выбор/i.test(t)) {
    const m = t.match(/^\+(\d+)/);
    return `twochoice:${m ? m[1] : 1}`;
  }
  const m = t.match(/^(.+?)\s+\+(\d+)\s*$/);
  if (m) {
    const base = prettyStatName(m[1]).toLowerCase();
    return `stat:${base}:${m[2]}`;
  }
  return `raw:${t.toLowerCase()}`;
}

function sortBonusesStatFirst(lines) {
  const stats = [];
  const other = [];
  for (const x of lines) {
    if (isStatBonusLine(x)) stats.push(x);
    else other.push(x);
  }
  return [...stats, ...other];
}


export function normalizeRaceBonusLines(race) {
  if (!race || typeof race !== 'object') return [];
  const traitsObj = asObject(race.traits);
  const tagBonuses = (Array.isArray(race.tags) ? race.tags : [])
    .filter(isLikelyStatBonusTag)
    .map((t) => bonusLineFromTag(String(t).trim()));

  const merged = mergeUnique(
    mergeUnique(bonusesFromObject(race.bonuses), bonusesFromObject(traitsObj.bonuses)),
    tagBonuses
  );

  const seen = new Set();
  const out = [];
  for (const line of merged) {
    const c = toCanonicalBonusDisplay(line);
    if (!c) continue;
    const k = semanticBonusKey(c);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return sortBonusesStatFirst(out);
}

function mergeUnique(a, b) {
  const out = [];
  const seen = new Set();
  for (const item of [...a, ...b]) {
    const k = String(item).trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}


function parseDifficultyRaw(raw) {
  const s = raw != null ? String(raw).trim().toLowerCase() : '';
  if (['low', 'низк', 'easy', '1'].includes(s) || s === 'низкая') return 'low';
  if (['high', 'высок', 'hard', '3'].includes(s) || s === 'высокая') return 'high';
  if (['medium', 'средн', '2'].includes(s) || s === 'средняя') return 'medium';
  return null;
}

const DIFFICULTY_LOW_IDS = new Set(['human', 'dwarf', 'variant-human']);

const DIFFICULTY_MEDIUM_IDS = new Set([
  'elf',
  'halfling',
  'tiefling',
  'dragonborn',
  'gnome',
  'centaur',
  'half-elf',
  'half-orc',
  'orc',
]);

const DIFFICULTY_HIGH_IDS = new Set([
  'kenku',
  'kobold',
  'triton',
  'goblin',
  'shifter',
  'tabaxi',
  'yuan-ti',
  'minotaur',
  'satyr',
]);


function inferDifficultyFromRace(raceId, name) {
  const rid = String(raceId || '')
    .toLowerCase()
    .trim();
  if (DIFFICULTY_LOW_IDS.has(rid)) return 'low';
  if (DIFFICULTY_HIGH_IDS.has(rid)) return 'high';
  if (DIFFICULTY_MEDIUM_IDS.has(rid)) return 'medium';

  const n = String(name || '').toLowerCase();
  if (/(?:^|[\s,])(человек|дворф|дварф)(?:[\s,]|$)/i.test(n) && !/полу/i.test(n)) return 'low';
  if (/полурослик/i.test(n)) return 'medium';
  if (/(юань|кенку|кобольд|гоблин|тритон|шифтер|табакси|минотавр|сатир)/i.test(n)) return 'high';
  if (/(эльф|гном|тифлинг|драконорожд)/i.test(n)) return 'medium';
  if (/полуэльф|полуорк|орк|кентавр/i.test(n)) return 'medium';

  return 'medium';
}

function resolveDifficulty(rawFromApi, raceId, name) {
  const explicit = parseDifficultyRaw(rawFromApi);
  if (explicit) return explicit;
  return inferDifficultyFromRace(raceId, name);
}

function difficultyMeta(level) {
  if (level === 'low') {
    return {
      key: 'low',
      stars: '⭐',
      label: 'Низкая',
      hint: 'Простые бонусы и мало исключений — удобно для первого персонажа.',
    };
  }
  if (level === 'high') {
    return {
      key: 'high',
      stars: '⭐⭐⭐',
      label: 'Высокая',
      hint: 'Больше особых правил и нюансов — стоит внимательно прочитать все пункты.',
    };
  }
  return {
    key: 'medium',
    stars: '⭐⭐',
    label: 'Средняя',
    hint: 'Типичный уровень вариантов: выразительно, но без перегруза.',
  };
}

function firstSentence(text) {
  const t = String(text ?? '').trim();
  if (!t) return '';
  const cut = t.split(/(?<=[.!?])\s+/)[0];
  if (cut && cut.length <= 140) return cut;
  return t.length > 120 ? `${t.slice(0, 117)}…` : t;
}

function inferPlayStyle(race, tagsText) {
  const name = race?.name ? String(race.name) : 'Раса';
  const low = tagsText.toLowerCase();
  if (/ловк|скрыт|когт|тень|украд|бесшум/i.test(low)) {
    return `${name}: подходит для скрытных и мобильных персонажей.`;
  }
  if (/харизм|обая|музык|обман|выступ/i.test(low)) {
    return `${name}: сильна в социальных столкновениях и обаянии.`;
  }
  if (/сил|удар|воин|рог|заряд|ярост|темн.*зрен/i.test(low)) {
    return `${name}: уверенно чувствует себя в ближнем бою и выживании.`;
  }
  if (/интеллект|маг|изобрет|фей|аркан/i.test(low)) {
    return `${name}: хороший выбор для знаний и арканной гибкости.`;
  }
  return `${name}: универсальная основа — механика подчёркивает ваши решения за столом.`;
}


export function normalizeRaceData(race) {
  const empty = {
    id: '',
    name: 'Без названия',
    description: '',
    icon: null,
    accent: 'orange',
    bonuses: [],
    hasExplicitBonuses: false,
    traits: [],
    recommendedClasses: [],
    difficulty: 'medium',
    difficultyLabel: 'Средняя',
    difficultyStars: '⭐⭐',
    difficultyHint: '',
    playStyle: '',
    previewBadges: [],
    summaryLine: '',
  };

  if (!race || typeof race !== 'object') return empty;

  const id = String(race.id ?? '');
  const name = String(race.name ?? 'Без названия').trim() || 'Без названия';
  const description = String(race.description ?? '');
  const accent = String(race.accent ?? 'orange').trim() || 'orange';
  const tags = Array.isArray(race.tags) ? race.tags.map((t) => String(t).trim()).filter(Boolean) : [];

  const traitsObj = asObject(race.traits);
  const fromTraitsObj = asStringArray(
    traitsObj.racialTraits ??
      traitsObj.traits ??
      traitsObj.features ??
      traitsObj.list ??
      traitsObj.items
  );

  const bonuses = normalizeRaceBonusLines(race);
  const bonusTags = tags.filter(isLikelyStatBonusTag);
  const hasStructuredBonuses =
    bonusesFromObject(race.bonuses).length > 0 ||
    bonusesFromObject(traitsObj.bonuses).length > 0 ||
    bonusTags.length > 0;
  const hasExplicitBonuses = bonuses.length > 0;

  const traitFromTags = tags.filter((t) => !isLikelyStatBonusTag(t));
  let traits = mergeUnique(fromTraitsObj, traitFromTags).slice(0, 8);

  if (!traits.length && tags.length && !hasStructuredBonuses) {
    traits = tags.slice(0, 4);
  }

  traits = traits.slice(0, 4);

  let recommendedClasses = asStringArray(
    race.recommendedClasses ?? traitsObj.recommendedClasses ?? traitsObj.classes ?? race.recommended ?? []
  );
  recommendedClasses = recommendedClasses.slice(0, 8);

  const diffRaw = race.difficulty ?? traitsObj.difficulty;
  const difficulty = resolveDifficulty(diffRaw, id, name);
  const {
    label: difficultyLabel,
    stars: difficultyStars,
    hint: difficultyHint,
  } = difficultyMeta(difficulty);

  const playStyleRaw =
    race.playStyle ?? traitsObj.playStyle ?? traitsObj.style ?? traitsObj.gameplayHint ?? '';
  const playStyle =
    String(playStyleRaw).trim() ||
    inferPlayStyle({ ...race, name }, [...tags, ...traits].join(' '));

  const previewBadges = bonuses.length > 0 ? buildPreviewBadges(bonuses) : tags.filter((t) => !isLikelyStatBonusTag(t)).slice(0, 2);

  const summaryLine = firstSentence(description);

  return {
    id,
    name,
    description,
    icon: race.icon,
    accent,
    bonuses,
    hasExplicitBonuses,
    traits,
    recommendedClasses,
    difficulty,
    difficultyLabel,
    difficultyStars,
    difficultyHint,
    playStyle,
    previewBadges,
    summaryLine,
  };
}
