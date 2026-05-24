import { validationResult, body } from 'express-validator';
import * as characterService from '../services/characterService.js';
import { buildCharacterPdfBuffer } from '../services/pdfGeneration.service.js';
import { ApiError } from '../utils/apiError.js';

export const createCharacterValidators = [
  body('name').trim().notEmpty().withMessage('Укажите имя персонажа'),
  body('raceName').optional().trim(),
  body('className').optional().trim(),
  body('level').optional().isInt({ min: 1, max: 20 }),
  body('attributes').optional().isObject(),
];

export async function create(req, res, next) {
  try {
    console.log('[API] POST /api/characters');
    console.log('[CHARACTER SAVE] userId', req.user?.id);
    console.log('[CHARACTER SAVE] payload keys', Object.keys(req.body || {}));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, code: 'VALIDATION' });
    }
    const char = await characterService.createCharacter(req.user.id, req.body);
    res.status(201).json(char);
  } catch (e) {
    console.error('[CHARACTER SAVE] error stack', e?.stack || e?.message || e);
    next(e);
  }
}

export async function list(req, res, next) {
  try {
    const items = await characterService.listCharacters(req.user.id);
    res.json({ items });
  } catch (e) {
    console.error('[characters.list] error:', e?.stack || e?.message || e);
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const char = await characterService.getCharacterForUser(req.user.id, req.params.id);
    res.json(char);
  } catch (e) {
    console.error('[characters.getOne] error:', e?.stack || e?.message || e);
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const char = await characterService.updateCharacter(req.user.id, req.params.id, req.body);
    res.json(char);
  } catch (e) {
    console.error('[characters.update] error:', e?.stack || e?.message || e);
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    await characterService.deleteCharacter(req.user.id, req.params.id);
    res.status(204).send();
  } catch (e) {
    console.error('[characters.remove] error:', e?.stack || e?.message || e);
    next(e);
  }
}

export async function pdf(req, res, next) {
  const id = req.params.id;
  try {
    console.log('[PDF] request id:', id);
    const char = await characterService.getCharacterForUser(req.user.id, id);
    console.log('[PDF] character loaded:', {
      id: char?.id,
      name: char?.name,
      hasAttributes: Boolean(char?.attributes),
      skillsType: char?.skills === null ? 'null' : Array.isArray(char?.skills) ? 'array' : typeof char?.skills,
      spellsType: char?.spells === null ? 'null' : Array.isArray(char?.spells) ? 'array' : typeof char?.spells,
    });
    const buf = await buildCharacterPdfBuffer(char);
    const asciiFilename = 'character-sheet.pdf';
    const utf8Filename = encodeURIComponent(`CharacterForge_${char.name || 'character'}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`
    );
    res.send(buf);
    console.log('[PDF] sent ok bytes=', buf?.length ?? 0, 'ascii=', asciiFilename, 'filename*=', utf8Filename.slice(0, 80));
  } catch (e) {
    console.error('[PDF] error:', e?.stack || e?.message || e);
    if (res.headersSent) {
      return next(e);
    }
    if (e instanceof ApiError) {
      return res.status(e.statusCode).json({ message: e.message, ...(e.code ? { code: e.code } : {}) });
    }
    return res.status(500).json({ message: 'PDF generation failed', code: 'PDF_FAILED' });
  }
}
