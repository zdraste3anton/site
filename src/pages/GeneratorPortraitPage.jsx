import React, { useCallback, useMemo, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BackgroundEffects from '../components/BackgroundEffects';
import DashboardHeader from '../components/DashboardHeader';
import GeneratorStepper from '../components/generator/GeneratorStepper';
import PortraitUploadBlock from '../components/generator/PortraitUploadBlock';
import { useCharacterGenerator } from '../context/CharacterGeneratorContext';
import { RACES } from '../data/racesData';
import { CLASSES } from '../data/classesData';
import { useAuth } from '../context/AuthContext';
import { saveGeneratorCharacter } from '../services/characterService';
import { mapApiErrorMessage } from '../constants/uiMessages';
import {
  buildSkillRows,
  deriveDefaultInventory,
  deriveDefaultSpells,
  isNonSpellcastingClass,
} from '../utils/characterSheetDerived';
import styles from './GeneratorPage.module.css';

const PORTRAIT_ATTRS = [
  { key: 'str', abbr: 'СИЛ' },
  { key: 'dex', abbr: 'ЛОВ' },
  { key: 'con', abbr: 'ТЕЛ' },
  { key: 'int', abbr: 'ИНТ' },
  { key: 'wis', abbr: 'МУД' },
  { key: 'cha', abbr: 'ХАР' },
];

export default function GeneratorPortraitPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { state, dispatch } = useCharacterGenerator();
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedCharacter, setSavedCharacter] = useState(null);

  const raceName = RACES.find((r) => r.id === state.raceId)?.name || '';
  const className = CLASSES.find((c) => c.id === state.classId)?.name || '';
  const heroName = String(state.characterDisplayName || '').trim();
  const portraitSheetCharacter = useMemo(
    () => ({
      attributes: state.attributes,
      classId: state.classId,
      className,
      level: 1,
      skillOverrides: null,
    }),
    [state.attributes, state.classId, className]
  );

  const portraitSkillRows = useMemo(() => buildSkillRows(portraitSheetCharacter), [portraitSheetCharacter]);

  const portraitSpells = useMemo(
    () => deriveDefaultSpells(state.classId, className),
    [state.classId, className]
  );
  const portraitInventory = useMemo(
    () => deriveDefaultInventory(state.classId, className),
    [state.classId, className]
  );
  const portraitCantrips = useMemo(
    () => portraitSpells.filter((s) => s.level === 0 || String(s.levelTag || '').includes('аговор')),
    [portraitSpells]
  );
  const portraitFirstSpells = useMemo(
    () =>
      portraitSpells.filter(
        (s) =>
          s.level === 1 ||
          (String(s.levelTag || '').includes('1') &&
            (String(s.levelTag || '').includes('ур') || String(s.levelTag || '').includes('уров')))
      ),
    [portraitSpells]
  );
  const portraitNoSpellcasting = isNonSpellcastingClass(state.classId, className);

  const schoolRgb = useMemo(() => {
    const id = String(state.classId || '').toLowerCase();
    if (id.includes('wizard') || id.includes('sorcerer')) return '234, 179, 8';
    if (id.includes('warlock')) return '168, 85, 247';
    if (id.includes('cleric') || id.includes('paladin')) return '59, 130, 246';
    if (id.includes('druid')) return '34, 197, 94';
    return '212, 158, 81';
  }, [state.classId]);

  const handlePortraitChange = useCallback(
    (dataUrl) => {
      dispatch({ type: 'SET_PORTRAIT_IMAGE', payload: dataUrl });
    },
    [dispatch]
  );

  if (!state.raceId || !state.classId) {
    return <Navigate to="/generator/mechanics" replace />;
  }

  const handleSave = async () => {
    const token =
      typeof window !== 'undefined'
        ? window.localStorage?.getItem('token') || window.localStorage?.getItem('characterforge_auth_token')
        : null;
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setSaveError('');
    setSaveBusy(true);
    try {
      const effectiveUserId = user?.id || 'unknown';
      const saved = await saveGeneratorCharacter(effectiveUserId, state, raceName, className);
      dispatch({ type: 'SET_FINAL_SUMMARY', payload: saved });
      if (saved?.id) {
        setSavedCharacter({ id: saved.id, name: saved.name || 'Персонаж' });
      } else {
        setSaveError('Не удалось сохранить персонажа.');
      }
    } catch (e) {
      const msg = mapApiErrorMessage(
        e,
        'Не удалось сохранить персонажа.',
        { unauthorizedLabel: 'Сессия истекла. Войдите снова.' }
      );
      setSaveError(msg);
    } finally {
      setSaveBusy(false);
    }
  };

  const handleAbandon = () => {
    navigate('/dashboard');
  };

  const goToCharacter = () => {
    if (savedCharacter?.id) navigate(`/characters/${savedCharacter.id}`);
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  if (savedCharacter) {
    return (
      <div className={styles.page}>
        <div className={styles.bg} aria-hidden />
        <div className={styles.bgOverlay} aria-hidden />
        <BackgroundEffects />
        <DashboardHeader />
        <main className={`${styles.main} ${styles.mainEnter} mx-auto w-full max-w-5xl px-4 sm:px-6`}>
          <div className={styles.titleBlock}>
            <h1 className={styles.pageTitle}>Создание персонажа</h1>
            <div className={styles.stepperWrap}>
              <GeneratorStepper current={3} />
            </div>
          </div>

          <div className={styles.saveSuccessWrap}>
            <div className={styles.saveSuccessCard}>
              <div className={styles.saveSuccessGlow} aria-hidden />
              <div className={styles.saveSuccessIcon} aria-hidden>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className={styles.saveSuccessTitle}>Персонаж создан</h2>
              <p className={styles.saveSuccessSub}>
                {savedCharacter.name} готов к приключениям. Откройте лист, чтобы увидеть характеристики и историю.
              </p>
              <div className={styles.saveSuccessActions}>
                <button type="button" className={styles.btnSaveWide} onClick={goToCharacter}>
                  Перейти к персонажу
                </button>
                <button type="button" className={styles.btnGhostWide} onClick={goToProfile}>
                  К профилю
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.bgOverlay} aria-hidden />
      <BackgroundEffects />
      <DashboardHeader />
      <main className={`${styles.main} ${styles.mainEnter} mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8`}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>Создание персонажа</h1>
          <div className={styles.stepperWrap}>
            <GeneratorStepper current={3} />
          </div>
        </div>

        <motion.div
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className={`${styles.heroCharacterCard} mb-8 lg:mb-10`}>
            <div className="grid w-full grid-cols-1 items-stretch gap-4 sm:gap-5 lg:grid-cols-2 lg:items-center lg:gap-5">
              <div className="flex min-h-0 min-w-0 items-stretch justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`portrait-${Boolean(state.portraitImage)}`}
                    className="w-full max-w-[min(92vw,560px)] lg:h-full lg:max-h-[min(78vh,820px)] lg:max-w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <PortraitUploadBlock
                      imageUrl={state.portraitImage}
                      onImageChange={handlePortraitChange}
                      disabled={saveBusy}
                      glowRgb={schoolRgb}
                      alt={heroName ? `Портрет: ${heroName}` : `Портрет: ${raceName} ${className}`}
                      className="w-full"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex min-h-0 min-w-0 flex-col justify-center gap-4 lg:pl-1">
                <h2
                  className="m-0 text-left font-serif font-bold tracking-tight text-[clamp(1.75rem,2vw+1.1rem,3rem)] leading-[1.05]"
                  style={{ color: '#D49E51', textShadow: '0 10px 40px rgba(0,0,0,0.55)' }}
                >
                  {heroName || 'Ваш герой'}
                </h2>
                <div
                  className={`${styles.glass} ${styles.paddedBlock}`}
                  style={{ borderColor: 'rgba(212, 158, 81, 0.22)' }}
                >
                  <div className={styles.charSummaryRow}>
                    <span className={styles.charSummaryLabel}>Раса</span>
                    <span className={styles.charSummaryValue}>{raceName}</span>
                  </div>
                  <div className={styles.charSummaryRow}>
                    <span className={styles.charSummaryLabel}>Класс</span>
                    <span className={styles.charSummaryValue}>{className}</span>
                  </div>
                </div>
                <div className="w-full min-w-0 pt-1">
                  <p
                    className="m-0 mb-2 text-left font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: 'rgba(212, 158, 81, 0.88)' }}
                  >
                    Характеристики
                  </p>
                  <div className={styles.portraitAttrWithSkills}>
                    <div className={styles.portraitAttrTilesWrap}>
                      <div
                        className={styles.portraitAttrStripPortrait}
                        aria-label="Базовые характеристики персонажа"
                      >
                        {PORTRAIT_ATTRS.map(({ key, abbr }) => (
                          <div key={key} className={styles.portraitAttrTile}>
                            <span className={styles.portraitAttrAbbr}>{abbr}</span>
                            <span className={styles.portraitAttrVal}>{Number(state.attributes[key]) || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <motion.div
                      className={styles.portraitSkillsWrap}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p
                        className="m-0 mb-1.5 text-left font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em]"
                        style={{ color: 'rgba(212, 158, 81, 0.88)' }}
                      >
                        Навыки
                      </p>
                      <ul className={styles.portraitSkillList} aria-label="Навыки персонажа">
                        {portraitSkillRows.map((row) => (
                          <li key={row.id} className={styles.portraitSkillRow}>
                            <span className={styles.portraitSkillName}>{row.name}</span>
                            <span className={styles.portraitSkillBonus}>{row.bonus}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </div>
                <div className={styles.portraitLoadout}>
                  <div className={styles.portraitLoadoutBlock}>
                    <p className={styles.portraitLoadoutTitle}>Заклинания</p>
                    {portraitNoSpellcasting && !portraitSpells.length ? (
                      <p className={styles.portraitLoadoutMuted}>Нет доступных заклинаний</p>
                    ) : (
                      <>
                        <p className={styles.portraitLoadoutSub}>Заговоры</p>
                        <ul className={styles.portraitLoadoutList}>
                          {portraitCantrips.length ? (
                            portraitCantrips.map((sp) => (
                              <li key={sp.id} className={styles.portraitLoadoutRow}>
                                <span className={styles.portraitLoadoutBullet} aria-hidden>
                                  ◆
                                </span>
                                <span className={styles.portraitLoadoutName}>{sp.name}</span>
                              </li>
                            ))
                          ) : (
                            <li className={styles.portraitLoadoutMuted}>—</li>
                          )}
                        </ul>
                        <p className={styles.portraitLoadoutSub}>1 уровень</p>
                        <ul className={styles.portraitLoadoutList}>
                          {portraitFirstSpells.length ? (
                            portraitFirstSpells.map((sp) => (
                              <li key={sp.id} className={styles.portraitLoadoutRow}>
                                <span className={styles.portraitLoadoutBullet} aria-hidden>
                                  ◆
                                </span>
                                <span className={styles.portraitLoadoutName}>{sp.name}</span>
                              </li>
                            ))
                          ) : (
                            <li className={styles.portraitLoadoutMuted}>—</li>
                          )}
                        </ul>
                      </>
                    )}
                  </div>
                  <div className={styles.portraitLoadoutBlock}>
                    <p className={styles.portraitLoadoutTitle}>Базовый инвентарь</p>
                    <ul className={styles.portraitLoadoutList}>
                      {portraitInventory.map((line, idx) => (
                        <li key={`${idx}-${line}`} className={styles.portraitLoadoutRow}>
                          <span className={styles.portraitLoadoutBullet} aria-hidden>
                            ◆
                          </span>
                          <span className={styles.portraitLoadoutName}>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {state.portraitImage ? (
            <motion.div
              className={styles.successBar}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.successIcon} aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <p className={styles.successTitle}>Портрет загружен</p>
                <p className={styles.successSub}>Можно сохранить персонажа в профиль</p>
              </div>
            </motion.div>
          ) : null}
          {saveError ? (
            <motion.div
              className={styles.hintError}
              style={{ marginTop: 12 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              {saveError}
            </motion.div>
          ) : null}
        </motion.div>

        <div className={`${styles.glass} ${styles.footerBar} mx-auto w-full max-w-5xl`}>
          <button type="button" className={styles.linkMuted} onClick={handleAbandon}>
            Вернуться на главную без сохранения
          </button>
          <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saveBusy}>
            {saveBusy ? (
              <>
                <span className={styles.btnSpinner} aria-hidden />
                Создание...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Сохранить персонажа в профиль
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
