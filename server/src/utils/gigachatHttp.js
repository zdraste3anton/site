
import { Agent, fetch as undiciFetch } from 'undici';

let cachedInsecureAgent;
let loggedInsecureWarning = false;

export function getGigachatDispatcher() {
  const raw = process.env.GIGACHAT_VERIFY_SSL;
  const insecure = raw === 'false' || raw === '0';
  if (!insecure) {
    return undefined;
  }
  if (!loggedInsecureWarning) {
    loggedInsecureWarning = true;
    console.warn(
      '[GigaChat] GIGACHAT_VERIFY_SSL=false: TLS verification disabled for GigaChat requests. Use only in dev/trusted networks.'
    );
  }
  if (!cachedInsecureAgent) {
    cachedInsecureAgent = new Agent({ connect: { rejectUnauthorized: false } });
  }
  return cachedInsecureAgent;
}

export async function gigachatFetch(url, options = {}) {
  const dispatcher = getGigachatDispatcher();
  return undiciFetch(url, {
    ...options,
    ...(dispatcher ? { dispatcher } : {}),
  });
}
