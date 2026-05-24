import React from 'react';
import { buildSkillRows } from '../../utils/characterSheetDerived';
import styles from './CharacterSheetBlocks.module.css';

export default function CharacterSkillsBlock({ character, editable, onSkillBonusChange }) {
  const rows = buildSkillRows(character);
  return (
    <section className={styles.panel} aria-label="Навыки">
      <h2 className={styles.panelTitle}>Навыки</h2>
      <ul className={styles.skillList}>
        {rows.map((row) => (
          <li
            key={row.id}
            className={`${styles.skillRow} ${row.highlighted ? styles.skillRowHot : ''}`.trim()}
          >
            <span className={styles.skillName}>{row.name}</span>
            {editable && onSkillBonusChange ? (
              <input
                type="number"
                className={styles.skillBonusInput}
                value={row.value}
                onChange={(e) => onSkillBonusChange(row.id, e.target.value)}
                aria-label={`Бонус навыка ${row.name}`}
              />
            ) : (
              <span className={styles.skillBonus}>{row.bonus}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
