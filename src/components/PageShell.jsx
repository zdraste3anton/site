import React from 'react';
import styles from './PageShell.module.css';


export default function PageShell({ variant, children, className }) {
  const theme = variant === 'auth' ? styles.authTheme : styles.mainTheme;
  return (
    <div className={`${styles.shell} ${theme} ${className || ''}`.trim()}>
      <div className={styles.bgImage} aria-hidden />
      <div className={styles.bgOverlay} aria-hidden />
      {children}
    </div>
  );
}
