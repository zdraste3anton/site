

const AI_BASE =
  (process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '') + '/ai';

function humanizeError(status, statusText, bodyError) {
  if (bodyError && String(bodyError).trim()) return String(bodyError).trim();
  if (status === 404) {
    return 'Сервер ИИ не найден (404). Убедитесь, что backend запущен на http://localhost:3001';
  }
  if (status === 0 || status === 502 || status === 503) {
    return 'Сервис ИИ временно недоступен. Проверьте, что API-сервер запущен.';
  }
  if (status === 504) {
    return bodyError && String(bodyError).trim()
      ? String(bodyError).trim()
      : 'Запрос к ИИ занял слишком много времени. Повторите попытку.';
  }
  if (status >= 500) {
    return 'Ошибка сервера, попробуйте позже';
  }
  return `Ошибка ${status}${statusText ? ` ${statusText}` : ''}`;
}


async function postJson(subPath, body, options) {
  const signal = options && options.signal;
  const url = `${AI_BASE}${subPath.startsWith('/') ? subPath : `/${subPath}`}`;
  if (process.env.NODE_ENV === 'development') {
    
    console.info('[CharacterForge AI]', 'POST', url);
  }

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw err;
    }
    const msg =
      err && err.message
        ? `Нет соединения с сервером (${err.message}). Запустите backend на http://localhost:3001`
        : 'Нет соединения с сервером. Запустите backend.';
    throw new Error(msg);
  }

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = humanizeError(res.status, res.statusText, data.message || data.error);
    throw new Error(msg);
  }
  return data;
}


export function fetchAiAttributes(payload, options) {
  return postJson('/attributes', payload, options || {});
}


export function fetchAiStory(payload, options) {
  return postJson('/story', payload, options || {});
}

export const requestAttributes = fetchAiAttributes;
export const requestStory = fetchAiStory;
