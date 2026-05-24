import React from 'react';
import styles from './CardGrid.module.css';

export default function CardGrid({ items, renderItem, emptyMessage, variant }) {
  if (!items?.length) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  const gridClass =
    variant === 'races' || variant === 'classes'
      ? `${styles.grid} ${styles.gridRaces}`.trim()
      : styles.grid;

  return <div className={gridClass}>{items.map((item) => renderItem(item))}</div>;
}
