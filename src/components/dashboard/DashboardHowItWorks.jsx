import React from 'react';
import styles from './DashboardHowItWorks.module.css';

const STEPS = [
  {
    n: 1,
    title: 'Выбери расу и класс',
    text: 'Задай основу героя: происхождение, класс и ключевые механики.',
  },
  {
    n: 2,
    title: 'Сгенерируй историю и характеристики',
    text: 'ИИ предложит предысторию и набор характеристик, которые можно принять или скорректировать.',
  },
  {
    n: 3,
    title: 'Настрой внешний вид',
    text: 'Портрет и детали образа — чтобы герой читался за столом с первого взгляда.',
  },
  {
    n: 4,
    title: 'Сохрани героя или экспортируй в PDF',
    text: 'Положи персонажа в профиль или выгрузи готовый лист для игры и печати.',
  },
];

export default function DashboardHowItWorks() {
  return (
    <section className={styles.section} aria-labelledby="dash-steps-title">
      <div className={styles.sectionHead}>
        <h2 id="dash-steps-title" className={styles.sectionTitle}>
          Как это работает
        </h2>
        <p className={styles.sectionLead}>Четыре шага от идеи до героя за столом.</p>
      </div>
      <ol className={styles.track}>
        {STEPS.map((step, i) => (
          <li key={step.n} className={styles.step}>
            <div className={styles.connector} aria-hidden>
              <span className={styles.badge}>{step.n}</span>
              {i < STEPS.length - 1 ? <span className={styles.spine} /> : null}
            </div>
            <div className={styles.panel}>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
