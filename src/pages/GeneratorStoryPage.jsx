import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
import BackgroundEffects from '../components/BackgroundEffects';
import DashboardHeader from '../components/DashboardHeader';
import GeneratorStepper from '../components/generator/GeneratorStepper';
import { useCharacterGenerator } from '../context/CharacterGeneratorContext';
import { RACES } from '../data/racesData';
import { CLASSES } from '../data/classesData';
import { fetchAiStory } from '../api/aiApi';
import styles from './GeneratorPage.module.css';

function logStorySchedule(reason, extra) {
  if (process.env.NODE_ENV === 'development') {
    
    console.info('[CharacterForge story] schedule POST /api/ai/story', reason, extra || {});
  }
}

function stripLeadingCharacterNameLine(storyText) {
  const raw = String(storyText || '').replace(/^\uFEFF/, '');
  if (!raw.trim()) return '';

  const lines = raw.split(/\r?\n/);
  const firstIdx = lines.findIndex((l) => String(l).trim().length > 0);
  if (firstIdx < 0) return raw.trim();

  const first = String(lines[firstIdx]).trim();
  if (/^Имя\s*:/i.test(first)) {
    const rest = lines.slice(firstIdx + 1).join('\n').replace(/^\s*\n+/, '');
    return rest.trim();
  }

  return raw.trim();
}

