import { apiRequest, API_BASE_URL, TOKEN_KEY, ApiClientError } from './api.js';
import { buildCharacterRecord } from './charactersService.js';
import {
  computeArmorClass,
  computeInitiativeBonus,
  computeMaxHp,
  deriveDefaultInventory,
  deriveDefaultSpells,
} from '../utils/characterSheetDerived';


export function mapCharacterFromApi(raw) {
  if (!raw) return null;
  const attrs = raw.attributes && typeof raw.attributes === 'object' ? raw.attributes : {};
  let spells = Array.isArray(raw.spells) ? raw.spells : [];
  if (!spells.length && (raw.className || raw.classId)) {
    spells = deriveDefaultSpells(raw.classId, raw.className);
  }
  spells = spells.map((s, i) => ({
    ...s,
    id: s.id || `spell_${i}_${String(s.name || 'x').replace(/\s+/g, '_').slice(0, 40)}`,
  }));
  let inventory = Array.isArray(raw.inventory) ? raw.inventory : [];
  if (!inventory.length && (raw.className || raw.classId)) {
    inventory = deriveDefaultInventory(raw.classId, raw.className);
  }
  const skillOverrides =
    raw.skills && typeof raw.skills === 'object' && !Array.isArray(raw.skills) ? raw.skills : null;
  return {
    id: raw.id,
    userId: raw.userId,
    name: raw.name || 'Персонаж',
    race: raw.raceName || raw.race || '',
    raceName: raw.raceName || raw.race || '',
    className: raw.className || '',
    classId: raw.classId || '',
    inventory,
    skillOverrides,
    level: Number(raw.level) || 1,
    attributes: attrs,
    story: raw.story || '',
    portraitUrl: raw.portraitUrl || raw.portraitImage || '',
    appearancePrompt: raw.appearancePrompt || '',
    portraitPromptUsed: raw.portraitPromptUsed || '',
    spells,
    armorClass: raw.armorClass != null ? raw.armorClass : computeArmorClass(attrs),
    hp: raw.hp ?? raw.hitPoints ?? raw.maxHp,
    maxHp: raw.maxHp ?? raw.hitPoints ?? raw.hp,
    hitPoints: raw.hitPoints ?? raw.hp,
    initiative: raw.initiative != null ? String(raw.initiative) : computeInitiativeBonus(attrs),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function recordToApiBody(record) {
  return {
    name: record.name,
    raceName: record.race || record.raceName || '',
    className: record.className || '',
    classId: record.classId || undefined,
    level: record.level ?? 1,
    attributes: record.attributes && typeof record.attributes === 'object' ? record.attributes : {},
    skills: record.skillOverrides ?? null,
    spells: Array.isArray(record.spells) ? record.spells : [],
    inventory: Array.isArray(record.inventory) ? record.inventory : [],
    story: record.story ?? '',
    portraitUrl: record.portraitUrl || record.portraitImage || '',
    appearancePrompt: record.appearancePrompt ?? '',
    armorClass: record.armorClass ?? computeArmorClass(record.attributes),
    hitPoints: record.hp ?? record.hitPoints ?? record.maxHp,
    hp: record.hp ?? record.hitPoints,
    initiative: record.initiative != null ? String(record.initiative) : undefined,
  };
}


export function mapWizardPayloadToApiBody(payload) {
  const {
    name,
    race = '',
    class: className = '',
    classId = '',
    stats = {},
    skills = null,
    spells = [],
    backstory = '',
    portrait = '',
  } = payload || {};

  const attributes = stats && typeof stats === 'object' ? stats : {};
  const nm =
    (name && String(name).trim()) ||
    `${String(race).split(/\s+/)[0] || 'Герой'}-${String(className).split(/\s+/)[0] || ''}`.replace(
      /^-+|-+$/g,
      ''
    ) ||
    'Персонаж';

  const hp = computeMaxHp(classId || '', attributes, 1);

  let spellList = Array.isArray(spells) ? spells : [];
  if (!spellList.length) {
    spellList = deriveDefaultSpells(classId, className);
  }
  let inventory = deriveDefaultInventory(classId, className);

  return {
    name: nm.slice(0, 120),
    raceName: String(race).trim(),
    className: String(className).trim(),
    classId: String(classId || '').trim() || undefined,
    level: 1,
    attributes,
    skills,
    spells: spellList,
    inventory,
    story: String(backstory || ''),
    portraitUrl: String(portrait || ''),
    appearancePrompt: '',
    armorClass: computeArmorClass(attributes),
    hitPoints: hp,
    initiative: computeInitiativeBonus(attributes),
  };
}

export async function listCharacters() {
  const data = await apiRequest('characters', { method: 'GET', auth: true });
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map(mapCharacterFromApi);
}

export async function getCharacter(characterId) {
  const raw = await apiRequest(`characters/${encodeURIComponent(characterId)}`, {
    method: 'GET',
    auth: true,
  });
  return mapCharacterFromApi(raw);
}


export async function downloadCharacterPdf(characterId) {
  const token =
    typeof window !== 'undefined'
      ? window.localStorage?.getItem(TOKEN_KEY) || window.localStorage?.getItem('characterforge_auth_token')
      : null;
  const url = `${API_BASE_URL}/characters/${encodeURIComponent(characterId)}/pdf`;
  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (e) {
    throw new ApiClientError(0, e?.message || 'Сервер недоступен', 'NETWORK');
  }
  if (!res.ok) {
    let msg = `Ошибка ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) msg = String(data.message);
    } catch {
      
    }
    throw new ApiClientError(res.status, msg);
  }
  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition') || '';
  const m = /filename="?([^";]+)"?/i.exec(cd);
  const filename = m ? m[1] : `CharacterForge_${String(characterId).slice(0, 8)}.pdf`;
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export async function createCharacter(payload) {
  
  console.log('[SAVE] payload', payload);
  const raw = await apiRequest('characters', {
    method: 'POST',
    auth: true,
    body: payload,
  });
  
  console.log('[SAVE] response ok', { id: raw?.id, name: raw?.name });
  return mapCharacterFromApi(raw);
}

export async function deleteCharacter(characterId) {
  await apiRequest(`characters/${encodeURIComponent(characterId)}`, {
    method: 'DELETE',
    auth: true,
  });
}


export async function updateCharacter(characterId, body) {
  const raw = await apiRequest(`characters/${encodeURIComponent(characterId)}`, {
    method: 'PATCH',
    auth: true,
    body: body || {},
  });
  return mapCharacterFromApi(raw);
}


export async function saveGeneratorCharacter(userId, state, raceName, className) {
  const record = buildCharacterRecord(userId, {
    name: state.characterDisplayName || '',
    race: raceName,
    className,
    classId: state.classId,
    level: 1,
    attributes: { ...state.attributes },
    story: state.generatedStory,
    portraitImage: state.portraitImage,
    portraitUrl: state.portraitImage,
  });
  const body = recordToApiBody(record);
  
  console.log('[SAVE] generator record', {
    name: record?.name,
    className: record?.className,
    hasPortrait: Boolean(record?.portraitUrl),
    spellsType: Array.isArray(record?.spells) ? 'array' : typeof record?.spells,
    inventoryType: Array.isArray(record?.inventory) ? 'array' : typeof record?.inventory,
  });
  return createCharacter(body);
}


export async function createCharacterFromWizardPayload(payload) {
  const body = mapWizardPayloadToApiBody(payload);
  return createCharacter(body);
}
