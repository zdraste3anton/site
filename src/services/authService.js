import { apiRequest } from './api.js';

export async function registerAccount({ username, email, password }) {
  return apiRequest('auth/register', {
    method: 'POST',
    body: { username, email, password },
  });
}

export async function loginAccount({ email, password }) {
  return apiRequest('auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function fetchCurrentUser() {
  return apiRequest('auth/me', { method: 'GET', auth: true });
}


export const getCurrentUser = fetchCurrentUser;
