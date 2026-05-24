import React from 'react';
import styles from './CompendiumTabs.module.css';

export default function CompendiumTabs({ tabs, activeId, onSelect }) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Разделы справочника">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          className={`${styles.tab} ${activeId === tab.id ? styles.tabActive : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
