import React from 'react';
import SpellCard from './SpellCard';
import styles from './SpellGrid.module.css';

export default function SpellGrid({ spells }) {
  if (!spells?.length) {
    return <p className={styles.empty}>Ничего не найдено. Измените фильтры или запрос.</p>;
  }

  
  const animKey = `${spells.length}-${spells[0]?.id ?? 'x'}-${spells.at(-1)?.id ?? 'y'}`;

  return (
    <div key={animKey} className={styles.grid}>
      {spells.map((s, index) => (
        <SpellCard key={s.id} spell={s} index={index} />
      ))}
    </div>
  );
}
