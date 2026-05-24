import { randomUUID } from 'node:crypto';
import { ApiError } from '../utils/apiError.js';
import { gigachatFetch } from '../utils/gigachatHttp.js';


let tokenCache = {
  accessToken: null,
  
  expiresAtMs: 0,
};


let oauthInFlight = null;

function getTimeoutMs() {
  const n = Number(process.env.GIGACHAT_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : 120000;
}

function authorizationBasicHeader() {
  let key = String(process.env.GIGACHAT_AUTH_KEY || '');
  
  key = key.replace(/^\s*["']|["']\s*$/g, '');
  key = key.replace(/\r?\n/g, '').trim();
  if (!key) return null;
  
  if (/^authorization:\s*basic\s+/i.test(key)) {
    key = key.replace(/^authorization:\s*basic\s+/i, '').trim();
  }
  
  if (/^basic\s+/i.test(key)) {
    key = key.replace(/^basic\s+/i, '').trim();
  }
  while (/^basic\s+/i.test(key)) {
    
    key = key.replace(/^basic\s+/i, '').trim();
  }

  
  key = key.replace(/\s+/g, '');

  return `Basic ${key}`;
}

function computeTokenExpiryMs(json) {
  const now = Date.now();
  if (typeof json.expires_in === 'number' && json.expires_in > 0) {
    const sec = Math.max(60, json.expires_in - 120);
    return now + sec * 1000;
  }
  if (typeof json.expires_at === 'number' && json.expires_at > 0) {
    const t = json.expires_at;
    const absMs = t > 1e12 ? t : t * 1000;
    return Math.max(now + 60_000, absMs - 120_000);
  }
  return now + 28 * 60 * 1000;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mapFetchError(err) {
  if (err instanceof ApiError) return err;
  const name = String(err?.name || '');
  const msg = String(err?.message || '');
  const code = String(err?.code || err?.cause?.code || '');
  const tlsLike =
    /CERT_|UNABLE_TO_VERIFY_LEAF_SIGNATURE|SELF_SIGNED_CERT_IN_CHAIN|ERR_TLS|TLS|SSL|certificate/i.test(
      `${code} ${msg}`
    );
  if (tlsLike) {
    return new ApiError(
      503,
      'Не удалось установить защищённое соединение с GigaChat (проблема SSL/сертификата). ' +
        'Проверьте системные корневые сертификаты/прокси. Для dev можно временно поставить GIGACHAT_VERIFY_SSL=false.',
      'GIGACHAT_TLS_ERROR'
    );
  }
  if (name === 'AbortError' || /aborted|timeout|ETIMEDOUT|ECONNRESET|fetch failed/i.test(msg)) {
    return new ApiError(
      504,
      'Запрос к GigaChat превысил время ожидания или сеть оборвалась.',
      'GIGACHAT_TIMEOUT'
    );
  }
  return new ApiError(502, 'Не удалось связаться с GigaChat.', 'GIGACHAT_NETWORK');
}


async function performGigaChatOAuth() {
  const authHeader = authorizationBasicHeader();
  if (!authHeader) {
    throw new ApiError(503, 'Сервис ИИ не настроен', 'GIGACHAT_NOT_CONFIGURED');
  }

  const authUrl =
    String(process.env.GIGACHAT_AUTH_URL || '').trim() ||
    'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
  const scope = String(process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS').trim();

  console.log('[AI] getting gigachat token');
  
  const rawKey = String(process.env.GIGACHAT_AUTH_KEY || '');
  const rawKeyTrimmed = rawKey.replace(/\r?\n/g, '').trim();
  const rawKeyLooksPrefixed = /^basic\s+/i.test(rawKeyTrimmed) || /^authorization:\s*basic\s+/i.test(rawKeyTrimmed);
  console.log('[AI] gigachat oauth config', {
    hasAuthKey: Boolean(rawKeyTrimmed),
    authKeyLength: rawKeyTrimmed.length,
    authKeyStartsWithBasic: rawKeyLooksPrefixed,
    scope,
    authUrl,
  });

  
  const body = new URLSearchParams({ scope }).toString();
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), getTimeoutMs());

  let res;
  try {
    res = await gigachatFetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        RqUID: randomUUID(),
        Authorization: authHeader,
      },
      body,
      signal: ac.signal,
    });
  } catch (e) {
    clearTimeout(tid);
    const code = e?.code || e?.cause?.code;
    console.error(
      '[AI] token request failed:',
      e?.name,
      code ? `code=${code}` : '',
      String(e?.message || e).slice(0, 400)
    );
    throw mapFetchError(e);
  }
  clearTimeout(tid);

  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }

  if (!res.ok) {
    console.error('[AI] OAuth HTTP status', res.status);
    console.error('[AI] OAuth response body (raw)', String(text || '').slice(0, 1500));
    throw new ApiError(
      res.status >= 500 ? 503 : 502,
      'Не удалось получить токен GigaChat. Проверьте GIGACHAT_AUTH_KEY и scope.',
      'GIGACHAT_AUTH_FAILED'
    );
  }

  const accessToken = json.access_token;
  if (!accessToken || typeof accessToken !== 'string') {
    console.error('[AI] OAuth: response without access_token');
    throw new ApiError(502, 'Ответ OAuth GigaChat не содержит access_token.', 'GIGACHAT_AUTH_FAILED');
  }

  tokenCache = {
    accessToken,
    expiresAtMs: computeTokenExpiryMs(json),
  };
  console.log('[AI] gigachat access token obtained and cached');
  return accessToken;
}


