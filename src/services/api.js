

export const TOKEN_KEY = 'token';

const LEGACY_TOKEN_KEY = 'characterforge_auth_token';


export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'
).replace(/\/$/, '');

export class ApiClientError extends Error {
  constructor(status, message, code) {
    super(message || 'Ошибка запроса');
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

function readToken() {
  try {
    let t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      const leg = localStorage.getItem(LEGACY_TOKEN_KEY);
      if (leg) {
        localStorage.setItem(TOKEN_KEY, leg);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        t = leg;
      }
    }
    return t || null;
  } catch {
    return null;
  }
}

function buildUrl(path) {
  const p = String(path || '').replace(/^\//, '');
  return `${API_BASE_URL}/${p}`;
}

function humanizeNetworkError(err) {
  if (err && err.name === 'TypeError' && /fetch|network|failed/i.test(String(err.message))) {
    return 'Сервер недоступен';
  }
  return err?.message || 'Не удалось выполнить запрос';
}


export async function apiRequest(path, opts = {}) {
  const { method = 'GET', body, auth = false, signal, headers: extraHeaders } = opts;
  const url = buildUrl(path);

  const headers = { ...extraHeaders };
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const t = readToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    throw new ApiClientError(0, humanizeNetworkError(err), 'NETWORK');
  }

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text.slice(0, 200) };
    }
  }

  if (!res.ok) {
    if (auth && res.status === 401) {
      window.dispatchEvent(new CustomEvent('cf-unauthorized'));
    }

    let msg =
      (typeof data.message === 'string' && data.message.trim()) ||
      (typeof data.error === 'string' && data.error.trim()) ||
      `Ошибка ${res.status}`;

    if (res.status === 500) {
      
      
      
      console.error('[API 500]', { url, method, requestBody: body, response: data });
      msg = 'Ошибка сервера, попробуйте позже';
    }

    throw new ApiClientError(res.status, msg, data.code);
  }

  return data;
}


export function getApiBase() {
  return API_BASE_URL.replace(/\/api$/, '');
}
