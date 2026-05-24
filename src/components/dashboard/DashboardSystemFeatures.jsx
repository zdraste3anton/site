import React from 'react';
import styles from './DashboardSystemFeatures.module.css';

function IconQuill() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M12 19l7-7 3 3-7 7h-3v-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M18 13l-8-8-4 4 8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M4 4h7v7H4V4zM13 4h7v7h-7V4zM4 13h7v7H4v-7zM13 13h7v7h-7v-7z" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M6 3h12a2 2 0 012 2v16l-8-4-8 4V5a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPdf() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M7 3h7l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5M9 17l2-4m0 0l2 4m-2-4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M14.5 9.5l-2 6-2-6 6-2-6-2z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

const ITEMS = [
  {
    id: 'ai-story',
    title: 'ИИ создаёт историю',
    body: 'Биография, цели и крючки для мастера — в одном потоке, без пустых форм.',
    icon: <IconQuill />,
    tone: 'amber',
  },
  {
    id: 'stats',
    title: 'Характеристики подбираются сами',
    body: 'Система предлагает сбалансированный набор значений под класс и стиль игры.',
    icon: <IconGrid />,
    tone: 'violet',
  },
  {
    id: 'save',
    title: 'Сохранение в профиль',
    body: 'Готовых героев можно вернуть в любой момент и продолжить с того же места.',
    icon: <IconBookmark />,
    tone: 'purple',
  },
  {
    id: 'pdf',
    title: 'Экспорт в PDF',
    body: 'Аккуратный документ для стола или печати — без ручной вёрстки.',
    icon: <IconPdf />,
    tone: 'fire',
  },
  {
    id: 'wiki',
    title: 'Справочник рас, классов и заклинаний',
    body: 'Быстрый доступ к правилам 5e: сравнение вариантов без перелистывания книги.',
    icon: <IconCompass />,
    tone: 'moon',
  },
];

export default function DashboardSystemFeatures() {
  return (
    <section className={styles.section} aria-labelledby="dash-capabilities-title">
      <div className={styles.sectionHead}>
        <h2 id="dash-capabilities-title" className={styles.sectionTitle}>
          Возможности системы
        </h2>
        <p className={styles.sectionLead}>
          Всё, что нужно для старта кампании: от идеи до готового листа персонажа.
        </p>
      </div>
      <ul className={styles.grid}>
        {ITEMS.map((item) => (
          <li key={item.id} className={`${styles.card} ${styles[item.tone]}`}>
            <span className={styles.icon} aria-hidden>
              {item.icon}
            </span>
            <div className={styles.text}>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardBody}>{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
