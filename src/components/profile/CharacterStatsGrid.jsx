import React from 'react';
import { abilityModifier, formatModifier } from '../../utils/dndModifiers';
import styles from './CharacterSheetBlocks.module.css';

const ORDER = [
  ['str', 'СИЛ'],
  ['dex', 'ЛОВ'],
  ['con', 'ТЕЛ'],
  ['int', 'ИНТ'],
  ['wis', 'МУД'],
  ['cha', 'ХАР'],
];

export default function CharacterStatsGrid({ attributes, editable, onScoreChange }) {
  const attrs = attributes || {};
  return (
    <section className={styles.panel} aria-label="Характеристики">
      <h2 className={styles.panelTitle}>Характеристики</h2>
      <div className={styles.statGrid}>
        {ORDER.map(([key, label]) => {
          const score = Number(attrs[key]) || 10;
          const mod = formatModifier(abilityModifier(score));
          return (
            <div key={key} className={styles.statCell}>
              <span className={styles.statLabel}>{label}</span>
              {editable && onScoreChange ? (
                <input
                  className={styles.statScoreInput}
                  type="number"
                  min={1}
                  max={30}
                  value={score}
                  onChange={(e) => onScoreChange(key, e.target.value)}
                  aria-label={`${label}, значение`}
                />
              ) : (
                <span className={styles.statScore}>{score}</span>
              )}
              <span className={styles.statMod}>{mod}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
