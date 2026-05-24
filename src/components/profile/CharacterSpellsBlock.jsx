import React, { useMemo, useCallback } from 'react';
import styles from './CharacterSheetBlocks.module.css';

function isCantrip(sp) {
  if (sp.level === 0) return true;
  const t = String(sp.levelTag || '');
  return t.includes('аговор') || t.toLowerCase().includes('cantrip');
}

function isFirstLevel(sp) {
  if (sp.level === 1) return true;
  const t = String(sp.levelTag || '');
  return t.includes('1') && (t.includes('ур') || t.includes('уров'));
}

function levelTagFor(level) {
  return level === 0 ? 'Заговор' : `${level} ур.`;
}

export default function CharacterSpellsBlock({
  spells,
  editable,
  nonSpellcaster,
  onAddSpell,
  onPatchSpell,
  onRemoveSpell,
}) {
  const list = useMemo(() => (Array.isArray(spells) ? spells : []), [spells]);

  const { cantrips, firstLevel } = useMemo(() => {
    const c = list.filter(isCantrip);
    const f = list.filter((sp) => !isCantrip(sp) && isFirstLevel(sp));
    return { cantrips: c, firstLevel: f };
  }, [list]);

  const handleLevelChange = useCallback(
    (sp, nextLevel) => {
      const n = Number(nextLevel);
      if (!Number.isFinite(n) || (n !== 0 && n !== 1)) return;
      onPatchSpell?.(sp.id, { level: n, levelTag: levelTagFor(n) });
    },
    [onPatchSpell]
  );

  if (!list.length && !editable) {
    if (nonSpellcaster) {
      return (
        <section className={`${styles.panel} ${styles.spellsPanel}`} aria-label="Заклинания">
          <h2 className={styles.panelTitle}>Заклинания</h2>
          <div className={styles.spellsEmpty}>
            <span className={styles.spellsEmptyIcon} aria-hidden>
              ◆
            </span>
            <p className={styles.spellsEmptyTitle}>Нет доступных заклинаний</p>
            <p className={styles.spellsEmptyText}>
              У этого класса нет известных заговоров и заклинаний на стартовом листе (D&D 5e).
            </p>
          </div>
        </section>
      );
    }
    return (
      <section className={`${styles.panel} ${styles.spellsPanel}`} aria-label="Заклинания">
        <h2 className={styles.panelTitle}>Заклинания</h2>
        <div className={styles.spellsEmpty}>
          <span className={styles.spellsEmptyIcon} aria-hidden>
            ✦
          </span>
          <p className={styles.spellsEmptyTitle}>Нет известных заклинаний</p>
          <p className={styles.spellsEmptyText}>
            Список пуст. Включите «Редактировать», чтобы добавить заговоры и заклинания вручную.
          </p>
        </div>
      </section>
    );
  }

  const renderSpellRow = (sp) => {
    if (editable) {
      return (
        <li key={sp.id || sp.name} className={styles.spellRow}>
          <span className={styles.listGoldBullet} aria-hidden>
            ◆
          </span>
          <div className={styles.spellEditMain}>
            <input
              type="text"
              className={styles.spellNameInput}
              value={sp.name || ''}
              onChange={(e) => onPatchSpell?.(sp.id, { name: e.target.value })}
              aria-label="Название заклинания"
            />
            <input
              type="text"
              className={styles.spellSchoolInput}
              value={sp.school || ''}
              onChange={(e) => onPatchSpell?.(sp.id, { school: e.target.value })}
              aria-label="Школа"
            />
          </div>
          <div className={styles.spellEditActions}>
            <select
              className={styles.spellLevelSelect}
              value={isCantrip(sp) ? 0 : 1}
              onChange={(e) => handleLevelChange(sp, e.target.value)}
              aria-label="Уровень заклинания"
            >
              <option value={0}>Заговор</option>
              <option value={1}>1 уровень</option>
            </select>
            <button
              type="button"
              className={styles.spellRemoveBtn}
              onClick={() => onRemoveSpell?.(sp.id)}
              aria-label="Удалить заклинание"
            >
              ×
            </button>
          </div>
        </li>
      );
    }
    return (
      <li key={sp.id || sp.name} className={styles.spellRow}>
        <span className={styles.listGoldBullet} aria-hidden>
          ◆
        </span>
        <div className={styles.spellMain}>
          <span className={styles.spellName}>{sp.name}</span>
          <span className={styles.spellSchool}>{sp.school || '—'}</span>
        </div>
        <span className={styles.spellTag}>{sp.levelTag || 'Заговор'}</span>
      </li>
    );
  };

  return (
    <section className={`${styles.panel} ${styles.spellsPanel}`} aria-label="Заклинания">
      <h2 className={styles.panelTitle}>Заклинания</h2>
      <div className={styles.spellSections}>
        <div className={styles.spellSection}>
          <h3 className={styles.spellSectionTitle}>Заговоры</h3>
          <ul className={styles.spellList}>
            {cantrips.length ? (
              cantrips.map(renderSpellRow)
            ) : (
              <li className={styles.spellRowMuted}>Нет заговоров в списке.</li>
            )}
          </ul>
          {editable ? (
            <button type="button" className={styles.spellAddBtn} onClick={() => onAddSpell?.(0)}>
              + Добавить заговор
            </button>
          ) : null}
        </div>
        <div className={styles.spellSection}>
          <h3 className={styles.spellSectionTitle}>Заклинания 1 уровня</h3>
          <ul className={styles.spellList}>
            {firstLevel.length ? (
              firstLevel.map(renderSpellRow)
            ) : (
              <li className={styles.spellRowMuted}>Нет заклинаний 1 уровня в сохранённом наборе.</li>
            )}
          </ul>
          {editable ? (
            <button type="button" className={styles.spellAddBtn} onClick={() => onAddSpell?.(1)}>
              + Добавить заклинание 1 уровня
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
