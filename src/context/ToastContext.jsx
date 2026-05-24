import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, variant = 'info', duration = 4200) => {
      const id = ++idSeq;
      setToasts((prev) => [...prev, { id, message: String(message || ''), variant }]);
      const tid = setTimeout(() => remove(id), duration);
      timers.current.set(id, tid);
      return id;
    },
    [remove]
  );

  const showSuccess = useCallback((message) => push(message, 'success'), [push]);
  const showError = useCallback((message) => push(message, 'error', 5200), [push]);
  const showInfo = useCallback((message) => push(message, 'info'), [push]);

  const value = useMemo(
    () => ({ toasts, remove, showSuccess, showError, showInfo, push }),
    [toasts, remove, showSuccess, showError, showInfo, push]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