export async function getGigaChatAccessToken() {
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAtMs > now + 10_000) {
    console.log('[AI] using cached gigachat token');
    return tokenCache.accessToken;
  }

  if (!oauthInFlight) {
    oauthInFlight = (async () => {
      try {
        const n = Date.now();
        if (tokenCache.accessToken && tokenCache.expiresAtMs > n + 10_000) {
          return tokenCache.accessToken;
        }
        return await performGigaChatOAuth();
      } finally {
        oauthInFlight = null;
      }
    })();
  }

  return oauthInFlight;
}

function normalizeAssistantContent(raw) {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim();
  if (Array.isArray(raw)) {
    return raw
      .map((p) => {
        if (typeof p === 'string') return p;
        if (p && typeof p === 'object') return p.text ?? p.content ?? '';
        return '';
      })
      .join('')
      .trim();
  }
  if (typeof raw === 'object' && raw !== null && 'text' in raw) {
    return String(raw.text ?? '').trim();
  }
  return String(raw).trim();
}


export async function gigachatChatCompletions({ messages, temperature = 0.7, max_tokens = 4000 }) {
  const token = await getGigaChatAccessToken();
  const base =
    String(process.env.GIGACHAT_BASE_URL || '').trim() ||
    'https://gigachat.devices.sberbank.ru/api/v1';
  const url = `${base.replace(/\/$/, '')}/chat/completions`;
  const model = String(process.env.GIGACHAT_MODEL || 'GigaChat').trim() || 'GigaChat';

  console.log('[AI] POST chat/completions', {
    model,
    messagesCount: Array.isArray(messages) ? messages.length : 0,
    temperature,
  });

  const requestBody = JSON.stringify({
    model,
    messages,
    temperature,
    max_tokens,
    stream: false,
  });

  
  const MAX_429_RETRIES = 2;
  let res;
  let text = '';
  let json = {};

  for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt++) {
    if (attempt > 0) {
      const waitMs = attempt === 1 ? 1000 : 2000;
      console.warn('[AI] chat/completions 429, retry after', waitMs, 'ms (attempt', attempt, '/', MAX_429_RETRIES, ')');
      await sleep(waitMs);
    }

    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), getTimeoutMs());

    try {
      res = await gigachatFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: requestBody,
        signal: ac.signal,
      });
    } catch (e) {
      clearTimeout(tid);
      console.error('[AI] chat/completions network error:', e?.name, String(e?.message || e).slice(0, 200));
      throw mapFetchError(e);
    }
    clearTimeout(tid);

    text = await res.text();
    json = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = {};
    }

    if (res.ok) {
      break;
    }

    console.error(
      '[AI] chat HTTP',
      res.status,
      json?.error?.message || json?.message || String(text).slice(0, 150)
    );

    if (res.status === 401) {
      tokenCache = { accessToken: null, expiresAtMs: 0 };
      throw new ApiError(503, 'Токен GigaChat отклонён. Повторите запрос.', 'GIGACHAT_TOKEN_REJECTED');
    }

    if (res.status === 429 && attempt < MAX_429_RETRIES) {
      continue;
    }

    if (res.status === 429) {
      throw new ApiError(503, 'Лимит запросов GigaChat. Подождите и повторите.', 'GIGACHAT_RATE_LIMIT');
    }
    if (res.status === 504 || res.status === 408) {
      throw new ApiError(504, 'Запрос к GigaChat превысил время ожидания.', 'GIGACHAT_TIMEOUT');
    }
    throw new ApiError(502, 'GigaChat вернул ошибку при генерации текста.', 'GIGACHAT_UPSTREAM');
  }

  const choice = json.choices?.[0];
  const rawContent =
    choice?.message?.content ??
    choice?.message?.text ??
    (typeof choice?.text === 'string' ? choice.text : '') ??
    '';

  const out = normalizeAssistantContent(rawContent);
  if (!out) {
    console.error('[AI] empty assistant content in response');
    throw new ApiError(502, 'Пустой ответ модели GigaChat.', 'GIGACHAT_EMPTY_RESPONSE');
  }
  return out;
}
