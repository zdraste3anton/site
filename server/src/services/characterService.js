import { prisma } from '../utils/prisma.js';
import { ApiError } from '../utils/apiError.js';

function toCsvString(value) {
  if (Array.isArray(value)) {
    return value
      .map((x) => {
        if (x == null) return '';
        if (typeof x === 'string') return x.trim();
        if (typeof x === 'object') {
          const name = String(x.name || '').trim();
          const tag = String(x.levelTag || '').trim();
          if (!name) return '';
          return tag ? `${name} (${tag})` : name;
        }
        return String(x).trim();
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'string') return value.trim();
  return '';
}

function splitCsvString(raw) {
  const s = String(raw || '').trim();
  if (!s) return [];
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function spellObjectsFromCsv(raw) {
  const parts = splitCsvString(raw);
  return parts.map((line, i) => {
    const m = /^(.*?)\s*\((.*?)\)\s*$/.exec(line);
    const name = (m ? m[1] : line).trim();
    const levelTag = (m ? m[2] : '').trim();
    const tagLower = levelTag.toLowerCase();
    const level = tagLower.includes('заговор') ? 0 : tagLower.includes('1') ? 1 : undefined;
    return {
      id: `csv_${i}_${name.replace(/\s+/g, '_').slice(0, 24)}`,
      name,
      school: '—',
      ...(level !== undefined ? { level } : {}),
      ...(levelTag ? { levelTag } : {}),
    };
  });
}

function normalizeSpells(raw) {
  
  return Array.isArray(raw) ? raw : [];
}

function normalizeInventory(raw) {
  return Array.isArray(raw) ? raw : [];
}

function toApi(row) {
  if (!row) return null;
  const spellsFromJson = normalizeSpells(row.spellsJson);
  const invFromJson = normalizeInventory(row.inventoryJson);
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    raceName: row.raceName,
    className: row.className,
    classId: row.classId,
    level: row.level,
    attributes: row.attributesJson,
    skills: row.skillsJson,
    
    
    
    spells: spellsFromJson.length ? spellsFromJson : spellObjectsFromCsv(row.spells),
    inventory: invFromJson.length ? invFromJson : splitCsvString(row.inventory),
    
    spellsCsv: String(row.spells || ''),
    inventoryCsv: String(row.inventory || ''),
    story: row.story,
    portraitUrl: row.portraitUrl,
    appearancePrompt: row.appearancePrompt,
    armorClass: row.armorClass,
    hp: row.hitPoints,
    hitPoints: row.hitPoints,
    initiative: row.initiative,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createCharacter(userId, body) {
  const {
    name,
    raceName,
    className,
    classId,
    level = 1,
    attributes,
    skills,
    spells,
    inventory,
    story,
    portraitUrl,
    appearancePrompt,
    armorClass,
    hitPoints,
    hp,
    initiative,
  } = body;

  const baseData = {
    userId,
    name: String(name).trim(),
    raceName: String(raceName || '').trim(),
    className: String(className || '').trim(),
    classId: classId != null && String(classId).trim() ? String(classId).trim() : null,
    level: Number(level) || 1,
    attributesJson: attributes && typeof attributes === 'object' ? attributes : {},
    skillsJson: skills ?? null,
    story: story != null ? String(story) : null,
    portraitUrl: portraitUrl != null ? String(portraitUrl) : null,
    appearancePrompt: appearancePrompt != null ? String(appearancePrompt) : null,
    armorClass: armorClass != null ? Number(armorClass) : null,
    hitPoints: hitPoints != null ? Number(hitPoints) : hp != null ? Number(hp) : null,
    initiative: initiative != null ? String(initiative) : null,
  };

  const characterData = {
    ...baseData,
    
    inventory: String(Array.isArray(inventory) ? inventory.join(', ') : inventory || ''),
    spells: String(Array.isArray(spells) ? spells.join(', ') : spells || ''),
    
    spellsJson: spells !== undefined ? normalizeSpells(spells) : [],
    inventoryJson: inventory !== undefined ? normalizeInventory(inventory) : [],
  };

  console.log('DEBUG: Sending to Prisma:', characterData);

  const row = await prisma.character.create({ data: characterData });
  return toApi(row);
}

export async function listCharacters(userId) {
  const rows = await prisma.character.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toApi);
}

export async function getCharacterForUser(userId, characterId) {
  const row = await prisma.character.findFirst({
    where: { id: characterId, userId },
  });
  if (!row) throw new ApiError(404, 'Персонаж не найден', 'NOT_FOUND');
  return toApi(row);
}

export async function updateCharacter(userId, characterId, body) {
  await getCharacterForUser(userId, characterId);
  const row = await prisma.character.update({
    where: { id: characterId },
    data: {
      ...(body.name != null ? { name: String(body.name).trim() } : {}),
      ...(body.raceName != null ? { raceName: String(body.raceName).trim() } : {}),
      ...(body.className != null ? { className: String(body.className).trim() } : {}),
      ...(body.classId !== undefined
        ? { classId: body.classId != null && String(body.classId).trim() ? String(body.classId).trim() : null }
        : {}),
      ...(body.level != null ? { level: Number(body.level) || 1 } : {}),
      ...(body.attributes != null ? { attributesJson: body.attributes } : {}),
      ...(body.skills !== undefined ? { skillsJson: body.skills } : {}),
      ...(body.spells !== undefined
        ? { spells: toCsvString(body.spells), spellsJson: normalizeSpells(body.spells) }
        : {}),
      ...(body.inventory !== undefined
        ? { inventory: toCsvString(body.inventory), inventoryJson: normalizeInventory(body.inventory) }
        : {}),
      ...(body.story !== undefined ? { story: body.story != null ? String(body.story) : null } : {}),
      ...(body.portraitUrl !== undefined ? { portraitUrl: body.portraitUrl } : {}),
      ...(body.appearancePrompt !== undefined ? { appearancePrompt: body.appearancePrompt } : {}),
      ...(body.armorClass !== undefined ? { armorClass: Number(body.armorClass) } : {}),
      ...(body.hitPoints !== undefined || body.hp !== undefined
        ? { hitPoints: Number(body.hitPoints ?? body.hp) }
        : {}),
      ...(body.initiative !== undefined ? { initiative: body.initiative } : {}),
    },
  });
  return toApi(row);
}

export async function deleteCharacter(userId, characterId) {
  const row = await prisma.character.findFirst({
    where: { id: characterId, userId },
  });
  if (!row) throw new ApiError(404, 'Персонаж не найден', 'NOT_FOUND');
  await prisma.character.delete({ where: { id: characterId } });
}
