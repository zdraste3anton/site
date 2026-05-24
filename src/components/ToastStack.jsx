import React from 'react';
import { useToast } from '../context/ToastContext';
import styles from './ToastStack.module.css';

export default function ToastStack() {
  const { toasts, remove } = useToast();

  if (!toasts.length) return null;

  return (
    <div className={styles.host} role="region" aria-label="Уведомления">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${styles[t.variant] || styles.info}`}
          role="status"
        >
          <span className={styles.text}>{t.message}</span>
          <button type="button" className={styles.close} onClick={() => remove(t.id)} aria-label="Закрыть">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
