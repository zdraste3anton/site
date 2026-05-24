import * as compendiumService from '../services/compendiumService.js';

export async function listRaces(req, res, next) {
  try {
    const items = await compendiumService.listRaces();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function getRace(req, res, next) {
  try {
    const item = await compendiumService.getRaceById(req.params.id);
    res.json(item);
  } catch (e) {
    next(e);
  }
}

export async function listClasses(req, res, next) {
  try {
    const items = await compendiumService.listClasses();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function getClass(req, res, next) {
  try {
    const item = await compendiumService.getClassById(req.params.id);
    res.json(item);
  } catch (e) {
    next(e);
  }
}

export async function listSpellsSimple(req, res, next) {
  try {
    const result = await compendiumService.listSpellsPlain();
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function listSpells(req, res, next) {
  try {
    const { search, levelGroup, school, class: cls, page, limit } = req.query;
    const result = await compendiumService.listSpells({
      search,
      levelGroup,
      school,
      class: cls,
      page,
      limit,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function getSpell(req, res, next) {
  try {
    const item = await compendiumService.getSpellById(req.params.id);
    res.json(item);
  } catch (e) {
    next(e);
  }
}
