import React, { useId, useState } from 'react';
import styles from './ClassCard.module.css';

export default function ClassCard({ dndClass }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  const accent = dndClass.accent || 'orange';
  const roleInParty = dndClass.roleInParty || '';
  const primaryStats = Array.isArray(dndClass.primaryStats) ? dndClass.primaryStats : [];
  const level1Features = Array.isArray(dndClass.level1Features) ? dndClass.level1Features : [];

  return (
    <article
      className={`${styles.card} ${styles[accent] ?? ''} ${open ? styles.cardExpanded : ''}`.trim()}
    >
      <button
        type="button"
        className={styles.hit}
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.iconWrap}>
          <img src={dndClass.icon} alt="" className={styles.iconImg} />
        </span>
        <span className={styles.headMain}>
          <span className={styles.titleRow}>
            <span className={styles.name}>{dndClass.name}</span>
            <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`.trim()} aria-hidden>
              <svg className={styles.chevronSvg} viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path
                  d="M6 9l6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
          <p className={styles.summary}>{dndClass.description}</p>
          {dndClass.tags?.length > 0 ? (
            <span className={styles.previewBadges}>
              {dndClass.tags.map((tag) => (
                <span key={tag} className={styles.miniBadge}>
                  {tag}
                </span>
              ))}
            </span>
          ) : null}
        </span>
      </button>

      {open ? (
        <div id={detailsId} className={styles.details}>
          <div className={`${styles.block} ${styles.blockFull}`.trim()}>
            <h4 className={styles.blockTitle}>Описание</h4>
            <p className={styles.desc}>{dndClass.description || 'Описание не указано.'}</p>
          </div>

          <div className={styles.detailsGrid}>
            {roleInParty ? (
              <div className={`${styles.block} ${styles.blockFull}`.trim()}>
                <h4 className={styles.blockTitle}>Роль в группе</h4>
                <p className={styles.desc}>{roleInParty}</p>
              </div>
            ) : null}

            {primaryStats.length > 0 ? (
              <div className={`${styles.block} ${styles.blockFull}`.trim()}>
                <h4 className={styles.blockTitle}>Приоритетные характеристики</h4>
                <ul className={styles.statList}>
                  {primaryStats.map((line) => (
                    <li key={line} className={styles.statChip}>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {level1Features.length > 0 ? (
              <div className={`${styles.block} ${styles.blockFull}`.trim()}>
                <h4 className={styles.blockTitle}>Умения на 1 уровне</h4>
                <ul className={styles.list}>
                  {level1Features.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
