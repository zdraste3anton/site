import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CLASSES } from '../../data/classesData';
import EditablePortrait from './EditablePortrait';
import styles from './CharacterCard.module.css';

const RU_MONTHS_SHORT = [
  'янв.',
  'февр.',
  'мар.',
  'апр.',
  'мая',
  'июн.',
  'июл.',
  'авг.',
  'сент.',
  'окт.',
  'нояб.',
  'дек.',
];

function formatCreatedRu(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${RU_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function resolveClassIcon(character) {
  const byId = CLASSES.find((c) => c.id === character.classId);
  if (byId?.icon) return byId.icon;
  const name = String(character.className || '').trim();
  if (!name) return null;
  return CLASSES.find((c) => c.name === name)?.icon || null;
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden>
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden>
      <path
        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function injectRuStartContentByClass(className) {
  const nm = String(className || '').trim();
  if (nm === 'Жрец') {
    return {
      spells: ['Свет (заговор)', 'Священное пламя (заговор)', 'Лечение ран (1 ур.)', 'Щит веры (1 ур.)'],
      inventory: ['Священный символ', 'Кольчуга', 'Булава', 'Набор священника'],
    };
  }
  if (nm === 'Маг') {
    return {
      spells: ['Огненный снаряд (заговор)', 'Магическая рука (заговор)', 'Магический доспех (1 ур.)', 'Усыпление (1 ур.)'],
      inventory: ['Посох', 'Книга заклинаний', 'Компонентная сумка', 'Набор ученого'],
    };
  }
  if (nm === 'Воин') {
    return {
      spells: ['Нет доступных заклинаний'],
      inventory: ['Длинный меч', 'Щит', 'Кольчуга', 'Набор путешественника'],
    };
  }
  return null;
}

function toSpellLines(raw, fallbackClassName) {
  const injected = injectRuStartContentByClass(fallbackClassName);
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  const base = Array.isArray(raw) && raw.length ? raw : injected?.spells || [];
  return base
    .map((s) => {
      if (typeof s === 'string') return s.trim();
      if (!s || typeof s !== 'object') return '';
      const name = String(s.name || '').trim();
      const tag = String(s.levelTag || '').trim();
      if (!name) return '';
      return tag ? `${name} (${tag})` : name;
    })
    .filter(Boolean);
}

function toInventoryLines(raw, fallbackClassName) {
  const injected = injectRuStartContentByClass(fallbackClassName);
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  const base = Array.isArray(raw) && raw.length ? raw : injected?.inventory || [];
  return base.map((x) => String(x || '').trim()).filter(Boolean);
}

export default function CharacterCard({ character, onRequestDelete, onPortraitUpdated }) {
  const navigate = useNavigate();
  const level = Number(character.level) || 1;
  const classLabel = character.className || '—';
  const raceLabel = character.race || character.raceName || '—';
  const classIcon = useMemo(() => resolveClassIcon(character), [character]);
  const createdLabel = useMemo(() => formatCreatedRu(character.createdAt), [character.createdAt]);

  const [editMode, setEditMode] = useState(false);
  const [draftSpellsText, setDraftSpellsText] = useState('');
  const [draftInventoryText, setDraftInventoryText] = useState('');

  const handleView = () => {
    navigate(`/characters/${character.id}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onRequestDelete) onRequestDelete(character);
  };

  const spellsLines = useMemo(
    () => toSpellLines(character?.spellsCsv ?? character?.spells, classLabel),
    [character?.spellsCsv, character?.spells, classLabel]
  );
  const inventoryLines = useMemo(
    () => toInventoryLines(character?.inventoryCsv ?? character?.inventory, classLabel),
    [character?.inventoryCsv, character?.inventory, classLabel]
  );

  const handleToggleEdit = useCallback(
    (e) => {
      e.stopPropagation();
      setEditMode((v) => {
        const next = !v;
        if (next) {
          setDraftSpellsText(spellsLines.join('\n'));
          setDraftInventoryText(inventoryLines.join('\n'));
        }
        return next;
      });
    },
    [spellsLines, inventoryLines]
  );

  const effectiveSpells = editMode
    ? draftSpellsText
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean)
    : spellsLines;
  const effectiveInventory = editMode
    ? draftInventoryText
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean)
    : inventoryLines;

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        {classIcon ? (
          <div className={styles.classIconBadge} title={classLabel} aria-hidden>
            <img src={classIcon} alt="" className={styles.classIconImg} />
          </div>
        ) : null}
        <EditablePortrait
          characterId={character.id}
          portraitUrl={character.portraitUrl || character.portraitImage || ''}
          onUpdated={onPortraitUpdated}
          variant="card"
          alt={character.name ? `Портрет: ${character.name}` : 'Портрет персонажа'}
        />
        <span className={styles.levelBadge} title={`Уровень ${level}`}>
          Ур. {level}
        </span>
        <div className={styles.overlay}>
          <div className={styles.overlayInner}>
            <button type="button" className={styles.overlayBtn} onClick={handleView}>
              <IconEye />
              Просмотреть
            </button>
            <button
              type="button"
              className={styles.overlayBtnDanger}
              onClick={handleDeleteClick}
              aria-label={`Удалить ${character.name || 'персонажа'}`}
            >
              <IconTrash />
              Удалить
            </button>
          </div>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.charName}>{character.name || 'Без имени'}</h3>
          <button
            type="button"
            className={styles.editBtn}
            onClick={handleToggleEdit}
            aria-label={editMode ? 'Закрыть редактирование' : 'Редактировать'}
          >
            <IconPencil />
          </button>
        </div>
        <div className={styles.meta}>
          <span className={styles.className}>{classLabel}</span>
          <span className={styles.metaDot} aria-hidden>
            ·
          </span>
          <span className={styles.raceName}>{raceLabel}</span>
        </div>
        {createdLabel ? <p className={styles.createdAt}>Создан: {createdLabel}</p> : null}

        <div className={styles.lists}>
          <div className={styles.listBlock}>
            <div className={styles.listTitle}>Заклинания</div>
            {editMode ? (
              <textarea
                className={styles.textarea}
                value={draftSpellsText}
                onChange={(e) => setDraftSpellsText(e.target.value)}
                rows={4}
                aria-label="Заклинания (по одному в строке)"
              />
            ) : (
              <ul className={styles.list}>
                {effectiveSpells?.length > 0 ? (
                  effectiveSpells.map((line, idx) => (
                    <li key={`${idx}-${line}`} className={styles.listItem}>
                      {line}
                    </li>
                  ))
                ) : (
                  <li className={styles.listItemMuted}>Заклинания не выбраны</li>
                )}
              </ul>
            )}
          </div>

          <div className={styles.listBlock}>
            <div className={styles.listTitle}>Инвентарь</div>
            {editMode ? (
              <textarea
                className={styles.textarea}
                value={draftInventoryText}
                onChange={(e) => setDraftInventoryText(e.target.value)}
                rows={4}
                aria-label="Инвентарь (по одному предмету в строке)"
              />
            ) : (
              <ul className={styles.list}>
                {effectiveInventory?.length > 0 ? (
                  effectiveInventory.map((line, idx) => (
                    <li key={`${idx}-${line}`} className={styles.listItem}>
                      {line}
                    </li>
                  ))
                ) : (
                  <li className={styles.listItemMuted}>Инвентарь пуст</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
