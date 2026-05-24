import { ApiClientError } from '../services/api';


export const ERR = {
  SERVER: 'Ошибка сервера, попробуйте позже',
  NETWORK: 'Сервер недоступен',
  AUTH: 'Неверный логин или пароль',
};


export const SUCCESS = {
  LOGIN: 'Вход выполнен',
  REGISTER: 'Регистрация выполнена',
  CHARACTER_DELETED: 'Персонаж удалён',
};


export function mapApiErrorMessage(e, fallback = ERR.NETWORK, opts = {}) {
  const unauthorizedLabel = opts.unauthorizedLabel ?? ERR.AUTH;
  if (e instanceof ApiClientError) {
    if (e.status === 0 || e.code === 'NETWORK') return ERR.NETWORK;
    if (e.status === 500) return ERR.SERVER;
    if (e.status === 401) return unauthorizedLabel;
    return (e.message && String(e.message).trim()) || fallback;
  }
  return fallback;
}

