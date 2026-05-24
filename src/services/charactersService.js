

import {
  buildSkillRows,
  computeArmorClass,
  computeInitiativeBonus,
  computeMaxHp,
  deriveDefaultInventory,
  deriveDefaultSpells,
} from '../utils/characterSheetDerived';

const STORAGE_V2 = 'characterforge_characters_v2';
const LEGACY_FLAT = 'characterforge_characters';

function uid() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readRoot() {
  try {
    const raw = localStorage.getItem(STORAGE_V2);
    if (!raw) return { users: {} };
    const data = JSON.parse(raw);
    if (!data || typeof data.users !== 'object') return { users: {} };
    return data;
  } catch {
    return { users: {} };
  }
}

function writeRoot(data) {
  localStorage.setItem(STORAGE_V2, JSON.stringify(data));
}

function migrateLegacyIfNeeded(userId) {
  const root = readRoot();
  if (root.users[userId]?.length) return;
  try {
    const leg = localStorage.getItem(LEGACY_FLAT);
    if (!leg) return;
    const arr = JSON.parse(leg);
    if (!Array.isArray(arr) || !arr.length) return;
    const migrated = arr.map((c, i) => normalizeLegacyCharacter(c, userId, i));
    root.users[userId] = migrated;
    writeRoot(root);
  } catch {
    
  }
}

function normalizeLegacyCharacter(raw, userId, index) {
  const id = raw.id || `${uid()}_m${index}`;
  return {
    ...raw,
    id,
    userId,
    name: raw.name || `${raw.race || 'Герой'} ${index + 1}`,
    race: raw.race || '',
    className: raw.className || raw.class || '',
    classId: raw.classId || '',
    level: raw.level ?? 1,
    portraitUrl: raw.portraitUrl || raw.portraitImage || '',
    spells: Array.isArray(raw.spells) ? raw.spells : [],
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

function defaultName(race, className) {
  const r = (race || 'Герой').split(/\s+/)[0];
  const c = (className || '').split(/\s+/)[0];
  if (r && c) return `${r}-${c}`;
  return r || 'Персонаж';
}


export function buildCharacterRecord(userId, payload) {
  const level = Number(payload.level) || 1;
  const attrs = { ...payload.attributes };
  const classId = payload.classId || '';
  const className = payload.className || '';
  const race = payload.race || '';

  const armorClass =
    payload.armorClass != null ? payload.armorClass : computeArmorClass(attrs);
  const hp = payload.hp != null ? payload.hp : computeMaxHp(classId, attrs, level);
  const initiative =
    payload.initiative != null ? String(payload.initiative) : computeInitiativeBonus(attrs);

  let spells = Array.isArray(payload.spells) && payload.spells.length ? payload.spells : [];
  if (!spells.length) {
    spells = deriveDefaultSpells(classId, className);
  }

  let inventory = Array.isArray(payload.inventory) && payload.inventory.length ? [...payload.inventory] : [];
  if (!inventory.length) {
    inventory = deriveDefaultInventory(classId, className);
  }

  const record = {
    id: payload.id || uid(),
    userId,
    name: (payload.name || '').trim() || defaultName(race, className),
    race,
    className,
    classId,
    level,
    attributes: attrs,
    story: payload.story || '',
    portraitUrl: payload.portraitUrl || payload.portraitImage || '',
    appearancePrompt: payload.appearancePrompt || '',
    portraitPromptUsed: payload.portraitPromptUsed || '',
    spells,
    inventory,
    skillOverrides: payload.skillOverrides ?? null,
    armorClass,
    hp,
    maxHp: hp,
    initiative,
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  return record;
}

export const charactersService = {
  list(userId) {
    if (!userId) return [];
    migrateLegacyIfNeeded(userId);
    const root = readRoot();
    const list = root.users[userId] || [];
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getById(userId, characterId) {
    const list = this.list(userId);
    return list.find((c) => c.id === characterId) || null;
  },

  create(userId, payload) {
    const root = readRoot();
    const list = root.users[userId] || [];
    const record = buildCharacterRecord(userId, payload);
    root.users[userId] = [record, ...list];
    writeRoot(root);
    return record;
  },

  delete(userId, characterId) {
    const root = readRoot();
    const list = root.users[userId];
    if (!list) return false;
    const next = list.filter((c) => c.id !== characterId);
    if (next.length === list.length) return false;
    root.users[userId] = next;
    writeRoot(root);
    return true;
  },

  
  getSkillRows(character) {
    return buildSkillRows(character);
  },
};


export function saveCharacterToProfile(character) {
  const userId = character.userId;
  if (!userId) {
    console.warn('charactersService: userId required');
    return null;
  }
  return charactersService.create(userId, character);
}
