import React, { useId, useMemo, useState } from 'react';
import { normalizeRaceData } from '../utils/normalizeRaceData';
import styles from './RaceCard.module.css';

export default function RaceCard({ race }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const n = useMemo(() => normalizeRaceData(race), [race]);
  const accent = n.accent || 'orange';

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
          <img src={n.icon} alt="" className={styles.iconImg} />
        </span>
        <span className={styles.headMain}>
          <span className={styles.titleRow}>
            <span className={styles.name}>{n.name}</span>
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
          {n.summaryLine ? <p className={styles.summary}>{n.summaryLine}</p> : null}
          {n.previewBadges.length > 0 ? (
            <span className={styles.previewBadges}>
              {n.previewBadges.map((b, i) => (
                <span key={`${b}-${i}`} className={styles.miniBadge}>
                  {b}
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
            <p className={styles.desc}>{n.description || 'Описание не указано.'}</p>
          </div>

          <div className={styles.detailsGrid}>
            <div className={`${styles.block} ${styles.blockFull} ${styles.blockBonuses}`.trim()}>
              <h4 className={styles.blockTitle}>Бонусы к характеристикам</h4>
              {n.bonuses.length > 0 ? (
                <ul className={styles.bonusList}>
                  {n.bonuses.map((line, i) => (
                    <li key={`${line}-${i}`} className={styles.bonusChip}>
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>Бонусы не указаны</p>
              )}
            </div>

            <div className={`${styles.block} ${styles.blockFull}`.trim()}>
              <h4 className={styles.blockTitle}>Сложность для новичка</h4>
              <div className={styles.difficultyRow}>
                <span className={styles.stars}>{n.difficultyStars}</span>
                <div className={styles.difficultyText}>
                  <span className={styles.difficultyLabel}>{n.difficultyLabel}</span>
                  <span className={styles.difficultyHint}>{n.difficultyHint}</span>
                </div>
              </div>
            </div>

            {n.traits.length > 0 ? (
              <div className={`${styles.block} ${styles.blockFull}`.trim()}>
                <h4 className={styles.blockTitle}>Расовые особенности</h4>
                <ul className={styles.list}>
                  {n.traits.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {n.recommendedClasses.length > 0 ? (
              <div className={`${styles.block} ${styles.blockFull}`.trim()}>
                <h4 className={styles.blockTitle}>Рекомендуемые классы</h4>
                <div className={styles.pills}>
                  {n.recommendedClasses.map((c) => (
                    <span key={c} className={styles.pill}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className={`${styles.block} ${styles.blockFull}`.trim()}>
              <h4 className={styles.blockTitle}>Стиль игры</h4>
              <p className={styles.playStyle}>{n.playStyle}</p>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
