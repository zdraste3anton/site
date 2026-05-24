import React from 'react';
import { Link } from 'react-router-dom';
import styles from './DashboardHeroSection.module.css';

export default function DashboardHeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="dash-welcome-title">
      <div className={styles.heroGlow} aria-hidden />
      <div className={styles.heroInner}>
        <p className={styles.eyebrow}>CharacterForge</p>
        <h1 id="dash-welcome-title" className={styles.title}>
          Добро пожаловать в CharacterForge
        </h1>
        <p className={styles.subtitle}>
          Создавайте персонажей, исследуйте классы и заклинания, сохраняйте свои лучшие билды
        </p>
        <div className={styles.actions}>
          <Link to="/generator" className={styles.btnPrimary}>
            Создать персонажа
          </Link>
          <Link to="/compendium" className={styles.btnSecondary}>
            Открыть справочник
          </Link>
        </div>
      </div>
    </section>
  );
}
