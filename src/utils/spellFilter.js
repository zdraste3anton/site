
export function filterSpells(spells, { query, selectedLevels, selectedSchools, selectedClasses }) {
  const q = query.trim().toLowerCase();

  return spells.filter((spell) => {
    if (q && !spell.name.toLowerCase().includes(q)) return false;

    if (selectedLevels.size > 0 && !selectedLevels.has(spell.levelGroup)) {
      return false;
    }

    if (selectedSchools.size > 0) {
      const matchSchool = spell.schools.some((s) => selectedSchools.has(s));
      if (!matchSchool) return false;
    }

    if (selectedClasses.size > 0) {
      const matchClass = spell.classes.some((c) => selectedClasses.has(c));
      if (!matchClass) return false;
    }

    return true;
  });
}
