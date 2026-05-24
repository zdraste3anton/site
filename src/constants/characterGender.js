
export const CHARACTER_GENDER_OPTIONS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
  { value: 'unknown', label: 'Не указан' },
];


export function normalizeCharacterGender(raw) {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (s === 'male' || s === 'female' || s === 'unknown') return s;
  return 'unknown';
}
