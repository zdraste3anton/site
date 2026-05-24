import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { normalizeCharacterGender } from '../constants/characterGender.js';
import { STANDARD_ARRAY_DEFAULT } from '../utils/dndModifiers';

const CharacterGeneratorContext = createContext(null);

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Привет! Я твой ИИ-помощник. Какой стиль игры тебе ближе? Я помогу подобрать характеристики.',
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}


function extractCharacterDisplayNameFromStory(storyText) {
  const raw = String(storyText || '').replace(/^\uFEFF/, '');
  if (!raw.trim()) return '';

  const firstLine = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find(Boolean);
  if (!firstLine) return '';

  const m = firstLine.match(/^Имя\s*:\s*(.+)$/i);
  if (!m) return '';

  let name = String(m[1] || '').trim();
  name = name.replace(/^["«]|["»]$/g, '').trim();
  if (!name || name.length > 80) return '';
  return name;
}

const initialState = {
  raceId: '',
  classId: '',
  
  gender: 'unknown',
  attributes: { ...STANDARD_ARRAY_DEFAULT },
  aiChatMessages: [WELCOME_MESSAGE],
  playStylePrompt: '',
  archetypeLabel: '',
  generatedStory: '',
  characterDisplayName: '',
  storyUserPrompt: '',
  storyGenerationKey: 0,
  portraitImage: '',
  finalCharacterSummary: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_RACE_ID': {
      const next = action.payload;
      const changed = next !== state.raceId;
      return {
        ...state,
        raceId: next,
        ...(changed
          ? { generatedStory: '', characterDisplayName: '', storyGenerationKey: 0 }
          : {}),
      };
    }
    case 'SET_CLASS_ID': {
      const next = action.payload;
      const changed = next !== state.classId;
      return {
        ...state,
        classId: next,
        ...(changed
          ? { generatedStory: '', characterDisplayName: '', storyGenerationKey: 0 }
          : {}),
      };
    }
    case 'SET_GENDER': {
      const next = normalizeCharacterGender(action.payload);
      if (next === state.gender) return state;
      return {
        ...state,
        gender: next,
        generatedStory: '',
        characterDisplayName: '',
        storyGenerationKey: 0,
      };
    }
    case 'SET_ATTRIBUTES':
      return { ...state, attributes: { ...action.payload } };
    case 'RESET_ATTRIBUTES':
      return { ...state, attributes: { ...STANDARD_ARRAY_DEFAULT } };
    case 'ADD_CHAT_USER': {
      const text = String(action.payload || '').trim();
      const userMsg = { id: uid(), role: 'user', content: text };
      const playStylePrompt = state.playStylePrompt
        ? `${state.playStylePrompt}\n${text}`.trim()
        : text;
      return {
        ...state,
        aiChatMessages: [...state.aiChatMessages, userMsg],
        playStylePrompt,
      };
    }
    case 'ADD_CHAT_ASSISTANT': {
      const text = String(action.payload || '').trim();
      const msg = { id: uid(), role: 'assistant', content: text };
      return { ...state, aiChatMessages: [...state.aiChatMessages, msg] };
    }
    case 'SET_ARCHETYPE':
      return { ...state, archetypeLabel: action.payload || '' };
    case 'SET_STORY': {
      const generatedStory = action.payload || '';
      return {
        ...state,
        generatedStory,
        characterDisplayName: extractCharacterDisplayNameFromStory(generatedStory),
      };
    }
    case 'SET_STORY_USER_PROMPT':
      return { ...state, storyUserPrompt: action.payload || '' };
    case 'BUMP_STORY_KEY':
      return {
        ...state,
        storyGenerationKey: state.storyGenerationKey + 1,
        characterDisplayName: '',
      };
    case 'SET_PORTRAIT_IMAGE':
      return { ...state, portraitImage: action.payload || '' };
    case 'SET_FINAL_SUMMARY':
      return { ...state, finalCharacterSummary: action.payload };
    case 'RESET_GENERATOR':
      return {
        ...initialState,
        aiChatMessages: [WELCOME_MESSAGE],
      };
    default:
      return state;
  }
}

export function CharacterGeneratorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <CharacterGeneratorContext.Provider value={value}>
      {children}
    </CharacterGeneratorContext.Provider>
  );
}

export function useCharacterGenerator() {
  const ctx = useContext(CharacterGeneratorContext);
  if (!ctx) {
    throw new Error('useCharacterGenerator must be used within CharacterGeneratorProvider');
  }
  return ctx;
}
