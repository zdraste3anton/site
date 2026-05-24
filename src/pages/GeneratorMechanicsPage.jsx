import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import BackgroundEffects from '../components/BackgroundEffects';
import DashboardHeader from '../components/DashboardHeader';
import GeneratorStepper from '../components/generator/GeneratorStepper';
import { useCharacterGenerator } from '../context/CharacterGeneratorContext';
import { RACES } from '../data/racesData';
import { CLASSES } from '../data/classesData';
import { CHARACTER_GENDER_OPTIONS } from '../constants/characterGender.js';
import { STANDARD_ARRAY_VALUES, swapStandardAttribute } from '../utils/dndModifiers';
import { fetchAiAttributes } from '../api/aiApi';
import { useAuth } from '../context/AuthContext';
import styles from './GeneratorPage.module.css';

const ATTRS = [
  { key: 'str', abbr: 'СИЛ', name: 'Сила' },
  { key: 'dex', abbr: 'ЛОВ', name: 'Ловкость' },
  { key: 'con', abbr: 'ТЕЛ', name: 'Телосложение' },
  { key: 'int', abbr: 'ИНТ', name: 'Интеллект' },
  { key: 'wis', abbr: 'МУД', name: 'Мудрость' },
  { key: 'cha', abbr: 'ХАР', name: 'Харизма' },
];

