import React from 'react';
import CharacterCard from './CharacterCard';
import pageStyles from '../../pages/ProfilePage.module.css';

function EmptyIcon() {
  return (
    <div className={pageStyles.emptyIconWrap} aria-hidden>
      <svg className={pageStyles.emptyIcon} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="22" r="10" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <path
          d="M16 52c0-8.837 7.163-16 16-16s16 7.163 16 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          d="M44 28l6 6M50 28l-6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className={pageStyles.skeletonGrid} aria-busy="true" aria-label="Загрузка">
      {[1, 2, 3].map((k) => (
        <div key={k} className={pageStyles.skeletonCard} />
      ))}
    </div>
  );
}

export default function CharacterList({ characters, loading, onRequestDelete, onPortraitUpdated }) {
  if (loading) {
    return <ProfileSkeleton />;
  }

  const list = Array.isArray(characters) ? characters : [];

  if (!list.length) {
    return (
      <div className={pageStyles.emptyState}>
        <EmptyIcon />
        <p className={pageStyles.emptyTitle}>У вас пока нет персонажей</p>
        <p className={pageStyles.emptyHint}>
          Создайте героя в генераторе — история, лист и портрет в одном потоке. Кнопка «Создать нового героя»
          находится выше, под заголовком профиля.
        </p>
      </div>
    );
  }

  return (
    <div className={pageStyles.cardGrid}>
      {list.map((c) => (
        <CharacterCard
          key={c.id}
          character={c}
          onRequestDelete={onRequestDelete}
          onPortraitUpdated={onPortraitUpdated}
        />
      ))}
    </div>
  );
}
