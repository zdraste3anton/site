import React from 'react';
import FeatureCard from './FeatureCard';
import styles from './Features.module.css';

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M4 19.5A2.5 2.5 0 016.5 17H20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 7h8M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M12 3l1.2 4.2L17 8.5l-3.8 1.3L12 14l-1.2-4.2L7 8.5l3.8-1.3L12 3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M19 15l.6 2.1L21.5 18l-1.9.7L19 21l-.6-2.3L16.5 18l1.9-.9L19 15z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M5 17l.5 1.7L7 19l-1.5.6L5 21.5 4 19l1.5-.6L5 17z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

const FEATURES = [
  {
    id: 'knowledge',
    title: 'База знаний',
    description:
      'Полный справочник правил D&D 5e с интерактивными примерами и подсказками для новичков.',
    icon: <IconBook />,
    accent: 'orange',
  },
  {
    id: 'ai',
    title: 'ИИ Генератор',
    description:
      'Искусственный интеллект поможет создать уникального персонажа с историей и характером.',
    icon: <IconSparkle />,
    accent: 'purple',
  },
  {
    id: 'cabinet',
    title: 'Личный кабинет',
    description:
      'Сохраняйте и редактируйте свои персонажи, следите за их развитием в кампании.',
    icon: <IconUser />,
    accent: 'violet',
  },
];

export default function Features() {
  return (
    <section className={styles.section} aria-label="Возможности сервиса">
      <div className={styles.container}>
        <div className={styles.grid}>
          {FEATURES.map((item) => (
            <FeatureCard
              key={item.id}
              icon={item.icon}
              title={item.title}
              description={item.description}
              accent={item.accent}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
