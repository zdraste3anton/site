import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './DashboardDiceWidget.module.css';

const ROLL_MS = 1000;
const SPIN_STEPS = 34;
const CONFETTI_PIECES = 14;

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function buildSpinSchedule(durationMs, steps) {
  const raw = [];
  for (let i = 0; i < steps; i += 1) {
    const p = steps === 1 ? 1 : i / (steps - 1);
    const eased = 1 - (1 - p) ** 2.6;
    raw.push(Math.round(eased * durationMs));
  }
  return [...new Set(raw)].sort((a, b) => a - b);
}

function randomFace() {
  return Math.floor(Math.random() * 20) + 1;
}

export default function DashboardDiceWidget() {
  const [display, setDisplay] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [outcome, setOutcome] = useState('idle');
  const [confetti, setConfetti] = useState(false);
  const timersRef = useRef([]);
  const rollingRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(
    () => () => {
      clearTimers();
      rollingRef.current = false;
    },
    [clearTimers]
  );

  const schedule = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const roll = useCallback(() => {
    if (rollingRef.current) return;
    rollingRef.current = true;
    const final = randomFace();
    setRolling(true);
    setOutcome('idle');
    setConfetti(false);
    clearTimers();

    const finish = () => {
      rollingRef.current = false;
      setRolling(false);
    };

    if (prefersReducedMotion()) {
      setDisplay(final);
      if (final === 20) {
        setOutcome('crit');
        setConfetti(true);
        schedule(() => setConfetti(false), 850);
      } else if (final === 1) {
        setOutcome('fail');
      } else {
        setOutcome('normal');
      }
      finish();
      return;
    }

    const times = buildSpinSchedule(ROLL_MS, SPIN_STEPS);
    times.forEach((t, idx) => {
      schedule(() => {
        const last = idx === times.length - 1;
        if (last) {
          setDisplay(final);
          if (final === 20) {
            setOutcome('crit');
            setConfetti(true);
            schedule(() => setConfetti(false), 900);
          } else if (final === 1) {
            setOutcome('fail');
          } else {
            setOutcome('normal');
          }
          finish();
        } else {
          setDisplay(randomFace());
        }
      }, t);
    });
  }, [clearTimers, schedule]);

  const faceClass = [
    styles.face,
    rolling ? styles.faceRolling : '',
    outcome === 'crit' ? styles.faceCrit : '',
    outcome === 'fail' ? styles.faceFail : '',
    outcome === 'normal' ? styles.faceNormal : '',
  ]
    .filter(Boolean)
    .join(' ');

  const diceShellClass = [
    styles.diceShell,
    outcome === 'fail' ? styles.diceShellShake : '',
    outcome === 'fail' ? styles.diceShellFailAura : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={styles.widget} aria-labelledby="dash-dice-title">
      <div className={styles.widgetGlow} aria-hidden />
      <h2 id="dash-dice-title" className={styles.title}>
        Момент удачи
      </h2>
      <p className={styles.lead}>Бросьте виртуальный d20 — чисто для настроения.</p>

      <div className={diceShellClass}>
        {confetti ? (
          <div className={styles.confettiLayer} aria-hidden>
            {Array.from({ length: CONFETTI_PIECES }, (_, i) => {
              const angleDeg = (i / CONFETTI_PIECES) * 360 + i * 7;
              const rad = (angleDeg * Math.PI) / 180;
              const dist = 52 + (i % 5) * 14;
              const tx = `${Math.round(Math.cos(rad) * dist)}px`;
              const ty = `${Math.round(Math.sin(rad) * dist - 18)}px`;
              return (
                <span
                  key={i}
                  className={styles.confetti}
                  style={{ '--tx': tx, '--ty': ty, '--rot': `${i * 31}deg` }}
                />
              );
            })}
          </div>
        ) : null}
        <div className={styles.display} aria-live="polite">
          <span className={faceClass}>{display == null ? '—' : display}</span>
          <span className={styles.caption}>1–20</span>
        </div>
      </div>

      <button type="button" className={styles.btn} onClick={roll} disabled={rolling}>
        {rolling ? 'Бросок…' : 'Бросить d20'}
      </button>
    </aside>
  );
}
