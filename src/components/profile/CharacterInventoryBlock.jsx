import React from 'react';
import styles from './CharacterSheetBlocks.module.css';

export default function CharacterInventoryBlock({ items, editable, onChangeLine, onAddLine }) {
  const list = Array.isArray(items) ? items : [];

  if (!list.length && !editable) {
    return (
      <section className={`${styles.panel} ${styles.inventoryPanel}`} aria-label="Инвентарь">
        <h2 className={styles.panelTitle}>Базовый инвентарь</h2>
        <p className={styles.inventoryEmpty}>Пока пусто.</p>
      </section>
    );
  }

  return (
    <section className={`${styles.panel} ${styles.inventoryPanel}`} aria-label="Инвентарь">
      <h2 className={styles.panelTitle}>Базовый инвентарь</h2>
      <ul className={styles.inventoryList}>
        {list.map((line, idx) => (
          <li key={`${idx}-${String(line)}`} className={styles.inventoryRow}>
            {editable ? (
              <>
                <span className={styles.listGoldBullet} aria-hidden>
                  ◆
                </span>
                <input
                  type="text"
                  className={styles.inventoryInput}
                  value={line}
                  onChange={(e) => onChangeLine(idx, e.target.value)}
                  aria-label={`Предмет ${idx + 1}`}
                />
              </>
            ) : (
              <span className={styles.inventoryText}>
                <span className={styles.listGoldBullet} aria-hidden>
                  ◆
                </span>
                <span>{line}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      {editable && onAddLine ? (
        <button type="button" className={styles.inventoryAddBtn} onClick={onAddLine}>
          + Добавить предмет
        </button>
      ) : null}
    </section>
  );
}
