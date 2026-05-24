import { PrismaClient } from '@prisma/client';
import { RACES } from '../src/data/racesData.js';
import { CLASSES } from '../src/data/classesData.js';
import { SPELLS } from '../src/data/spellsData.js';

const prisma = new PrismaClient();

function raceRows() {
  return RACES.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    icon: r.id,
    traitsJson: { tags: r.tags, accent: r.accent },
    bonusesJson: r.bonusesJson ?? {},
  }));
}

function classRows() {
  return CLASSES.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    icon: c.id,
    featuresJson: { tags: c.tags, accent: c.accent },
  }));
}

async function main() {
  const raceResult = await prisma.race.createMany({
    data: raceRows(),
    skipDuplicates: true,
  });

  const classResult = await prisma.dndClass.createMany({
    data: classRows(),
    skipDuplicates: true,
  });

  const spellResult = await prisma.spell.createMany({
    data: SPELLS,
    skipDuplicates: true,
  });

  const [raceCount, classCount, spellCount] = await Promise.all([
    prisma.race.count(),
    prisma.dndClass.count(),
    prisma.spell.count(),
  ]);

  console.log('[seed] createMany вставлено (новых строк):', {
    races: raceResult.count,
    classes: classResult.count,
    spells: spellResult.count,
  });
  console.log('[seed] всего в таблицах:', { races: raceCount, classes: classCount, spells: spellCount });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
