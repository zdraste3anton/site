import React from 'react';
import styles from './DiceRow.module.css';

const STROKE = 'rgba(230, 232, 240, 0.78)';
const VB = '0 0 100 100';

function DieShape({ variant }) {
  const c = { fill: 'none', stroke: STROKE, strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' };

  switch (variant) {
    case 'd4':
      return (
        <svg viewBox={VB} className={styles.svg} aria-hidden>
          <path {...c} d="M50 14L16 82h68L50 14z" />
        </svg>
      );
    case 'd6':
      return (
        <svg viewBox={VB} className={styles.svg} aria-hidden>
          <rect {...c} x="22" y="22" width="56" height="56" rx="7" />
        </svg>
      );
    case 'd8':
      return (
        <svg viewBox={VB} className={styles.svg} aria-hidden>
          <path {...c} d="M50 16L84 50 50 84 16 50 50 16z" />
        </svg>
      );
    case 'd10':
      return (
        <svg viewBox={VB} className={styles.svg} aria-hidden>
          <path {...c} d="M50 12L90 86H10L50 12z" />
        </svg>
      );
    case 'd12':
      return (
        <svg viewBox={VB} className={styles.svg} aria-hidden>
          <path {...c} d="M50 14L82 32 74 72 26 72 18 32 50 14z" />
        </svg>
      );
    case 'd20':
      return (
        <svg viewBox={VB} className={styles.svg} aria-hidden>
          <path {...c} d="M50 8L90 32L90 68L50 92L10 68L10 32L50 8z" />
        </svg>
      );
    default:
      return null;
  }
}

const DICE = [
  {
    id: 'd4',
    num: '4',
    label: 'd4',
    text: 'Самый малый урон или простые бонусы, а ещё случайные таблицы.',
  },
  {
    id: 'd6',
    num: '6',
    label: 'd6',
    text: 'Урон лёгкого оружия и многих заклинаний — самая ходовая кость.',
  },
  {
    id: 'd8',
    num: '8',
    label: 'd8',
    text: 'Урон большинства одноручного оружия, способности классов и кости хитов.',
  },
  {
    id: 'd10',
    num: '10',
    label: 'd10',
    text: 'Тяжёлые удары и процентные броски; пара таких костей даёт d100.',
  },
  {
    id: 'd12',
    num: '12',
    label: 'd12',
    text: 'Рубящий урон двуручников и кость здоровья варвара.',
  },
  {
    id: 'd20',
    num: '20',
    label: 'd20',
    text: 'Решает, успешно ли действие: проверки, атаки и спасброски.',
  },
];

export default function DiceRow() {
  return (
    <div className={styles.block}>
      <p className={styles.intro}>
        Хотя <strong>d20</strong> решает судьбу ваших действий, другие кости определяют силу эффектов и урона. В
        записях встречается обозначение <strong>XdY</strong>: <strong>X</strong> — сколько кубиков бросить,{' '}
        <strong>Y</strong> — число граней у каждого.
      </p>
      <div className={styles.row}>
        {DICE.map((d) => (
          <div key={d.id} className={styles.die}>
            <div className={styles.iconWrap}>
              <DieShape variant={d.id} />
              <span
                className={`${styles.faceNum} ${d.num.length >= 2 ? styles.faceNumWide : ''}`}
              >
                {d.num}
              </span>
            </div>
            <p className={styles.caption}>
              <span className={styles.dieLabel}>{d.label}</span>
              {d.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
