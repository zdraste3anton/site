import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import PageShell from './components/PageShell';
import ParticleBackground from './components/ParticleBackground';
import styles from './Home.module.css';

export default function Home() {
  return (
    <PageShell variant="main">
      <ParticleBackground variant="viewport" />
      <Header />
      <main className={styles.main}>
        <Hero />
        <Features />
      </main>
    </PageShell>
  );
}
