export function abilityModifier(score) {
  const n = Number(score);
  if (Number.isNaN(n)) return 0;
  return Math.floor((n - 10) / 2);
}

export function formatModifier(mod) {
  if (mod >= 0) return `+${mod}`;
  return String(mod);
}


export const STANDARD_ARRAY_VALUES = [15, 14, 13, 12, 10, 8];

export const STANDARD_ARRAY_DEFAULT = {
  str: 15,
  dex: 14,
  con: 13,
  int: 12,
  wis: 10,
  cha: 8,
};

const SORTED_STANDARD = [...STANDARD_ARRAY_VALUES].sort((a, b) => b - a);


export function isStandardArrayDistribution(attrs) {
  if (!attrs || typeof attrs !== 'object') return false;
  const keys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const vals = keys.map((k) => attrs[k]).sort((a, b) => b - a);
  if (vals.length !== 6 || vals.some((v) => typeof v !== 'number')) return false;
  return vals.every((v, i) => v === SORTED_STANDARD[i]);
}


export function swapStandardAttribute(attrs, statKey, newValue) {
  if (!STANDARD_ARRAY_VALUES.includes(newValue)) return { ...attrs };
  const next = { ...attrs };
  const prev = next[statKey];
  if (prev === newValue) return next;
  const partner = Object.keys(next).find((k) => k !== statKey && next[k] === newValue);
  if (partner) {
    next[statKey] = newValue;
    next[partner] = prev;
  } else {
    next[statKey] = newValue;
  }
  return next;
}
