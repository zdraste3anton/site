import React from 'react';
import styles from './DashboardWhySection.module.css';

const POINTS = [
  {
    id: 'speed',
    title: 'Быстрая генерация',
    text: 'Меньше рутины — больше игры. Поток собран так, чтобы не терять нить истории.',
  },
  {
    id: 'unique',
    title: 'Уникальные персонажи',
    text: 'Каждый герой получает свой голос, мотивацию и визуальный образ.',
  },
  {
    id: 'storage',
    title: 'Удобное хранение',
    text: 'Сохранённые билды всегда под рукой в профиле — без файловых куч на диске.',
  },
  {
    id: 'pdf',
    title: 'Готовый PDF',
    text: 'Экспорт для стола или печати — аккуратная вёрстка без ручной сборки.',
  },
];

export default function DashboardWhySection() {
  return (
    <section className={styles.section} aria-labelledby="dash-why-title">
      <h2 id="dash-why-title" className={styles.title}>
        Почему CharacterForge
      </h2>
      <ul className={styles.list}>
        {POINTS.map((p) => (
          <li key={p.id} className={styles.item}>
            <span className={styles.dot} aria-hidden />
            <div>
              <h3 className={styles.itemTitle}>{p.title}</h3>
              <p className={styles.itemText}>{p.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
