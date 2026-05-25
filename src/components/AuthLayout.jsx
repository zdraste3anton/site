import React from 'react';
import Header from './Header';
import ParticleBackground from './ParticleBackground';
import PageShell from './PageShell';
import styles from './AuthLayout.module.css';

export default function AuthLayout({ children }) {
  return (
    <PageShell variant="auth">
      <ParticleBackground variant="viewport" />
      <Header />
      <main className={styles.main}>
        <div className={styles.cardContainer}>{children}</div>
      </main>
    </PageShell>
  );
}
