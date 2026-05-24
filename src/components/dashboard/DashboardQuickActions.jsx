import React from 'react';
import { Link } from 'react-router-dom';
import styles from './DashboardQuickActions.module.css';

function IconWand() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M15 4l5 5M4 20l7-7M9 15l-2 2M12 12l1-1M14 10l1-1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M8 8l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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

function IconScroll() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M8 21h12a2 2 0 002-2v-4H8v6zM8 3H6a2 2 0 00-2 2v14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const ACTIONS = [
  {
    to: '/generator',
    title: 'Создать персонажа',
    desc: 'Запустить мастер генерации: раса, класс, история и портрет.',
    icon: <IconWand />,
    accent: 'gold',
  },
  {
    to: '/compendium',
    title: 'Открыть справочник',
    desc: 'Расы, классы и заклинания D&D 5e в удобном виде.',
    icon: <IconBook />,
    accent: 'violet',
  },
  {
    to: '/profile',
    title: 'Профиль',
    desc: 'Аккаунт, сохранённые герои и быстрый доступ к листам.',
    icon: <IconUser />,
    accent: 'purple',
  },
  {
    to: '/compendium?section=rules',
    title: 'Правила',
    desc: 'Основные механики D&D: характеристики, модификаторы, проверки, броски и ход игры',
    icon: <IconScroll />,
    accent: 'ember',
  },
];

export default function DashboardQuickActions() {
  return (
    <section className={styles.section} aria-labelledby="dash-quick-title">
      <div className={styles.sectionHead}>
        <h2 id="dash-quick-title" className={styles.sectionTitle}>
          Быстрые действия
        </h2>
        <p className={styles.sectionLead}>Один клик — и вы уже там, где нужно.</p>
      </div>
      <div className={styles.grid}>
        {ACTIONS.map((item) => (
          <Link key={item.title} to={item.to} className={`${styles.card} ${styles[item.accent]}`}>
            <span className={styles.icon} aria-hidden>
              {item.icon}
            </span>
            <span className={styles.cardBody}>
              <span className={styles.cardTitle}>{item.title}</span>
              <span className={styles.cardDesc}>{item.desc}</span>
            </span>
            <span className={styles.chevron} aria-hidden>
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
