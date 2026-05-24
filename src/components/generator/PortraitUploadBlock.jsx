import React, { useCallback, useRef, useState } from 'react';
import { processPortraitFile } from '../../utils/portraitUpload';
import styles from './PortraitUploadBlock.module.css';

const ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

function PortraitSilhouette() {
  return (
    <svg className={styles.silhouette} viewBox="0 0 200 260" aria-hidden>
      <path
        d="M100 20c22 0 40 18 40 40s-18 40-40 40-40-18-40-40 18-40 40-40zm0 98c44 0 78 26 78 58v44H22v-44c0-32 34-58 78-58z"
        fill="rgba(212, 158, 81, 0.22)"
      />
      <path
        d="M100 20c22 0 40 18 40 40s-18 40-40 40-40-18-40-40 18-40 40-40z"
        fill="rgba(255,255,255,0.06)"
      />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <path
        d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden>
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
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden>
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

export default function PortraitUploadBlock({
  imageUrl,
  onImageChange,
  disabled,
  alt = 'Портрет персонажа',
  className = '',
  glowRgb = '212, 158, 81',
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = useCallback(
    async (file) => {
      if (!file || disabled || busy) return;
      setError('');
      setBusy(true);
      try {
        const dataUrl = await processPortraitFile(file);
        onImageChange(dataUrl);
      } catch (e) {
        setError(e?.message || 'Не удалось загрузить изображение');
      } finally {
        setBusy(false);
      }
    },
    [busy, disabled, onImageChange]
  );

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || busy) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const openPicker = (e) => {
    e?.stopPropagation?.();
    if (!disabled && !busy) inputRef.current?.click();
  };

  const hasImage = Boolean(imageUrl);

  return (
    <div className={styles.wrap}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className={styles.hiddenInput}
        onChange={onInputChange}
        disabled={disabled || busy}
        aria-label="Загрузить портрет персонажа"
      />

      <div
        className={[
          styles.frame,
          className,
          dragOver ? styles.frameDrag : '',
          hasImage ? styles.frameHasImage : '',
          busy ? styles.frameBusy : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ '--glow-rgb': glowRgb }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled && !busy) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !busy) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={onDrop}
      >
        {busy ? (
          <div className={styles.busyLayer} aria-busy="true">
            <span className={styles.busySpinner} aria-hidden />
            <span className={styles.busyText}>Загрузка…</span>
          </div>
        ) : null}

        {hasImage ? (
          <>
            <img src={imageUrl} alt={alt} className={styles.image} />
            <div className={styles.actionsOverlay}>
              <div className={styles.actionsBar}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={openPicker}
                  disabled={disabled || busy}
                >
                  <IconEdit />
                  <span>Изменить</span>
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageChange('');
                  }}
                  disabled={disabled || busy}
                >
                  <IconTrash />
                  <span>Удалить</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <button
            type="button"
            className={styles.emptyState}
            onClick={openPicker}
            disabled={disabled || busy}
          >
            <div className={styles.emptyGlow} aria-hidden />
            <PortraitSilhouette />
            <span className={styles.emptyCta}>
              <IconUpload />
              Загрузить портрет
            </span>
            <span className={styles.emptyHint}>Перетащите файл или нажмите · JPG, PNG, WEBP · до 5 МБ</span>
          </button>
        )}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
