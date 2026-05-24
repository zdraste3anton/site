import React, { useCallback, useEffect, useRef, useState } from 'react';
import { processPortraitFile } from '../../utils/portraitUpload';
import { updateCharacter } from '../../services/characterService';
import { normalizePortraitUrl } from '../../utils/characterSheetDerived';
import { useToast } from '../../context/ToastContext';
import { mapApiErrorMessage } from '../../constants/uiMessages';
import styles from './EditablePortrait.module.css';

const ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

function PortraitSilhouette() {
  return (
    <svg className={styles.silhouette} viewBox="0 0 200 260" aria-hidden>
      <path
        d="M100 20c22 0 40 18 40 40s-18 40-40 40-40-18-40-40 18-40 40-40zm0 98c44 0 78 26 78 58v44H22v-44c0-32 34-58 78-58z"
        fill="rgba(212, 158, 81, 0.2)"
      />
      <path
        d="M100 20c22 0 40 18 40 40s-18 40-40 40-40-18-40-40 18-40 40-40z"
        fill="rgba(255,255,255,0.06)"
      />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
      <path
        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function EditablePortrait({
  characterId,
  portraitUrl = '',
  onUpdated,
  variant = 'sheet',
  disabled = false,
  alt = 'Портрет персонажа',
}) {
  const inputRef = useRef(null);
  const { showError, showSuccess } = useToast();
  const [localUrl, setLocalUrl] = useState(() => normalizePortraitUrl({ portraitUrl }));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLocalUrl(normalizePortraitUrl({ portraitUrl }));
  }, [portraitUrl]);

  const persistPortrait = useCallback(
    async (nextUrl) => {
      if (!characterId || disabled) return;
      const previous = localUrl;
      setLocalUrl(nextUrl);
      setBusy(true);
      try {
        const updated = await updateCharacter(characterId, {
          portraitUrl: nextUrl || null,
        });
        const resolved = normalizePortraitUrl(updated);
        setLocalUrl(resolved);
        onUpdated?.(updated);
        showSuccess(nextUrl ? 'Портрет обновлён' : 'Портрет удалён');
      } catch (e) {
        setLocalUrl(previous);
        showError(
          mapApiErrorMessage(e, 'Не удалось сохранить портрет.', {
            unauthorizedLabel: 'Сессия истекла. Войдите снова.',
          })
        );
      } finally {
        setBusy(false);
      }
    },
    [characterId, disabled, localUrl, onUpdated, showError, showSuccess]
  );

  const handleFile = useCallback(
    async (file) => {
      if (!file || disabled || busy) return;
      try {
        const dataUrl = await processPortraitFile(file);
        await persistPortrait(dataUrl);
      } catch (e) {
        showError(e?.message || 'Не удалось загрузить изображение');
      }
    },
    [busy, disabled, persistPortrait, showError]
  );

  const openPicker = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    if (!disabled && !busy) inputRef.current?.click();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled && !busy && localUrl) persistPortrait('');
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const hasImage = Boolean(localUrl);
  const rootClass = `${styles.root} ${variant === 'card' ? styles.variantCard : styles.variantSheet}`;

  return (
    <div className={rootClass} data-busy={busy || undefined}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className={styles.hiddenInput}
        onChange={onInputChange}
        disabled={disabled || busy}
        aria-label="Изменить портрет персонажа"
      />

      {busy ? (
        <div className={styles.busyLayer} aria-busy="true">
          <span className={styles.busySpinner} aria-hidden />
        </div>
      ) : null}

      {hasImage ? (
        <img src={localUrl} alt={alt} className={styles.image} />
      ) : (
        <button type="button" className={styles.empty} onClick={openPicker} disabled={disabled || busy}>
          <PortraitSilhouette />
          <span className={styles.emptyLabel}>Загрузить портрет</span>
        </button>
      )}

      <div className={styles.overlay} onClick={(e) => e.stopPropagation()}>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={openPicker}
            disabled={disabled || busy}
          >
            <IconEdit />
            <span>{hasImage ? 'Изменить портрет' : 'Загрузить портрет'}</span>
          </button>
          {hasImage ? (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              onClick={handleDelete}
              disabled={disabled || busy}
            >
              <IconTrash />
              <span>Удалить</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
