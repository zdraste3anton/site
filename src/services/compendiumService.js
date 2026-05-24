import { RACES } from '../data/racesData';
import { CLASSES } from '../data/classesData';
import { apiRequest } from './api.js';

const raceIconById = Object.fromEntries(RACES.map((r) => [r.id, r.icon]));
const classIconById = Object.fromEntries(CLASSES.map((c) => [c.id, c.icon]));
const FALLBACK_RACE_ICON = RACES[0]?.icon;
const FALLBACK_CLASS_ICON = CLASSES[0]?.icon;


function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

function normalizeBonuses(raw) {
  if (raw == null || raw === '') return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (Array.isArray(raw)) return { list: raw };
  return {};
}

function mapRaceFromApi(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const traits =
    raw.traits && typeof raw.traits === 'object'
      ? raw.traits
      : raw.traitsJson && typeof raw.traitsJson === 'object'
        ? raw.traitsJson
        : {};
  const tags = Array.isArray(raw.tags)
    ? raw.tags
    : Array.isArray(traits.tags)
      ? traits.tags
      : [];
  const accent = raw.accent || traits.accent || 'orange';
  const bonuses = normalizeBonuses(raw.bonuses ?? raw.bonusesJson ?? traits.bonuses);
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? 'Без названия'),
    description: String(raw.description ?? ''),
    icon: raw.icon != null && raw.icon !== '' ? raw.icon : raw.id,
    tags,
    accent,
    bonuses,
    traits,
  };
}

function mapClassFromApi(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const fj =
    raw.featuresJson && typeof raw.featuresJson === 'object'
      ? raw.featuresJson
      : raw.features && typeof raw.features === 'object' && !Array.isArray(raw.features)
        ? raw.features
        : {};
  const tags = Array.isArray(raw.tags)
    ? raw.tags
    : Array.isArray(fj.tags)
      ? fj.tags
      : [];
  const accent = raw.accent || fj.accent || 'orange';
  const features = Array.isArray(raw.features)
    ? raw.features
    : Array.isArray(fj.features)
      ? fj.features
      : Array.isArray(fj.highlights)
        ? fj.highlights
        : tags;
  const roleInParty = String(raw.roleInParty ?? fj.roleInParty ?? '').trim();
  const primaryStats = Array.isArray(raw.primaryStats)
    ? raw.primaryStats.map(String)
    : Array.isArray(fj.primaryStats)
      ? fj.primaryStats.map(String)
      : [];
  const level1Features = Array.isArray(raw.level1Features)
    ? raw.level1Features.map(String)
    : Array.isArray(fj.level1Features)
      ? fj.level1Features.map(String)
      : Array.isArray(fj.level1Abilities)
        ? fj.level1Abilities.map(String)
        : [];
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? 'Без названия'),
    description: String(raw.description ?? ''),
    icon: raw.icon != null && raw.icon !== '' ? raw.icon : raw.id,
    tags,
    accent,
    features,
    roleInParty,
    primaryStats,
    level1Features,
  };
}

function levelGroupFromLevel(level) {
  const n = Number(level) || 0;
  if (n === 0) return 'Заговор';
  if (n <= 3) return '1-3 уровень (низкий)';
  if (n <= 6) return '4-6 уровень (средний)';
  return '7-9 уровень (высокий)';
}

function mapSpellFromApi(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const level = Number(raw.level) || 0;
  const levelGroup =
    raw.levelGroup != null && String(raw.levelGroup).trim() !== ''
      ? String(raw.levelGroup)
      : levelGroupFromLevel(level);
  let classes = Array.isArray(raw.classes) ? raw.classes : [];
  if (!classes.length && Array.isArray(raw.classesJson)) classes = raw.classesJson;
  let schools = Array.isArray(raw.schools) ? raw.schools : [];
  if (!schools.length && raw.school != null && String(raw.school).trim() !== '') {
    schools = [String(raw.school)];
  }
  const levelTag = level === 0 ? 'Заговор' : `${level} уровень`;
  let tags = Array.isArray(raw.tags) ? raw.tags : [];
  if (!tags.length && Array.isArray(raw.tagsJson)) tags = raw.tagsJson;
  if (!tags.length) tags = [levelTag, ...schools, ...classes];
  const mechanicsRaw =
    raw.mechanicsJson != null && typeof raw.mechanicsJson === 'object' && !Array.isArray(raw.mechanicsJson)
      ? raw.mechanicsJson
      : raw.mechanics != null && typeof raw.mechanics === 'object' && !Array.isArray(raw.mechanics)
        ? raw.mechanics
        : null;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? 'Без названия'),
    description: String(raw.description ?? ''),
    level,
    levelGroup,
    school: raw.school != null ? String(raw.school) : schools[0] || '',
    schools,
    classes,
    tags,
    mechanics: mechanicsRaw,
  };
}

function enrichRace(item) {
  if (!item) return item;
  const key = item.id || item.icon;
  const icon = raceIconById[key] || raceIconById[item.icon] || FALLBACK_RACE_ICON;
  const tags = Array.isArray(item.tags) ? item.tags : [];
  return { ...item, icon, tags };
}

function enrichClass(item) {
  if (!item) return item;
  const key = item.id || item.icon;
  const icon = classIconById[key] || classIconById[item.icon] || FALLBACK_CLASS_ICON;
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const st = CLASSES.find((c) => c.id === item.id);
  const roleInParty =
    item.roleInParty && String(item.roleInParty).trim() !== ''
      ? String(item.roleInParty).trim()
      : st?.roleInParty || '';
  const primaryStats =
    Array.isArray(item.primaryStats) && item.primaryStats.length > 0
      ? item.primaryStats
      : Array.isArray(st?.primaryStats)
        ? st.primaryStats
        : [];
  const level1Features =
    Array.isArray(item.level1Features) && item.level1Features.length > 0
      ? item.level1Features
      : Array.isArray(st?.level1Features)
        ? st.level1Features
        : [];
  return { ...item, icon, tags, roleInParty, primaryStats, level1Features };
}

function enrichSpell(item) {
  if (!item) return item;
  const level = Number(item.level) || 0;
  const levelGroup =
    item.levelGroup != null && String(item.levelGroup).trim() !== ''
      ? String(item.levelGroup)
      : levelGroupFromLevel(level);
  const classes = Array.isArray(item.classes) ? item.classes : [];
  let schools = Array.isArray(item.schools) ? item.schools : [];
  if (!schools.length && item.school != null && String(item.school).trim() !== '') {
    schools = [String(item.school)];
  }
  const levelTag = level === 0 ? 'Заговор' : `${level} уровень`;
  const tags =
    Array.isArray(item.tags) && item.tags.length > 0
      ? item.tags
      : [levelTag, ...schools, ...classes];
  return {
    ...item,
    level,
    levelGroup,
    classes,
    schools,
    tags,
    school: item.school != null ? String(item.school) : schools[0] || '',
    mechanics: item.mechanics ?? null,
  };
}

export async function loadRaces() {
  const data = await apiRequest('races');
  const list = unwrapList(data);
  return list.map((r) => mapRaceFromApi(r)).filter(Boolean).map(enrichRace);
}

export async function loadClasses() {
  const data = await apiRequest('classes');
  const list = unwrapList(data);
  return list.map((c) => mapClassFromApi(c)).filter(Boolean).map(enrichClass);
}

export async function loadSpells() {
  const data = await apiRequest('spells');
  const list = unwrapList(data);
  return list.map((s) => mapSpellFromApi(s)).filter(Boolean).map(enrichSpell);
}
