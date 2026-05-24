import React from 'react';
import styles from './FeatureCard.module.css';

export default function FeatureCard({ icon, title, description, accent = 'orange' }) {
  return (
    <article className={`${styles.card} ${styles[accent]}`}>
      <div className={styles.iconWrap} aria-hidden>
        {icon}
      </div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDesc}>{description}</p>
    </article>
  );
}
