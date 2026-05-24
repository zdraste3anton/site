
export function userIdFromEmail(email) {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  let h = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    h = Math.imul(31, h) + normalized.charCodeAt(i);
  }
  return `u_${Math.abs(h)}`;
}

export function newSessionToken() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}
