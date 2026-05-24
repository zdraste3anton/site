import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import AuthLayout from './components/AuthLayout';
import BrandLogo from './components/BrandLogo';
import EyeIcon from './components/EyeIcon';
import { useAuth, mapApiUserToClient } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import * as authService from './services/authService';
import { mapApiErrorMessage, SUCCESS } from './constants/uiMessages';
import cardStyles from './components/AuthCard.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, ready } = useAuth();
  const { showSuccess } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (ready && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const trimmed = email.trim();
    const pwd = password.trim();
    if (!trimmed) {
      setFormError('Укажите электронную почту.');
      return;
    }
    if (!pwd) {
      setFormError('Введите пароль.');
      return;
    }
    setSubmitting(true);
    try {
      const data = await authService.loginAccount({ email: trimmed, password: pwd });
      const u = mapApiUserToClient(data.user);
      if (!u || !data.token) {
        setFormError('Некорректный ответ сервера.');
        return;
      }
      login(u, data.token);
      showSuccess(SUCCESS.LOGIN);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = mapApiErrorMessage(err, 'Сервер недоступен');
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className={cardStyles.card}>
        <BrandLogo variant="card" />
        <h1 className={cardStyles.title}>Вход в Таверну</h1>
        <p className={cardStyles.subtitle}>Продолжите создание своей легенды</p>
        <form className={cardStyles.form} onSubmit={handleSubmit} noValidate>
          {formError ? <div className={cardStyles.formError}>{formError}</div> : null}
          <label className={cardStyles.label} htmlFor="login-email">
            Электронная почта
          </label>
          <input
            id="login-email"
            className={cardStyles.input}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Электронная почта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
          <label className={cardStyles.label} htmlFor="login-password">
            Пароль
          </label>
          <div className={cardStyles.passwordWrap}>
            <input
              id="login-password"
              className={cardStyles.input}
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
            <button
              type="button"
              className={cardStyles.eyeBtn}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              aria-pressed={showPassword}
              disabled={submitting}
            >
              <EyeIcon open={!showPassword} />
            </button>
          </div>
          <button type="submit" className={cardStyles.submit} disabled={submitting}>
            {submitting ? (
              <>
                <span className={cardStyles.submitSpinner} aria-hidden />
                Вход...
              </>
            ) : (
              'Войти'
            )}
          </button>
        </form>
        <p className={cardStyles.secondaryRow}>
          Нет аккаунта?{' '}
          <Link to="/register" className={cardStyles.linkBtn}>
            Зарегистрироваться
          </Link>
        </p>
        <div className={cardStyles.dots} aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
      <p className={cardStyles.secureNote}>
        <span className={cardStyles.secureDot} aria-hidden />
        Защищено магией шифрования
      </p>
    </AuthLayout>
  );
}
