import React from 'react';
import styles from './ProfileSidebar.module.css';

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

export default function ProfileSidebar({ displayName, roleLabel, onLogout }) {
  return (
    <aside className={styles.card}>
      <div className={styles.avatar} aria-hidden>
        <IconUser />
      </div>
      <h2 className={styles.name}>{displayName}</h2>
      <p className={styles.role}>{roleLabel}</p>
      <div className={styles.status}>
        <span className={styles.statusDot} />
        Онлайн
      </div>
      <button type="button" className={styles.logout} onClick={onLogout}>
        Выйти
      </button>
    </aside>
  );
}
