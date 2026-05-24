
import { SPELLS as SPELLS_SOURCE } from '../../../src/data/spellsData.js';

export function mapSpellToPrismaRow(s) {
  const schools = Array.isArray(s.schools) ? s.schools : [];
  const school =
    s.school != null && String(s.school).trim() !== ''
      ? String(s.school)
      : schools[0] != null
        ? String(schools[0])
        : '';
  return {
    id: String(s.id),
    name: String(s.name ?? ''),
    description: String(s.description ?? ''),
    level: Number(s.level) || 0,
    levelGroup: String(s.levelGroup ?? ''),
    school,
    classesJson: Array.isArray(s.classes) ? s.classes : [],
    tagsJson: Array.isArray(s.tags) ? s.tags : [],
  };
}

export const SPELLS = SPELLS_SOURCE.map(mapSpellToPrismaRow);
