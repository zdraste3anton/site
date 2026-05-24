

import { SPELLS } from '../data/spellsData.js';

const NOT_APPLICABLE = 'нет';


export function normalizeNameKey(name) {
  return String(name ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function findSeedSpell(spell) {
  if (!spell || typeof spell !== 'object') return null;
  const id = String(spell.id || '').trim();
  if (id) {
    const byId = SPELLS.find((s) => s.id === id);
    if (byId) return byId;
  }
  const nk = normalizeNameKey(spell.name);
  if (nk) {
    const byName = SPELLS.find((s) => normalizeNameKey(s.name) === nk);
    if (byName) return byName;
  }
  return null;
}


export function spellShapeForMechanics(raw) {
  if (raw == null) {
    return { id: '', name: '', level: 0, schools: [], description: '' };
  }
  if (typeof raw === 'string') {
    return spellShapeForMechanics({ name: String(raw).trim() });
  }

  const seed = findSeedSpell(raw);
  const name = String(raw.name || seed?.name || '').trim();

  let schools = [];
  if (Array.isArray(raw.schools) && raw.schools.length) {
    schools = raw.schools.map((x) => String(x).trim()).filter(Boolean);
  } else if (raw.school) {
    schools = [String(raw.school).trim()].filter(Boolean);
  } else if (seed?.schools?.length) {
    schools = [...seed.schools];
  }

  const tj = raw.tagsJson;
  if (tj && typeof tj === 'object' && !Array.isArray(tj) && Array.isArray(tj.schools)) {
    const fromTags = tj.schools.map((x) => String(x).trim()).filter(Boolean);
    if (fromTags.length) schools = fromTags;
  }

  let level = raw.level;
  if (level == null || !Number.isFinite(Number(level))) {
    level = seed != null ? seed.level : 0;
  } else {
    level = Number(level);
  }

  const id = String(raw.id || '').trim() || (seed ? seed.id : '');
  const description = String(raw.description || raw.desc || raw.text || seed?.description || '').trim();

  return {
    ...raw,
    id,
    name,
    schools,
    level,
    description,
  };
}


export function schoolDisplayFromSpell(spell) {
  const schools = Array.isArray(spell?.schools) ? spell.schools : [];
  if (schools.length >= 2) return String(schools[1] || '').trim();
  return String(schools[0] || spell?.school || '').trim();
}

export function levelLabelFromSpell(spell) {
  const lv = Number(spell?.level) || 0;
  return lv === 0 ? 'Заговор' : `${lv} уровень`;
}


const SPELL_PRESETS = {
  'vicious-mockery': {
    dice: '1d4',
    mechanicType: 'урон',
    damageType: 'психический урон',
    savingThrow: 'Мудрости',
    range: '60 футов',
    duration: 'мгновенно',
    effect: 'Психический урон и помеха на следующую атаку цели.',
  },
  'minor-illusion': {
    dice: 'не требуются',
    mechanicType: 'иллюзия',
    damageType: 'нет',
    savingThrow: 'нет',
    range: '30 футов',
    duration: '1 минута',
    effect: 'Создаёт звук или неподвижное изображение для отвлечения и маскировки.',
  },
  'acid-splash': {
    dice: '1d6',
    mechanicType: 'урон',
    damageType: 'кислотный урон',
    savingThrow: 'Ловкости',
    range: '60 футов',
    duration: 'мгновенно',
    effect: 'Кислота по одной или двум целям в пределах дистанции.',
  },
  'fire-bolt': {
    dice: '1d10',
    mechanicType: 'урон',
    damageType: 'огненный урон',
    savingThrow: 'нет',
    range: '120 футов',
    duration: 'мгновенно',
    effect: 'Бросок огненной искры по существу или предмету.',
  },
  thunderwave: {
    dice: '2d8',
    mechanicType: 'урон',
    damageType: 'урон громом',
    savingThrow: 'Телосложения',
    range: 'область вокруг вас (куб 15 футов)',
    duration: 'мгновенно',
    effect: 'Волна силы отталкивает существ и предметы вокруг вас.',
  },
  'cure-wounds': {
    dice: '1d8 + модификатор',
    mechanicType: 'лечение',
    damageType: 'нет',
    savingThrow: 'нет',
    range: 'касание',
    duration: 'мгновенно',
    effect: 'Восстанавливает хиты существу при касании.',
  },
  'mage-hand': {
    dice: 'не требуются',
    mechanicType: 'утилитарное',
    damageType: 'нет',
    savingThrow: 'нет',
    range: '30 футов',
    duration: '1 минута',
    effect: 'Невидимая рука двигает лёгкие предметы на расстоянии.',
  },
  light: {
    dice: 'не требуются',
    mechanicType: 'утилитарное',
    damageType: 'нет',
    savingThrow: 'нет',
    range: 'касание',
    duration: '1 час',
    effect: 'Предмет излучает яркий или тусклый свет по вашему выбору.',
  },
  'blade-ward': {
    dice: 'не требуются',
    mechanicType: 'защита',
    damageType: 'нет',
    savingThrow: 'нет',
    range: 'на себя',
    duration: '1 раунд',
    effect: 'До конца хода — сопротивление рубящему, колющему и дробящему урону.',
  },
  fireball: {
    dice: '8d6',
    mechanicType: 'урон',
    damageType: 'огненный урон',
    savingThrow: 'Ловкости',
    range: '150 футов (сфера 20 футов)',
    duration: 'мгновенно',
    effect: 'Взрыв огня в радиусе; урон частично снижается при успешном спасброске.',
  },
  shield: {
    dice: 'не требуются',
    mechanicType: 'защита',
    damageType: 'нет',
    savingThrow: 'нет',
    range: 'на себя',
    duration: '1 раунд',
    effect: 'Реакция: +5 к КД до начала вашего следующего хода.',
  },
  'eldritch-blast': {
    dice: '1d10',
    mechanicType: 'урон',
    damageType: 'силовой урон',
    savingThrow: 'нет',
    range: '120 футов',
    duration: 'мгновенно',
    effect: 'Сгусток силы поражает цель; при высоком уровне — несколько лучей.',
  },
  'magic-missile': {
    dice: '1d4 + 1 за снаряд',
    mechanicType: 'урон',
    damageType: 'силовой урон',
    savingThrow: 'нет',
    range: '120 футов',
    duration: 'мгновенно',
    effect: 'Три магических снаряда попадают автоматически по выбранным целям.',
  },
  hex: {
    dice: 'доп. 1d6 некротический урон при попадании',
    mechanicType: 'проклятие, урон',
    damageType: 'некротический урон (дополнительно)',
    savingThrow: 'нет',
    range: '90 футов',
    duration: 'концентрация, до 1 часа',
    effect:
      'Выберите характеристику: помеха на проверки с её участием; ваши атаки по цели наносят дополнительный некротический урон.',
  },
  'armour-of-agathys': {
    dice: '5 временных хитов; 5 урона холодом атакующему (ячейка 1 уровня; сильнее на высших)',
    mechanicType: 'защита, урон',
    damageType: 'холод',
    savingThrow: 'нет',
    range: 'на себя',
    duration: '1 час',
    effect: 'Временные хиты; существо, ранившее вас в ближнем бою, получает урон холодом.',
  },
  'booming-blade': {
    dice: '1d8 (+ урон оружия при совмещении с атакой)',
    mechanicType: 'урон',
    damageType: 'урон громом при добровольном движении цели',
    savingThrow: 'нет',
    range: 'касание',
    duration: 'до конца вашего следующего хода',
    effect: 'Вместе с атакой рукопашным оружием: если цель добровольно двигается до конца вашего следующего хода, она получает звуковой урон.',
  },
  'green-flame-blade': {
    dice: '1d8 (+ урон оружия при совмещении с атакой)',
    mechanicType: 'урон',
    damageType: 'огненный урон по второй цели',
    savingThrow: 'нет',
    range: 'касание',
    duration: 'мгновенно',
    effect: 'Удар по одной цели ранит другую сущность в пределах 5 футов от неё магическим пламенем.',
  },
};

function str(v) {
  if (v == null) return '';
  return String(v).trim();
}

function inferDamageTag(schoolFirst, desc, id) {
  const t = `${schoolFirst} ${desc}`.toLowerCase();
  if (id === 'thunderwave' || /гром|звук/i.test(t)) return 'урон громом';
  if (/огн|плам/i.test(t) || id === 'fire-bolt' || id === 'fireball') return 'огненный урон';
  if (/кислот/i.test(t)) return 'кислотный урон';
  if (/холод|льд|мороз/i.test(t)) return 'холод';
  if (/молн/i.test(t)) return 'молния';
  if (/некрот|necr/i.test(t)) return 'некротический';
  if (/свет|радиант|radiant/i.test(t)) return 'сияние';
  if (/психическ|mockery/i.test(id + t)) return 'психический урон';
  if (/дробящ|урон силой/i.test(t)) return 'дробящий';
  return 'магический';
}

function inferDice(level, id, desc, mechanicType) {
  if (mechanicType === 'лечение') {
    return level <= 1 ? '1d8 + модификатор' : 'зависит от уровня ячейки';
  }
  if (mechanicType !== 'урон') {
    return level === 0 ? 'не требуются' : 'зависит от заклинания';
  }
  if (level === 0) {
    const cantrip = {
      'fire-bolt': '1d10',
      'acid-splash': '1d6',
      'vicious-mockery': '1d4',
      'eldritch-blast': '1d10',
      'sacred-flame': '1d8',
      'green-flame-blade': '1d8',
      'booming-blade': '1d8',
      'thorn-whip': '1d6',
    };
    return cantrip[id] || '1d8';
  }
  if (id === 'fireball') return '8d6';
  if (id === 'lightning-bolt') return '8d6';
  if (id === 'thunderwave') return '2d8';
  if (/8d6|6d6|10d6/i.test(desc)) return RegExp.lastMatch || 'зависит от ячейки';
  return 'зависит от уровня ячейки';
}

function inferFromDescription(spell) {
  const id = String(spell?.id || '');
  const lv = Number(spell?.level) || 0;
  const name = String(spell?.name || '');
  const d = String(spell?.description || '');
  const text = `${name} ${d}`;
  const schools = Array.isArray(spell?.schools) ? spell.schools : [];
  const schoolFirst = String(schools[0] || '');
  const school = schoolDisplayFromSpell(spell);
  const levelLabel = levelLabelFromSpell(spell);

  let range = '60 футов';
  if (/120\s*фут|36\s*м/i.test(d)) range = '120 футов';
  if (/30\s*фут/i.test(d)) range = '30 футов';
  if (/90\s*фут/i.test(d)) range = '90 футов';
  if (/150\s*фут|300\s*фут/i.test(d)) range = '150 футов';
  if (/касани/i.test(d)) range = 'касание';
  if (/на\s+себ|само|вокруг вас|вокруг персонажа|куб.*15|15\s*фут/i.test(d)) range = 'на себя / 15 футов';
  if (id === 'dimension-door' || /телепорт/i.test(name)) range = '500 футов';

  let duration = 'мгновенно';
  if (/концентрац/i.test(d)) duration = 'концентрация, до 1 минуты (см. текст)';
  else if (/1\s*час|один час/i.test(d)) duration = '1 час';
  else if (/8\s*час/i.test(d)) duration = '8 часов';
  else if (/10\s*минут/i.test(d)) duration = '10 минут';
  else if (/1\s*минут/i.test(d)) duration = '1 минута';
  else if (/раунд|до конца (вашего )?хода|1\s*раунд/i.test(d)) duration = '1 раунд';
  else if (/пока активно|пока не/i.test(d)) duration = 'пока активно (см. текст)';

  let savingThrow = NOT_APPLICABLE;
  if (/спасбросок.*Мудрост|Мудрост.*спас/i.test(d)) savingThrow = 'Мудрости';
  else if (/Телосложен/i.test(d)) savingThrow = 'Телосложения';
  else if (/Ловкост/i.test(d)) savingThrow = 'Ловкости';
  else if (/Харизм/i.test(d)) savingThrow = 'Харизмы';
  else if (/Сил[аы]\b/i.test(d)) savingThrow = 'Силы';
  else if (/Интеллект/i.test(d)) savingThrow = 'Интеллекта';

  let mechanicType = 'утилитарное';
  let damageType = NOT_APPLICABLE;

  if (/леч|исцел|восстан.*хит|восстанавлив.*хит|хиты существу/i.test(text)) {
    mechanicType = 'лечение';
  } else if (/урон|поража|ранит|взрыв|плам|мет.*огн|кислот|молн|холод|психическ|дробящ|луч|снаряд|стрел|конус|волна|облако|разряд/i.test(text)) {
    mechanicType = 'урон';
    damageType = inferDamageTag(schoolFirst, d, id);
  } else if (/иллюз|узор|невидим|звук или|фантом/i.test(text)) {
    mechanicType = 'иллюзия';
  } else if (/огражд|защит|щит|КД|сопротивлен|барьер|неуязвим/i.test(text)) {
    mechanicType = 'защита';
  } else if (/парализ|удерж|сон|очар|ослеп|медлен|преимущество к|помех/i.test(text)) {
    mechanicType = 'контроль';
  } else if (/бонус.*спас|благослов|усиливает|аура|навыд/i.test(text)) {
    mechanicType = 'бафф';
  }

  const dice = inferDice(lv, id, d, mechanicType);

  const effect = d
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)[0]
    .trim()
    .slice(0, 120);
  const effectOut = effect ? (effect.length >= 118 ? `${effect}…` : effect) : 'См. полное описание заклинания.';

  return {
    levelLabel,
    school: school || '',
    dice,
    mechanicType,
    damageType,
    savingThrow,
    range,
    duration,
    effect: effectOut,
  };
}

function cleanMeaningful(v) {
  const t = str(v);
  if (!t) return '';
  if (t === '—' || t === '–' || t === '-') return '';
  return t;
}


function mergePreferNonEmpty(base, patch) {
  const out = { ...base };
  for (const k of Object.keys(patch)) {
    const t = cleanMeaningful(patch[k]);
    if (t) out[k] = t;
  }
  return out;
}


export function normalizeSpellMechanics(rawSpell) {
  const spell = spellShapeForMechanics(rawSpell);
  const inferred = inferFromDescription(spell);
  const preset = SPELL_PRESETS[String(spell?.id || '')] || null;

  const raw =
    spell?.mechanics && typeof spell.mechanics === 'object' && !Array.isArray(spell.mechanics)
      ? spell.mechanics
      : spell?.mechanicsJson && typeof spell.mechanicsJson === 'object' && !Array.isArray(spell.mechanicsJson)
        ? spell.mechanicsJson
        : null;

  const fromApi = raw
    ? {
        levelLabel: str(raw.levelLabel),
        school: str(raw.school),
        dice: str(raw.dice ?? raw.diceFormula),
        mechanicType: str(raw.mechanicType ?? raw.type),
        damageType: str(raw.damageType),
        savingThrow: str(raw.savingThrow ?? raw.save),
        range: str(raw.range),
        duration: str(raw.duration),
        effect: str(raw.effect),
      }
    : {};

  let out = { ...inferred };
  if (preset) out = mergePreferNonEmpty(out, preset);
  out = mergePreferNonEmpty(out, fromApi);

  out.levelLabel = out.levelLabel || levelLabelFromSpell(spell);
  out.school = cleanMeaningful(out.school) || schoolDisplayFromSpell(spell) || 'не указана';
  out.dice = out.dice || (Number(spell?.level) === 0 ? 'не требуются' : 'зависит от ячейки');
  out.mechanicType = out.mechanicType || 'утилитарное';
  out.damageType = out.damageType && out.damageType !== '' ? out.damageType : NOT_APPLICABLE;
  out.savingThrow = out.savingThrow && out.savingThrow !== '' ? out.savingThrow : NOT_APPLICABLE;
  out.range = out.range || '60 футов';
  out.duration = out.duration || 'мгновенно';
  out.effect = out.effect || inferred.effect;

  return out;
}


export function spellCollapsedTypeLabel(mech) {
  if (!mech) return '';
  const dmg = String(mech.damageType || '').trim();
  const mtype = String(mech.mechanicType || '').trim();
  const dmgOk = dmg && dmg !== NOT_APPLICABLE && dmg !== 'нет';
  if (dmgOk && mtype === 'урон') return dmg;
  return mtype || (dmgOk ? dmg : '');
}
