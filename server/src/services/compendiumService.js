import { prisma } from '../utils/prisma.js';
import { ApiError } from '../utils/apiError.js';

function mapRace(row) {
  const traits = row.traitsJson || {};
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    tags: traits.tags || [],
    accent: traits.accent || 'orange',
    icon: row.icon || row.id,
  };
}

function mapClass(row) {
  const f = row.featuresJson || {};
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    tags: f.tags || [],
    accent: f.accent || 'orange',
    icon: row.icon || row.id,
  };
}

function mapSpell(row) {
  const classes = Array.isArray(row.classesJson) ? row.classesJson : [];
  const tags = Array.isArray(row.tagsJson) ? row.tagsJson : [];
  const levelTag = row.level === 0 ? 'Заговор' : `${row.level} уровень`;
  const schools = tags.filter((t) => t !== levelTag && !classes.includes(t));
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    level: row.level,
    levelGroup: row.levelGroup,
    school: row.school,
    schools: schools.length ? schools : row.school ? [row.school] : [],
    classes,
    tags,
  };
}

export async function listRaces() {
  const rows = await prisma.race.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapRace);
}

export async function getRaceById(id) {
  const row = await prisma.race.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, 'Раса не найдена', 'NOT_FOUND');
  return mapRace(row);
}

export async function listClasses() {
  const rows = await prisma.dndClass.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapClass);
}

export async function getClassById(id) {
  const row = await prisma.dndClass.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, 'Класс не найден', 'NOT_FOUND');
  return mapClass(row);
}


export async function listSpellsPlain() {
  const rows = await prisma.spell.findMany({
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
  });
  return { items: rows.map(mapSpell) };
}

export async function listSpells({ search, levelGroup, school, class: classFilter, page = 1, limit = 24 }) {
  const take = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = {};
  if (search && String(search).trim()) {
    where.name = { contains: String(search).trim(), mode: 'insensitive' };
  }
  if (levelGroup && String(levelGroup).trim()) {
    where.levelGroup = String(levelGroup).trim();
  }
  if (school && String(school).trim()) {
    where.school = { contains: String(school).trim(), mode: 'insensitive' };
  }

  let rows = await prisma.spell.findMany({
    where,
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
  });

  if (classFilter && String(classFilter).trim()) {
    const cf = String(classFilter).trim();
    rows = rows.filter((r) => {
      const arr = Array.isArray(r.classesJson) ? r.classesJson : [];
      return arr.some((c) => c === cf || c.includes(cf));
    });
  }

  const total = rows.length;
  const slice = rows.slice(skip, skip + take);

  return {
    items: slice.map(mapSpell),
    pagination: {
      page: Math.max(Number(page) || 1, 1),
      limit: take,
      total,
      totalPages: Math.ceil(total / take) || 1,
    },
  };
}

export async function getSpellById(id) {
  const row = await prisma.spell.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, 'Заклинание не найдено', 'NOT_FOUND');
  return mapSpell(row);
}
