import React from 'react';
import {
  SPELL_LEVEL_OPTIONS,
  SPELL_SCHOOL_OPTIONS,
  SPELL_CLASS_OPTIONS,
} from '../data/spellFilterConfig';
import styles from './FiltersPanel.module.css';

function FilterSection({ title, options, selected, onToggle }) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{title}</legend>
      <ul className={styles.checkboxList}>
        {options.map((opt) => (
          <li key={opt}>
            <label className={styles.label}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selected.has(opt)}
                onChange={() => onToggle(opt)}
              />
              <span>{opt}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

export default function FiltersPanel({
  selectedLevels,
  selectedSchools,
  selectedClasses,
  onToggleLevel,
  onToggleSchool,
  onToggleClass,
  onReset,
}) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Фильтры</h2>

      <FilterSection
        title="Уровень"
        options={SPELL_LEVEL_OPTIONS}
        selected={selectedLevels}
        onToggle={onToggleLevel}
      />

      <FilterSection
        title="Школа магии"
        options={SPELL_SCHOOL_OPTIONS}
        selected={selectedSchools}
        onToggle={onToggleSchool}
      />

      <FilterSection
        title="Класс"
        options={SPELL_CLASS_OPTIONS}
        selected={selectedClasses}
        onToggle={onToggleClass}
      />

      <button type="button" className={styles.resetBtn} onClick={onReset}>
        Сбросить фильтры
      </button>
    </div>
  );
}
