import React, { useId, useMemo, useState } from 'react';
import {
  normalizeSpellMechanics,
  schoolDisplayFromSpell,
  spellCollapsedTypeLabel,
} from '../utils/spellMechanics';
import styles from './SpellCard.module.css';

function normalizeSchoolName(s) {
  return String(s || '').trim().toLowerCase();
}

function schoolToColor(school) {
  const v = normalizeSchoolName(school);
  if (v.includes('воплощ') || v.includes('evocation')) return '#ef4444';
  if (v.includes('очар') || v.includes('enchant')) return '#ec4899';
  if (v.includes('некром') || v.includes('necrom')) return '#a855f7';
  if (v.includes('ограж') || v.includes('abjur')) return '#3b82f6';
  if (v.includes('иллюз') || v.includes('illusion')) return '#eab308';
  if (v.includes('преобраз') || v.includes('transmut')) return '#f97316';
  if (v.includes('вызов') || v.includes('conjur')) return '#22c55e';
  if (v.includes('прориц') || v.includes('divinat')) return '#06b6d4';
  return '#d49e51';
}

function hexToRgbTriplet(hex) {
  const s = String(hex).trim().replace('#', '');
  if (s.length !== 6 || !/^[0-9a-f]+$/i.test(s)) return '212, 158, 81';
  const n = parseInt(s, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function formatMechCell(val) {
  const t = String(val ?? '').trim();
  return t || 'нет';
}

function MechRows({ mech }) {
  const rows = [
    ['Уровень', mech.levelLabel],
    ['Школа', mech.school],
    ['Кубики', formatMechCell(mech.dice)],
    ['Тип', formatMechCell(mech.mechanicType)],
    ['Тип урона / эффекта', formatMechCell(mech.damageType)],
    ['Спасбросок', formatMechCell(mech.savingThrow)],
    ['Дистанция', formatMechCell(mech.range)],
    ['Длительность', formatMechCell(mech.duration)],
    ['Краткий эффект', formatMechCell(mech.effect)],
  ];
  return (
    <div className={styles.mechTable}>
      {rows.map(([label, val]) => (
        <div key={label} className={styles.mechRow}>
          <span className={styles.mechLabel}>{label}</span>
          <span className={styles.mechValue}>{val}</span>
        </div>
      ))}
    </div>
  );
}

export default function SpellCard({ spell, index = 0 }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const colorSchool = schoolDisplayFromSpell(spell) || spell.school || spell.schools?.[0] || '';
  const schoolRgb = hexToRgbTriplet(schoolToColor(colorSchool));
  const mech = useMemo(() => normalizeSpellMechanics(spell), [spell]);
  const collapsedType = useMemo(() => spellCollapsedTypeLabel(mech), [mech]);
  const schools = spell.schools || [];
  const classes = spell.classes || [];

  return (
    <article
      className={`${styles.card} ${styles.cardEnter} ${open ? styles.cardExpanded : ''}`.trim()}
      style={{
        '--school-rgb': schoolRgb,
        '--stagger-delay': `${index * 0.05}s`,
      }}
    >
      <button
        type="button"
        className={styles.hit}
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.headMain}>
          <span className={styles.titleRow}>
            <span className={styles.name}>{spell.name}</span>
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
          <p className={styles.summary}>{spell.description}</p>
          <div className={styles.collapsedLines} aria-label="Краткая механика">
            <div className={styles.collapsedLine}>
              <span className={styles.collapsedLabel}>Уровень:</span>
              <span className={styles.collapsedValue}>{mech.levelLabel}</span>
            </div>
            <div className={styles.collapsedLine}>
              <span className={styles.collapsedLabel}>Школа:</span>
              <span className={styles.collapsedValue}>{mech.school}</span>
            </div>
            <div className={styles.collapsedLine}>
              <span className={styles.collapsedLabel}>Тип:</span>
              <span className={styles.collapsedValue}>{collapsedType || 'нет'}</span>
            </div>
          </div>
        </span>
      </button>

      {open ? (
        <div id={detailsId} className={styles.details}>
          <div className={`${styles.block} ${styles.blockFull}`}>
            <h4 className={styles.blockTitle}>Описание</h4>
            <p className={styles.desc}>{spell.description || 'Описание не указано.'}</p>
          </div>

          <div className={`${styles.block} ${styles.blockFull}`}>
            <h4 className={styles.blockTitle}>Механика</h4>
            <MechRows mech={mech} />
          </div>

          <div className={`${styles.block} ${styles.blockFull}`}>
            <h4 className={styles.blockTitle}>Классы</h4>
            {classes.length > 0 ? (
              <div className={styles.pills}>
                {classes.map((c) => (
                  <span key={c} className={styles.pill}>
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.muted}>Не указано</p>
            )}
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.block}>
              <h4 className={styles.blockTitle}>Школа</h4>
              {schools.length > 0 ? (
                <div className={styles.pills}>
                  {schools.map((s) => (
                    <span key={s} className={styles.schoolChip}>
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={styles.muted}>Не указано</p>
              )}
            </div>
            <div className={styles.block}>
              <h4 className={styles.blockTitle}>Уровень</h4>
              <p className={styles.desc}>{mech.levelLabel}</p>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
