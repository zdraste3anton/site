import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import ParticleBackground from '../components/ParticleBackground';
import DashboardHeader from '../components/DashboardHeader';
import CharacterStatsGrid from '../components/profile/CharacterStatsGrid';
import CharacterSkillsBlock from '../components/profile/CharacterSkillsBlock';
import CharacterSpellsBlock from '../components/profile/CharacterSpellsBlock';
import CharacterInventoryBlock from '../components/profile/CharacterInventoryBlock';
import CharacterStoryBlock from '../components/profile/CharacterStoryBlock';
import { useAuth } from '../context/AuthContext';
import * as characterService from '../services/characterService';
import {
  buildDefaultSkillOverrideMap,
  isNonSpellcastingClass,
} from '../utils/characterSheetDerived';
import EditablePortrait from '../components/profile/EditablePortrait';
import { ApiClientError } from '../services/api';
import { mapApiErrorMessage } from '../constants/uiMessages';
import styles from './CharacterSheetPage.module.css';

function IconFile() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
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

export default function CharacterSheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setEditMode(false);
    setDraft(null);
    setSaveError('');
  }, [id]);

  useEffect(() => {
    if (!user?.id || !id) {
      setLoadState('missing');
      return;
    }
    let cancelled = false;
    async function run() {
      setLoadState('loading');
      setLoadError('');
      try {
        const ch = await characterService.getCharacter(id);
        if (cancelled) return;
        if (ch) {
          setCharacter(ch);
          setLoadState('ok');
        } else {
          setLoadState('missing');
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiClientError && (e.status === 404 || e.code === 'NOT_FOUND')) {
          setLoadState('missing');
        } else {
          const msg = mapApiErrorMessage(
            e,
            'Не удалось загрузить персонажа. Проверьте соединение.',
            { unauthorizedLabel: 'Сессия истекла. Войдите снова.' }
          );
          setLoadError(msg);
          setLoadState('error');
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, id]);

  const handleBeginEdit = useCallback(() => {
    if (!character) return;
    const skillOverrides =
      character.skillOverrides && typeof character.skillOverrides === 'object'
        ? { ...character.skillOverrides }
        : buildDefaultSkillOverrideMap(character);
    setDraft({
      ...character,
      skillOverrides,
      spells: Array.isArray(character.spells) ? character.spells.map((s) => ({ ...s })) : [],
      inventory: Array.isArray(character.inventory) ? [...character.inventory] : [],
      attributes: { ...character.attributes },
    });
    setEditMode(true);
    setSaveError('');
  }, [character]);

  const handleCancelEdit = useCallback(() => {
    setDraft(null);
    setEditMode(false);
    setSaveError('');
  }, []);

  const handleScoreChange = useCallback((key, raw) => {
    const n = Math.max(1, Math.min(30, Math.trunc(Number(raw)) || 10));
    setDraft((d) => (d ? { ...d, attributes: { ...d.attributes, [key]: n } } : d));
  }, []);

  const handleSkillBonusChange = useCallback((skillId, raw) => {
    const n = Math.trunc(Number(raw));
    if (!Number.isFinite(n)) return;
    setDraft((d) =>
      d
        ? {
            ...d,
            skillOverrides: { ...(d.skillOverrides || {}), [skillId]: n },
          }
        : d
    );
  }, []);

  const handleInventoryLine = useCallback((index, value) => {
    setDraft((d) => {
      if (!d) return d;
      const next = Array.isArray(d.inventory) ? [...d.inventory] : [];
      next[index] = value;
      return { ...d, inventory: next };
    });
  }, []);

  const handleAddInventoryLine = useCallback(() => {
    setDraft((d) => {
      if (!d) return d;
      const next = Array.isArray(d.inventory) ? [...d.inventory] : [];
      next.push('');
      return { ...d, inventory: next };
    });
  }, []);

  const handleAddSpell = useCallback((level) => {
    setDraft((d) => {
      if (!d) return d;
      const prev = Array.isArray(d.spells) ? [...d.spells] : [];
      const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      prev.push({
        id,
        name: level === 0 ? 'Новый заговор' : 'Новое заклинание 1 уровня',
        school: '—',
        level,
        levelTag: level === 0 ? 'Заговор' : '1 ур.',
      });
      return { ...d, spells: prev };
    });
  }, []);

  const handlePatchSpell = useCallback((id, patch) => {
    setDraft((d) => {
      if (!d) return d;
      const prev = Array.isArray(d.spells) ? d.spells.map((s) => ({ ...s })) : [];
      const next = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
      return { ...d, spells: next };
    });
  }, []);

  const handleRemoveSpell = useCallback((id) => {
    setDraft((d) => {
      if (!d) return d;
      const next = (Array.isArray(d.spells) ? d.spells : []).filter((s) => s.id !== id);
      return { ...d, spells: next };
    });
  }, []);

  const handlePortraitUpdated = useCallback((updated) => {
    setCharacter(updated);
    setDraft((d) =>
      d
        ? {
            ...d,
            portraitUrl: updated.portraitUrl || '',
            portraitImage: updated.portraitUrl || updated.portraitImage || '',
          }
        : d
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!draft || !character?.id) return;
    setSaveBusy(true);
    setSaveError('');
    try {
      const updated = await characterService.updateCharacter(character.id, {
        attributes: draft.attributes,
        armorClass: Number(draft.armorClass),
        hitPoints: Number(draft.hp ?? draft.hitPoints),
        initiative: String(draft.initiative ?? ''),
        className: draft.className,
        classId: draft.classId || undefined,
        skills: draft.skillOverrides || null,
        spells: Array.isArray(draft.spells) ? draft.spells : [],
        inventory: Array.isArray(draft.inventory) ? draft.inventory : [],
      });
      setCharacter(updated);
      setDraft(null);
      setEditMode(false);
    } catch (e) {
      setSaveError(
        mapApiErrorMessage(e, 'Не удалось сохранить изменения.', {
          unauthorizedLabel: 'Сессия истекла. Войдите снова.',
        })
      );
    } finally {
      setSaveBusy(false);
    }
  }, [draft, character?.id]);

  if (loadState === 'loading') {
    return (
      <PageShell variant="main">
        <ParticleBackground variant="viewport" />
        <DashboardHeader />
        <main className={styles.sheetMain}>
          <div className={styles.sheetSkeleton} aria-busy="true" aria-label="Загрузка листа">
            <div className={styles.sheetSkeletonToolbar}>
              <div className={styles.sheetSkeletonLine} style={{ width: '42%', height: 36 }} />
              <div className={styles.sheetSkeletonLine} style={{ width: 120, height: 40 }} />
            </div>
            <div className={styles.sheetSkeletonGrid}>
              <div className={styles.sheetSkeletonCard} />
              <div className={styles.sheetSkeletonCardWide} />
            </div>
          </div>
        </main>
      </PageShell>
    );
  }

  if (loadState === 'error') {
    return (
      <PageShell variant="main">
        <ParticleBackground variant="viewport" />
        <DashboardHeader />
        <main className={styles.fallbackMain}>
          <p style={{ color: '#f5a5a5' }}>{loadError}</p>
          <button type="button" className={styles.btnGhost} onClick={() => navigate('/profile')}>
            К профилю
          </button>
        </main>
      </PageShell>
    );
  }

  if (loadState !== 'ok' || !character) {
    return (
      <PageShell variant="main">
        <ParticleBackground variant="viewport" />
        <DashboardHeader />
        <main className={styles.fallbackMain}>
          <p>Персонаж не найден.</p>
          <button type="button" className={styles.btnGhost} onClick={() => navigate('/profile')}>
            К профилю
          </button>
        </main>
      </PageShell>
    );
  }

  const sheet = editMode && draft ? draft : character;

  const handlePdf = async () => {
    setPdfBusy(true);
    setPdfError('');
    try {
      await characterService.downloadCharacterPdf(character.id);
    } catch (e) {
      console.error(e);
      setPdfError(
        mapApiErrorMessage(e, 'Не удалось скачать PDF. Проверьте соединение.', {
          unauthorizedLabel: 'Сессия истекла. Войдите снова.',
        })
      );
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <PageShell variant="main">
      <ParticleBackground variant="viewport" />
      <DashboardHeader />
      <main className={styles.sheetMain}>
        <div className={styles.toolbar}>
          <h1 className={styles.pageTitle}>Лист персонажа</h1>
          <div className={styles.toolbarActions}>
            <button type="button" className={styles.btnGhost} onClick={() => navigate('/profile')}>
              Назад
            </button>
            {!editMode ? (
              <button
                type="button"
                className={styles.btnEdit}
                onClick={handleBeginEdit}
                aria-label="Редактировать лист"
              >
                <IconPencil />
                Редактировать
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={handleCancelEdit}
                  disabled={saveBusy}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={styles.btnSaveSheet}
                  onClick={handleSave}
                  disabled={saveBusy}
                >
                  {saveBusy ? 'Сохранение…' : 'Сохранить изменения'}
                </button>
              </>
            )}
            <button
              type="button"
              className={styles.btnPdf}
              onClick={handlePdf}
              disabled={pdfBusy || editMode}
            >
              <IconFile />
              {pdfBusy ? 'Создание…' : 'Экспорт в PDF'}
            </button>
          </div>
        </div>
        {pdfError ? (
          <p role="alert" style={{ color: '#f5a5a5', marginTop: 8 }}>
            {pdfError}
          </p>
        ) : null}
        {saveError ? (
          <p role="alert" style={{ color: '#f5a5a5', marginTop: 8 }}>
            {saveError}
          </p>
        ) : null}

        <div className={styles.grid}>
          <div className={styles.leftCol}>
            <EditablePortrait
              characterId={character.id}
              portraitUrl={character.portraitUrl || character.portraitImage || ''}
              onUpdated={handlePortraitUpdated}
              variant="sheet"
              disabled={saveBusy}
              alt={sheet.name ? `Портрет: ${sheet.name}` : 'Портрет персонажа'}
            />

            <div className={styles.identity}>
              <h2 className={styles.identityName}>{sheet.name}</h2>
              <div className={styles.identityRow}>
                <span>Раса</span>
                <span>{sheet.race || '—'}</span>
              </div>
              <div className={styles.identityRow}>
                <span>Класс</span>
                {editMode ? (
                  <input
                    type="text"
                    className={styles.identityInput}
                    value={sheet.className || ''}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, className: e.target.value } : d))
                    }
                    aria-label="Класс персонажа"
                  />
                ) : (
                  <span>{sheet.className || '—'}</span>
                )}
              </div>
              <div className={styles.identityRow}>
                <span>Уровень</span>
                <span>{sheet.level ?? 1}</span>
              </div>
            </div>

            <div className={styles.combatRow}>
              <div className={`${styles.combatCard} ${styles.combatCardBlue}`}>
                <div className={styles.combatIcon} aria-hidden>
                  🛡
                </div>
                <div className={styles.combatLabel}>Класс Доспеха</div>
                {editMode ? (
                  <input
                    type="number"
                    className={styles.combatValueInput}
                    value={sheet.armorClass ?? ''}
                    onChange={(e) =>
                      setDraft((d) =>
                        d ? { ...d, armorClass: Math.trunc(Number(e.target.value)) || 0 } : d
                      )
                    }
                    aria-label="Класс доспеха"
                  />
                ) : (
                  <div className={styles.combatValue}>{sheet.armorClass ?? '—'}</div>
                )}
              </div>
              <div className={`${styles.combatCard} ${styles.combatCardRed}`}>
                <div className={styles.combatIcon} aria-hidden>
                  ❤
                </div>
                <div className={styles.combatLabel}>Хиты</div>
                {editMode ? (
                  <input
                    type="number"
                    className={styles.combatValueInput}
                    value={sheet.hp ?? sheet.hitPoints ?? ''}
                    onChange={(e) =>
                      setDraft((d) => {
                        if (!d) return d;
                        const v = Math.max(0, Math.trunc(Number(e.target.value)) || 0);
                        return { ...d, hp: v, hitPoints: v };
                      })
                    }
                    aria-label="Хиты"
                  />
                ) : (
                  <div className={styles.combatValue}>{sheet.hp ?? '—'}</div>
                )}
              </div>
              <div className={`${styles.combatCard} ${styles.combatCardGold}`}>
                <div className={styles.combatIcon} aria-hidden>
                  ⚡
                </div>
                <div className={styles.combatLabel}>Инициатива</div>
                {editMode ? (
                  <input
                    type="text"
                    className={styles.combatValueInput}
                    value={String(sheet.initiative ?? '')}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, initiative: e.target.value } : d))
                    }
                    aria-label="Инициатива"
                  />
                ) : (
                  <div className={styles.combatValue}>{sheet.initiative ?? '—'}</div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.rightGrid}>
              <CharacterStatsGrid
                attributes={sheet.attributes}
                editable={editMode}
                onScoreChange={editMode ? handleScoreChange : undefined}
              />
              <CharacterSkillsBlock
                character={sheet}
                editable={editMode}
                onSkillBonusChange={editMode ? handleSkillBonusChange : undefined}
              />
            </div>
            <CharacterSpellsBlock
              spells={sheet.spells}
              editable={editMode}
              nonSpellcaster={isNonSpellcastingClass(sheet.classId, sheet.className)}
              onAddSpell={handleAddSpell}
              onPatchSpell={handlePatchSpell}
              onRemoveSpell={handleRemoveSpell}
            />
            <CharacterInventoryBlock
              items={sheet.inventory}
              editable={editMode}
              onChangeLine={handleInventoryLine}
              onAddLine={handleAddInventoryLine}
            />
          </div>
        </div>

        <div className={styles.storySection}>
          <CharacterStoryBlock story={sheet.story} />
        </div>
      </main>
    </PageShell>
  );
}