export default function GeneratorStoryPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useCharacterGenerator();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typed, setTyped] = useState('');
  const typeTimerRef = useRef(null);
  const prevDisplayStoryRef = useRef('');
  const storyPromptRef = useRef(state.storyUserPrompt);
  const chatSummaryRef = useRef('');
  
  const storyScheduleIdRef = useRef(0);
  
  const isGeneratingStoryRef = useRef(false);

  storyPromptRef.current = state.storyUserPrompt;
  chatSummaryRef.current = state.aiChatMessages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n')
    .slice(0, 2000);

  const raceName = RACES.find((r) => r.id === state.raceId)?.name || '';
  const className = CLASSES.find((c) => c.id === state.classId)?.name || '';

  const displayStory = useMemo(
    () => stripLeadingCharacterNameLine(state.generatedStory),
    [state.generatedStory]
  );

  const raceNameRef = useRef(raceName);
  const classNameRef = useRef(className);
  const attributesRef = useRef(state.attributes);
  const playStyleRef = useRef(state.playStylePrompt);
  const genderRef = useRef(state.gender);
  raceNameRef.current = raceName;
  classNameRef.current = className;
  attributesRef.current = state.attributes;
  playStyleRef.current = state.playStylePrompt;
  genderRef.current = state.gender;

  const mechanicsFingerprint = useMemo(
    () =>
      JSON.stringify({
        raceId: state.raceId,
        classId: state.classId,
        gender: state.gender,
        attributes: state.attributes,
        playStylePrompt: state.playStylePrompt,
      }),
    [state.raceId, state.classId, state.gender, state.attributes, state.playStylePrompt]
  );

  const prevKeyRef = useRef(state.storyGenerationKey);
  const prevFpRef = useRef(mechanicsFingerprint);

  useEffect(() => {
    if (!state.raceId || !state.classId) return undefined;

    if (state.storyGenerationKey === 0 && state.generatedStory.trim()) {
      setError('');
      setLoading(false);
      return undefined;
    }

    const keyChanged = state.storyGenerationKey !== prevKeyRef.current;
    const fpChanged = mechanicsFingerprint !== prevFpRef.current;
    prevKeyRef.current = state.storyGenerationKey;
    prevFpRef.current = mechanicsFingerprint;

    let reason = 'auto-first';
    if (keyChanged && state.storyGenerationKey > 0) {
      reason = 'regenerate-or-retry';
    } else if (keyChanged) {
      reason = 'story-key-changed';
    } else if (fpChanged) {
      reason = 'mechanics-changed';
    }

    const scheduleId = ++storyScheduleIdRef.current;
    const ac = new AbortController();
    let cancelled = false;

    setError('');
    setLoading(true);

    const timer = setTimeout(() => {
      if (cancelled || storyScheduleIdRef.current !== scheduleId) return;
      logStorySchedule(reason, {
        scheduleId,
        storyGenerationKey: state.storyGenerationKey,
        fingerprint: mechanicsFingerprint.slice(0, 120),
      });

      (async () => {
        isGeneratingStoryRef.current = true;
        try {
          const { story } = await fetchAiStory(
            {
              race: raceNameRef.current,
              className: classNameRef.current,
              gender: genderRef.current,
              attributes: attributesRef.current,
              playStylePrompt: playStyleRef.current,
              storyPrompt: storyPromptRef.current,
              chatSummary: chatSummaryRef.current,
            },
            { signal: ac.signal }
          );
          if (cancelled || storyScheduleIdRef.current !== scheduleId) return;
          dispatch({ type: 'SET_STORY', payload: story });
          setError('');
        } catch (e) {
          if (cancelled || storyScheduleIdRef.current !== scheduleId) return;
          if (e && e.name === 'AbortError') return;
          setError(e.message || 'Не удалось сгенерировать историю');
        } finally {
          isGeneratingStoryRef.current = false;
          if (!cancelled && storyScheduleIdRef.current === scheduleId) {
            setLoading(false);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      ac.abort();
    };
    
    
  }, [state.storyGenerationKey, mechanicsFingerprint]);

  useEffect(() => {
    setError('');
  }, [state.raceId, state.classId, state.gender]);

  const handleRegenerate = () => {
    if (loading || isGeneratingStoryRef.current) {
      logStorySchedule('manual-regenerate-blocked', { loading, inFlight: isGeneratingStoryRef.current });
      return;
    }
    setError('');
    setLoading(true);
    logStorySchedule('manual-bump-story-key', { nextKey: state.storyGenerationKey + 1 });
    dispatch({ type: 'BUMP_STORY_KEY' });
  };

  useEffect(() => {
    if (loading) return undefined;
    const nextStory = displayStory || '';
    if (!nextStory.trim()) {
      setTyped('');
      prevDisplayStoryRef.current = nextStory;
      return undefined;
    }

    if (prevDisplayStoryRef.current === nextStory) return undefined;
    prevDisplayStoryRef.current = nextStory;

    if (typeTimerRef.current) window.clearInterval(typeTimerRef.current);
    setTyped('');

    let i = 0;
    typeTimerRef.current = window.setInterval(() => {
      i += 1;
      setTyped(nextStory.slice(0, i));
      if (i >= nextStory.length) {
        window.clearInterval(typeTimerRef.current);
        typeTimerRef.current = null;
      }
    }, 20);

    return () => {
      if (typeTimerRef.current) window.clearInterval(typeTimerRef.current);
      typeTimerRef.current = null;
    };
  }, [loading, displayStory]);

  if (!state.raceId || !state.classId) {
    return <Navigate to="/generator/mechanics" replace />;
  }

  const archetype = state.archetypeLabel?.trim();
  const hasStory = Boolean(state.generatedStory.trim());
  const canNext = hasStory && !loading;
  const showError = Boolean(error) && !loading;
  const regenDisabled = loading;

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.bgOverlay} aria-hidden />
      <BackgroundEffects />
      <DashboardHeader />
      <main className={`${styles.main} w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10`}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>Создание персонажа</h1>
          <div className={styles.stepperWrap}>
            <GeneratorStepper current={2} />
          </div>
        </div>

        <div
          className={`${styles.glass} ${styles.glassOrange} ${styles.summaryBar} mx-auto w-full max-w-6xl`}
        >
          <svg className={styles.summaryIcon} width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z"
            />
          </svg>
          <p className={styles.summaryText}>
            Ваш выбор:{' '}
            <span className={styles.summaryAccent}>
              {raceName}-{className}
              {archetype ? ` (${archetype})` : ''}
            </span>
          </p>
        </div>

        <div className={`${styles.glass} ${styles.storyBox} mx-auto w-full max-w-6xl`}>
          <h2
            className="m-0 mb-6 text-center font-serif text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: '#D49E51' }}
          >
            Твоя история
          </h2>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="story-loading"
                aria-busy="true"
                aria-live="polite"
                className="text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <p className={styles.hintLoading} style={{ marginBottom: 16 }}>
                  ИИ сочиняет предысторию...
                </p>
                <div className={styles.skeletonLine} style={{ width: '100%' }} />
                <div className={styles.skeletonLine} style={{ width: '92%' }} />
                <div className={styles.skeletonLine} style={{ width: '88%' }} />
                <div className={styles.skeletonLine} style={{ width: '95%' }} />
              </motion.div>
            ) : (
              <motion.div
                key={`story-${state.storyGenerationKey}-${displayStory.length}`}
                className="min-h-0 w-full overflow-hidden"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-5">
                  <p
                    className={`${styles.storyText} font-sans text-left text-sm leading-relaxed sm:text-base`}
                  >
                    {typed || displayStory || 'История появится здесь.'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showError ? (
            <motion.div
              className={styles.hintError}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
            >
              <p className={styles.errorText}>{error}</p>
              <button
                type="button"
                className={styles.retryBtn}
                onClick={handleRegenerate}
                disabled={regenDisabled}
              >
                Повторить попытку
              </button>
            </motion.div>
          ) : null}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              className={styles.regenBtn}
              onClick={handleRegenerate}
              disabled={regenDisabled}
            >
              <RefreshCcw size={18} aria-hidden />
              Перегенерировать историю
            </button>
          </div>
        </div>

        <div className={`${styles.glass} ${styles.paddedBlock} mx-auto w-full max-w-6xl`}>
          <label className={styles.selectLabel} htmlFor="story-detail">
            Добавить детали для ИИ
          </label>
          <textarea
            id="story-detail"
            className={styles.textarea}
            placeholder="Сделай историю более мрачной..."
            value={state.storyUserPrompt}
            onChange={(e) => dispatch({ type: 'SET_STORY_USER_PROMPT', payload: e.target.value })}
            rows={4}
          />
        </div>

        <div className={`${styles.footerSplit} mx-auto w-full max-w-6xl`}>
          <button type="button" className={styles.btnGhost} onClick={() => navigate('/generator/mechanics')}>
            Назад
          </button>
          <button
            type="button"
            className={styles.btnNext}
            disabled={!canNext}
            onClick={() => navigate('/generator/portrait')}
          >
            Далее
          </button>
        </div>
      </main>
    </div>
  );
}
