import React from 'react';
import styles from './RulesSection.module.css';

export default function RulesSection({ title, subtitle, children }) {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <span className={styles.decorLine} aria-hidden />
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.decorLine} aria-hidden />
      </header>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      <div className={styles.panel}>{children}</div>
    </section>
  );
}
