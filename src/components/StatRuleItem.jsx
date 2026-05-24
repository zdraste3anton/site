import React from 'react';
import GoldRuleMark from './GoldRuleMark';
import styles from './StatRuleItem.module.css';

export default function StatRuleItem({ abbr, name, children }) {
  return (
    <article className={styles.item}>
      <GoldRuleMark className={styles.mark} />
      <div>
        <h3 className={styles.title}>
          {name} <span className={styles.abbr}>({abbr})</span>
        </h3>
        <div className={styles.body}>{children}</div>
      </div>
    </article>
  );
}
