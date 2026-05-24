import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Hero.module.css';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className={styles.hero} id="top" aria-labelledby="hero-title">
      <div className={styles.content}>
        <div className={styles.glass}>
          <h1 id="hero-title" className={styles.title}>
            Создай свою легенду с ИИ
          </h1>
          <p className={styles.subtitle}>
            Умный помощник для игроков и Мастеров D&D. Быстрая генерация предысторий, характеристик и
            портретов.
          </p>
          <button type="button" className={styles.cta} onClick={() => navigate('/login')}>
            Начать путешествие
          </button>
        </div>
      </div>
    </section>
  );
}
