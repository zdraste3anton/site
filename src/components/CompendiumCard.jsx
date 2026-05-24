import React from 'react';
import styles from './CompendiumCard.module.css';

export default function CompendiumCard({ item }) {
  const accent = item.accent || 'orange';

  return (
    <article className={`${styles.card} ${styles[accent]}`}>
      <div className={styles.iconWrap}>
        <img src={item.icon} alt="" className={styles.iconImg} />
      </div>
      <h3 className={styles.name}>{item.name}</h3>
      <p className={styles.description}>{item.description}</p>
      <ul className={styles.tags}>
        {item.tags.map((tag) => (
          <li key={tag} className={styles.tag}>
            {tag}
          </li>
        ))}
      </ul>
    </article>
  );
}
