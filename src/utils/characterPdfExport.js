
import { jsPDF } from 'jspdf';
import { buildSkillRows, displayRaceClass, normalizePortraitUrl } from './characterSheetDerived';

const ATTR_LABELS = [
  ['str', 'СИЛ'],
  ['dex', 'ЛОВ'],
  ['con', 'ТЕЛ'],
  ['int', 'ИНТ'],
  ['wis', 'МУД'],
  ['cha', 'ХАР'],
];

const ROBOTO_TTF =
  'https://cdn.jsdelivr.net/gh/google/fonts/apache/roboto/Roboto-Regular.ttf';

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(String(text || '—'), maxWidth);
  let cy = y;
  lines.forEach((line) => {
    doc.text(line, x, cy);
    cy += lineHeight;
  });
  return cy;
}

async function ensureCyrillicFont(doc) {
  try {
    const res = await fetch(ROBOTO_TTF);
    if (!res.ok) throw new Error('font fetch');
    const buf = await res.arrayBuffer();
    const b64 = arrayBufferToBase64(buf);
    doc.addFileToVFS('Roboto-Regular.ttf', b64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto', 'normal');
    return true;
  } catch {
    doc.setFont('helvetica', 'normal');
    return false;
  }
}


export async function exportCharacterToPdf(character) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await ensureCyrillicFont(doc);

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 18;

  doc.setFontSize(18);
  doc.text(character.name || 'Персонаж', margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.text(displayRaceClass(character), margin, y);
  y += 6;
  doc.text(`Уровень: ${character.level ?? 1}`, margin, y);
  y += 6;
  doc.text(
    `КД: ${character.armorClass ?? '—'}   Хиты: ${character.hp ?? '—'}   Инициатива: ${character.initiative ?? '—'}`,
    margin,
    y
  );
  y += 12;

  const portrait = normalizePortraitUrl(character);
  if (portrait && /^data:image\//i.test(portrait)) {
    try {
      const fmt = portrait.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(portrait, fmt, pageW - margin - 45, 12, 45, 45);
    } catch {
      
    }
  }

  doc.setFontSize(12);
  doc.text('Характеристики', margin, y);
  y += 7;
  doc.setFontSize(10);
  const attrs = character.attributes || {};
  ATTR_LABELS.forEach(([key, label]) => {
    const v = attrs[key] ?? '—';
    doc.text(`${label}: ${v}`, margin, y);
    y += 5;
  });
  y += 4;

  doc.setFontSize(12);
  doc.text('Навыки', margin, y);
  y += 6;
  doc.setFontSize(9);
  const skills = buildSkillRows(character);
  skills.forEach((s) => {
    if (y > 270) {
      doc.addPage();
      y = 16;
    }
    doc.text(`${s.name}: ${s.bonus}`, margin, y);
    y += 4.5;
  });
  y += 4;

  if (y > 240) {
    doc.addPage();
    y = 16;
  }
  doc.setFontSize(12);
  doc.text('Заклинания', margin, y);
  y += 6;
  doc.setFontSize(9);
  const spells = character.spells || [];
  if (!spells.length) {
    doc.text('—', margin, y);
    y += 6;
  } else {
    spells.forEach((sp) => {
      if (y > 275) {
        doc.addPage();
        y = 16;
      }
      const line = `${sp.name} (${sp.school || '—'}) — ${sp.levelTag || ''}`;
      doc.text(line, margin, y);
      y += 4.5;
    });
  }
  y += 6;

  if (y > 220) {
    doc.addPage();
    y = 16;
  }
  doc.setFontSize(12);
  doc.text('История (квента)', margin, y);
  y += 7;
  doc.setFontSize(10);
  addWrappedText(doc, character.story || '—', margin, y, pageW - margin * 2, 5);

  const safeName = (character.name || 'character').replace(/[^\wа-яА-ЯёЁ-]+/gi, '_').slice(0, 40);
  doc.save(`CharacterForge_${safeName}.pdf`);
}