export default function GeneratorMechanicsPage() {
  const navigate = useNavigate();
  const { ready: authReady } = useAuth();
  const { state, dispatch } = useCharacterGenerator();
  const [chatInput, setChatInput] = useState('');
  const [aiStatus, setAiStatus] = useState('idle');
  const [aiError, setAiError] = useState('');
  const [highlightKeys, setHighlightKeys] = useState(() => new Set());
  const highlightTimerRef = useRef(null);
  
  const aiSendLockRef = useRef(false);
  const attributesFetchAbortRef = useRef(null);

  const raceName = RACES.find((r) => r.id === state.raceId)?.name || '';
  const className = CLASSES.find((c) => c.id === state.classId)?.name || '';
  const canNext = Boolean(state.raceId && state.classId);

  const radarData = useMemo(
    () =>
      ATTRS.map(({ key, abbr }) => ({
        key,
        label: abbr,
        value: Number(state.attributes[key]) || 0,
      })),
    [state.attributes]
  );

  const radarKey = useMemo(() => JSON.stringify(state.attributes), [state.attributes]);

  useEffect(
    () => () => {
      if (attributesFetchAbortRef.current) {
        attributesFetchAbortRef.current.abort();
        attributesFetchAbortRef.current = null;
      }
    },
    []
  );

  const sendToAi = useCallback(async () => {
    if (!authReady) return;

    const text = chatInput.trim();
    if (!text) return;
    if (aiSendLockRef.current) return;
    if (!state.raceId || !state.classId) {
      setAiError('Сначала выберите расу и класс.');
      return;
    }

    aiSendLockRef.current = true;
    let ac = null;
    try {
      setAiError('');

      const messagesForApi = [
        ...state.aiChatMessages.map(({ role, content }) => ({ role, content })),
        { role: 'user', content: text },
      ];
      const nextPlayStyle = state.playStylePrompt
        ? `${state.playStylePrompt}\n${text}`.trim()
        : text;

      dispatch({ type: 'ADD_CHAT_USER', payload: text });
      setChatInput('');
      setAiStatus('loading');

      const prevController = attributesFetchAbortRef.current;
      if (prevController) prevController.abort();
      ac = new AbortController();
      attributesFetchAbortRef.current = ac;

      const prevAttrs = state.attributes;
      const result = await fetchAiAttributes(
        {
          race: raceName,
          className,
          gender: state.gender,
          playStylePrompt: nextPlayStyle,
          messages: messagesForApi,
        },
        { signal: ac.signal }
      );
      if (result.archetype) {
        dispatch({ type: 'SET_ARCHETYPE', payload: result.archetype });
      }
      dispatch({ type: 'SET_ATTRIBUTES', payload: result.attributes });

      const nextAttrs = result.attributes || prevAttrs;
      const topKeys = ATTRS.map((a) => ({ key: a.key, v: Number(nextAttrs[a.key]) || 0 }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 2)
        .map((x) => x.key);

      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
      setHighlightKeys(new Set(topKeys));
      highlightTimerRef.current = window.setTimeout(() => setHighlightKeys(new Set()), 2200);

      const assistantText =
        result.explanation && String(result.explanation).trim()
          ? String(result.explanation).trim()
          : 'Предложено распределение характеристик по стандартному набору.';
      dispatch({ type: 'ADD_CHAT_ASSISTANT', payload: assistantText });
      setAiError('');
    } catch (e) {
      if (e && e.name === 'AbortError') {
        return;
      }
      setAiError(e.message || 'Не удалось получить ответ ИИ');
    } finally {
      if (ac && attributesFetchAbortRef.current === ac) {
        attributesFetchAbortRef.current = null;
      }
      setAiStatus('idle');
      aiSendLockRef.current = false;
    }
  }, [
    authReady,
    chatInput,
    className,
    dispatch,
    raceName,
    state.attributes,
    state.aiChatMessages,
    state.classId,
    state.gender,
    state.playStylePrompt,
    state.raceId,
  ]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!authReady || aiSendLockRef.current || aiStatus === 'loading') return;
      sendToAi();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.bgOverlay} aria-hidden />
      <BackgroundEffects />
      <DashboardHeader />
      <main className={`${styles.main} w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10`}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>Создание персонажа</h1>
          <div className={styles.stepperWrap}>
            <GeneratorStepper current={1} />
          </div>
        </div>

        <div className={`${styles.grid2} gap-8 lg:gap-10 xl:gap-12`}>
          <div className={`${styles.stackGap} gap-6 md:gap-8`}>
            <div className={`${styles.glass} ${styles.glassOrange} ${styles.paddedBlock}`}>
              <label className={styles.selectLabel} htmlFor="gen-race">
                Выберите Расу
              </label>
              <select
                id="gen-race"
                className={`${styles.select} ${styles.selectLg}`}
                value={state.raceId}
                disabled={aiStatus === 'loading'}
                onChange={(e) => dispatch({ type: 'SET_RACE_ID', payload: e.target.value })}
              >
                <option value="">— Раса —</option>
                {RACES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${styles.glass} ${styles.glassOrange} ${styles.paddedBlock}`}>
              <label className={styles.selectLabel} htmlFor="gen-class">
                Выберите Класс
              </label>
              <select
                id="gen-class"
                className={`${styles.select} ${styles.selectLg}`}
                value={state.classId}
                disabled={aiStatus === 'loading'}
                onChange={(e) => dispatch({ type: 'SET_CLASS_ID', payload: e.target.value })}
              >
                <option value="">— Класс —</option>
                {CLASSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${styles.glass} ${styles.glassOrange} ${styles.paddedBlock}`}>
              <span className={styles.selectLabel} id="gen-gender-label">
                Пол персонажа
              </span>
              <div
                className={styles.genderToggleRow}
                role="group"
                aria-labelledby="gen-gender-label"
              >
                {CHARACTER_GENDER_OPTIONS.map(({ value, label }) => {
                  const active = state.gender === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.genderToggleBtn} ${active ? styles.genderToggleBtnActive : ''}`.trim()}
                      disabled={aiStatus === 'loading'}
                      aria-pressed={active}
                      onClick={() => dispatch({ type: 'SET_GENDER', payload: value })}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`${styles.glass} ${styles.glassOrange} ${styles.paddedBlock}`}>
              <div className={styles.blockTitleRow}>
                <h2 className={styles.blockTitle}>Характеристики (Стандартный набор)</h2>
                <button
                  type="button"
                  className={styles.resetBtn}
                  disabled={aiStatus === 'loading'}
                  onClick={() => dispatch({ type: 'RESET_ATTRIBUTES' })}
                >
                  Сбросить
                </button>
              </div>
              <div className={styles.attrWithChart}>
                <div className={styles.attrGrid}>
                  {ATTRS.map(({ key, abbr, name }) => {
                    const val = state.attributes[key];
                    const isHot = highlightKeys.has(key);
                    return (
                      <div
                        key={key}
                        className={`${styles.attrCard} ${isHot ? styles.attrCardHighlight : ''}`.trim()}
                      >
                        <span className={styles.attrAbbr}>{abbr}</span>
                        <label className={styles.attrValueLabel} htmlFor={`attr-${key}`}>
                          <span className={styles.srOnly}>Значение {name}</span>
                          <select
                            id={`attr-${key}`}
                            className={styles.attrSelect}
                            value={val}
                            disabled={aiStatus === 'loading'}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              const next = swapStandardAttribute(state.attributes, key, n);
                              dispatch({ type: 'SET_ATTRIBUTES', payload: next });
                            }}
                            aria-label={`${name}, базовое значение`}
                          >
                            {STANDARD_ARRAY_VALUES.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </label>
                        <span className={styles.attrName}>{name}</span>
                      </div>
                    );
                  })}
                </div>

                <motion.div
                  className={styles.radarCard}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <div className={styles.radarTitleRow}>
                    <h3 className={styles.radarTitle}>Профиль характеристик</h3>
                    <span className={styles.radarHint}>Radar</span>
                  </div>
                  <div className={styles.radarWrap}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} key={radarKey}>
                        <PolarGrid stroke="rgba(255,255,255,0.14)" />
                        <PolarAngleAxis
                          dataKey="label"
                          tick={{
                            fill: 'rgba(212, 158, 81, 0.95)',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        />
                        <PolarRadiusAxis angle={90} domain={[8, 18]} tick={false} axisLine={false} />
                        <Radar
                          dataKey="value"
                          stroke="rgba(212, 158, 81, 0.95)"
                          fill="rgba(212, 158, 81, 0.18)"
                          fillOpacity={1}
                          isAnimationActive
                          animationDuration={450}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <div className={`${styles.glass} ${styles.glassPurple}`}>
            <div className={styles.aiHeader}>
              <div className={styles.aiTitleRow}>
                <svg className={styles.aiIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 3l1.2 4.2L17 8.5l-3.8 1.3L12 14l-1.2-4.2L7 8.5l3.8-1.3L12 3z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                  />
                </svg>
                <h2 className={styles.aiTitle}>ИИ-Помощник</h2>
              </div>
              <span className={styles.statusOnline}>
                <span className={styles.statusDot} />
                Онлайн
              </span>
            </div>
            <div className={styles.chatBody}>
              {state.aiChatMessages.map((m) =>
                m.role === 'assistant' ? (
                  <div key={m.id} className={styles.bubbleAi}>
                    {m.content}
                  </div>
                ) : (
                  <div key={m.id} className={styles.bubbleUser}>
                    {m.content}
                  </div>
                )
              )}
              {!authReady && (
                <p className={styles.hintLoading}>Восстанавливаем сессию...</p>
              )}
              {authReady && aiStatus === 'loading' && (
                <p className={styles.hintLoading}>Подключаю ИИ...</p>
              )}
            </div>
            {aiError ? <div className={styles.hintError}>{aiError}</div> : null}
            <div className={styles.chatInputRow}>
              <input
                type="text"
                className={styles.chatInput}
                placeholder="Спросить совета у ИИ..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={aiStatus === 'loading' || !authReady}
                aria-label="Сообщение ИИ-помощнику"
              />
              <button
                type="button"
                className={styles.sendBtn}
                onClick={sendToAi}
                disabled={aiStatus === 'loading' || !authReady || !chatInput.trim()}
                aria-label="Отправить"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className={`${styles.footerNav} mx-auto w-full max-w-6xl`}>
          <button
            type="button"
            className={styles.btnNext}
            disabled={!canNext}
            onClick={() => navigate('/generator/story')}
          >
            Далее
          </button>
        </div>
      </main>
    </div>
  );
}
