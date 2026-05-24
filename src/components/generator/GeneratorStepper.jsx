import React from 'react';
import styles from './GeneratorStepper.module.css';

const STEPS = [
  { n: 1, label: 'Механика' },
  { n: 2, label: 'История' },
  { n: 3, label: 'Портрет персонажа' },
];

export default function GeneratorStepper({ current }) {
  return (
    <ol className={styles.stepper} aria-label="Этапы создания персонажа">
      {STEPS.map((step, index) => {
        const done = current > step.n;
        const active = current === step.n;
        const lineActive = current > step.n;
        return (
          <li key={step.n} className={styles.stepItem}>
            {index > 0 && (
              <span
                className={`${styles.connector} ${lineActive ? styles.connectorActive : ''}`.trim()}
                aria-hidden
              />
            )}
            <div className={styles.stepInner}>
              <span
                className={`${styles.bubble} ${done ? styles.bubbleDone : ''} ${active ? styles.bubbleActive : ''}`.trim()}
                aria-current={active ? 'step' : undefined}
              >
                {done ? (
                  <svg className={styles.check} viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.n
                )}
              </span>
              <span
                className={`${styles.label} ${done || active ? styles.labelActive : styles.labelMuted}`.trim()}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
