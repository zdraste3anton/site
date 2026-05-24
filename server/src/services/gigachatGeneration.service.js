import { ApiError } from '../utils/apiError.js';
import { gigachatChatCompletions } from './gigachatService.js';

const STANDARD_SORTED = [15, 14, 13, 12, 10, 8];

const FALLBACK_ATTRIBUTES = {
  str: 15,
  dex: 14,
  con: 13,
  int: 12,
  wis: 10,
  cha: 8,
};


function extractJsonObjectString(content) {
  let s = String(content || '').trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/m, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return s.slice(start, end + 1);
}

function tryParseJsonObject(content) {
  const slice = extractJsonObjectString(content);
  if (!slice) return null;
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

function coerceNumericAttributes(attrs) {
  if (!attrs || typeof attrs !== 'object') return null;
  const required = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const out = {};
  for (const k of required) {
    const v = attrs[k];
    const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
    if (typeof n !== 'number' || !Number.isFinite(n)) return null;
    out[k] = n;
  }
  return out;
}

function validateStandardAttributes(attrs) {
  const coerced = coerceNumericAttributes(attrs);
  if (!coerced) return false;
  const required = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const values = required.map((k) => coerced[k]);
  const sorted = [...values].sort((a, b) => b - a);
  const expected = [...STANDARD_SORTED].sort((a, b) => b - a);
  return sorted.every((v, i) => v === expected[i]);
}

function fallbackAttributesResponse(reason) {
  return {
    attributes: { ...FALLBACK_ATTRIBUTES },
    explanation: `Применён стандартный набор 15–8 (${reason}). Поправьте значения вручную при необходимости.`,
    archetype: null,
  };
}


function genderRuNarrationHint(gender) {
  const g = String(gender || 'unknown').trim().toLowerCase();
  if (g === 'male') {
    return 'Пол героя: мужской. Пиши биографию в мужском роде (он, его, был, пошёл).';
  }
  if (g === 'female') {
    return 'Пол героя: женский. Пиши биографию в женском роде (она, её, была, пошла).';
  }
  return 'Пол героя не указан: по возможности нейтральные формулировки без жёсткой привязки к «он/она», пока не задано явное имя.';
}


function genderArchetypeHint(gender) {
  const g = String(gender || 'unknown').trim().toLowerCase();
  if (g === 'male') {
    return 'Пол персонажа: мужской — поля explanation и archetype согласуй по мужскому роду.';
  }
  if (g === 'female') {
    return 'Пол персонажа: женский — поля explanation и archetype согласуй по женскому роду.';
  }
  return 'Пол персонажа не указан — explanation и archetype формулируй в нейтральном роде, где возможно.';
}

export async function generateAttributes({ race, className, playStylePrompt, messages, gender }) {
  console.log('[AI] generating attributes');
  const system = `Ты помощник по D&D 5e. Пользователь выбрал расу и класс и может описать стиль игры.
Нужно распределить СТАНДАРТНЫЙ НАБОР значений ровно один раз: 15, 14, 13, 12, 10, 8 по характеристикам STR, DEX, CON, INT, WIS, CHA.
Ответь ТОЛЬКО JSON объекта вида:
{"attributes":{"str":number,"dex":number,"con":number,"int":number,"wis":number,"cha":number},"explanation":"краткое пояснение по-русски","archetype":"короткая метка архетипа на русском — одно или два слова"}
Каждое из шести чисел должно встретиться ровно один раз. Учитывай класс и расу при приоритете характеристик.`;

  const userParts = [
    `Раса: ${race || 'не выбрана'}`,
    `Класс: ${className || 'не выбран'}`,
    genderArchetypeHint(gender),
    playStylePrompt ? `Пожелания по стилю: ${playStylePrompt}` : '',
  ].filter(Boolean);

  const chatMessages = [
    { role: 'system', content: system },
    ...(Array.isArray(messages) ? messages : [])
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userParts.join('\n') },
  ];

  let raw = '{}';
  try {
    raw = await gigachatChatCompletions({
      messages: chatMessages,
      temperature: 0.6,
      max_tokens: 2000,
    });
  } catch (e) {
    console.error('[AI] generateAttributes upstream:', String(e?.message || e).slice(0, 300));
    throw e;
  }

  const data = tryParseJsonObject(raw);
  if (!data) {
    console.error('[AI] generateAttributes: parse JSON failed, using fallback');
    return fallbackAttributesResponse('не удалось извлечь JSON из ответа модели');
  }

  const attrsRaw = data.attributes;
  if (!validateStandardAttributes(attrsRaw)) {
    console.error('[AI] generateAttributes: invalid standard array from model, using fallback');
    return fallbackAttributesResponse('набор характеристик не соответствует 15,14,13,12,10,8 без дублей');
  }
  const attrs = coerceNumericAttributes(attrsRaw);

  return {
    attributes: {
      str: attrs.str,
      dex: attrs.dex,
      con: attrs.con,
      int: attrs.int,
      wis: attrs.wis,
      cha: attrs.cha,
    },
    explanation: String(data.explanation || '').trim() || 'Распределение обновлено.',
    archetype: String(data.archetype || '').trim() || null,
  };
}

export async function generateStory({
  race,
  className,
  gender,
  attributes,
  playStylePrompt,
  storyPrompt,
  chatSummary,
}) {
  console.log('[AI] generating story');
  const attrLine = attributes
    ? `Характеристики: STR ${attributes.str}, DEX ${attributes.dex}, CON ${attributes.con}, INT ${attributes.int}, WIS ${attributes.wis}, CHA ${attributes.cha}`
    : '';

  const system = `Ты писатель предысторий для D&D 5e на русском языке.
Сначала на отдельной первой строке напиши имя героя строго в формате: «Имя: <имя>» (без кавычек вокруг имени, без пояснений).
Затем с новой строки напиши связную художественную биографию персонажа ровно из 3–5 абзацев (не короче трёх), без маркированных списков и без подзаголовков внутри текста.
Стиль: фэнтези, приключение, атмосфера D&D; можно слегка мрачные нотки, если уместно.`;

  const user = [
    `Раса: ${race}`,
    `Класс: ${className}`,
    genderRuNarrationHint(gender),
    attrLine,
    playStylePrompt ? `Стиль игры / пожелания с прошлого этапа: ${playStylePrompt}` : '',
    chatSummary ? `Кратко контекст общения с ИИ о персонаже: ${chatSummary}` : '',
    storyPrompt ? `Дополнительные указания автора: ${storyPrompt}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  let story = '';
  try {
    story = await gigachatChatCompletions({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.85,
      max_tokens: 4000,
    });
  } catch (e) {
    console.error('[AI] generateStory upstream:', String(e?.message || e).slice(0, 300));
    throw e;
  }

  story = String(story || '').trim();
  if (!story) {
    throw new ApiError(502, 'Модель вернула пустую историю. Повторите запрос.', 'GIGACHAT_INVALID_OUTPUT');
  }
  return { story };
}

