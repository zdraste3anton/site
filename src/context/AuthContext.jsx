import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService.js';
import { ApiClientError, TOKEN_KEY } from '../services/api.js';

const LEGACY_TOKEN_KEY = 'characterforge_auth_token';
const USER_KEY = 'characterforge_user';

const AuthContext = createContext(null);

export function mapApiUserToClient(u) {
  if (!u) return null;
  const username = u.username != null ? String(u.username) : '';
  return {
    id: u.id,
    email: u.email,
    displayName: username || (u.email && u.email.split('@')[0]) || 'Игрок',
    roleLabel: 'Мастер Игр',
  };
}

function readStoredToken() {
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      
    }
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((nextUser, nextToken) => {
    try {
      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } catch {
      
    }
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const t = readStoredToken();
      if (!t) {
        if (!cancelled) setReady(true);
        return;
      }
      setToken(t);
      try {
        const data = await authService.getCurrentUser();
        const u = data.user != null ? mapApiUserToClient(data.user) : null;
        if (!cancelled) {
          if (u) {
            setUser(u);
            try {
              localStorage.setItem(USER_KEY, JSON.stringify(u));
            } catch {
              
            }
          } else {
            logout();
          }
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiClientError && e.status === 401) {
            logout();
          } else {
            let restored = false;
            try {
              const raw = localStorage.getItem(USER_KEY);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.id) {
                  setUser(parsed);
                  restored = true;
                }
              }
            } catch {
              
            }
            if (!restored) logout();
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [user, token, ready, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
