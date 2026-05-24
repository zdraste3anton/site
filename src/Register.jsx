import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import AuthLayout from './components/AuthLayout';
import BrandLogo from './components/BrandLogo';
import EyeIcon from './components/EyeIcon';
import { useAuth, mapApiUserToClient } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import * as authService from './services/authService';
import { ApiClientError } from './services/api';
import { mapApiErrorMessage, SUCCESS } from './constants/uiMessages';
import cardStyles from './components/AuthCard.module.css';

export default function Register() {
  const navigate = useNavigate();
  const { login, isAuthenticated, ready } = useAuth();
  const { showSuccess } = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (ready && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const trimmedEmail = email.trim();
    const name = username.trim();
    const pwd = password.trim();
    const pwd2 = confirmPassword.trim();
    if (!trimmedEmail) {
      setFormError('Укажите электронную почту.');
      return;
    }
    if (!pwd) {
      setFormError('Придумайте пароль.');
      return;
    }
    if (pwd.length < 6) {
      setFormError('Пароль: минимум 6 символов.');
      return;
    }
    if (pwd !== pwd2) {
      setFormError('Пароли не совпадают.');
      return;
    }
    if (name.length > 0 && name.length < 2) {
      setFormError('Имя пользователя: минимум 2 символа.');
      return;
    }
    let usernameForApi = name || trimmedEmail.split('@')[0] || 'player';
    if (usernameForApi.length < 2) {
      usernameForApi = `${usernameForApi}_cf`.slice(0, 80);
    }
    setSubmitting(true);
    try {
      const data = await authService.registerAccount({
        username: usernameForApi.slice(0, 80),
        email: trimmedEmail,
        password: pwd,
      });
      const u = mapApiUserToClient(data.user);
      if (!u || !data.token) {
        setFormError('Некорректный ответ сервера.');
        return;
      }
      login(u, data.token);
      showSuccess(SUCCESS.REGISTER);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      let msg = mapApiErrorMessage(err, 'Сервер недоступен');
      if (err instanceof ApiClientError && (err.status === 409 || err.code === 'EMAIL_EXISTS')) {
        msg = 'Пользователь уже существует';
      }
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className={cardStyles.card}>
        <BrandLogo variant="card" />
        <h1 className={cardStyles.title}>Регистрация героя</h1>
        <p className={cardStyles.subtitle}>Начните своё приключение прямо сейчас</p>
        <form className={cardStyles.form} onSubmit={handleSubmit} noValidate>
          {formError ? <div className={cardStyles.formError}>{formError}</div> : null}
          <label className={cardStyles.label} htmlFor="reg-username">
            Имя пользователя
          </label>
          <input
            id="reg-username"
            className={cardStyles.input}
            type="text"
            name="username"
            autoComplete="username"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={submitting}
          />
          <label className={cardStyles.label} htmlFor="reg-email">
            Электронная почта
          </label>
          <input
            id="reg-email"
            className={cardStyles.input}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Электронная почта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
          <label className={cardStyles.label} htmlFor="reg-password">
            Пароль
          </label>
          <div className={cardStyles.passwordWrap}>
            <input
              id="reg-password"
              className={cardStyles.input}
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
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
          <label className={cardStyles.label} htmlFor="reg-confirm">
            Подтвердите пароль
          </label>
          <div className={cardStyles.passwordWrap}>
            <input
              id="reg-confirm"
              className={cardStyles.input}
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Подтвердите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
            />
            <button
              type="button"
              className={cardStyles.eyeBtn}
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Скрыть пароль' : 'Показать пароль'}
              aria-pressed={showConfirm}
              disabled={submitting}
            >
              <EyeIcon open={!showConfirm} />
            </button>
          </div>
          <button type="submit" className={cardStyles.submit} disabled={submitting}>
            {submitting ? (
              <>
                <span className={cardStyles.submitSpinner} aria-hidden />
                Создание...
              </>
            ) : (
              'Создать героя'
            )}
          </button>
        </form>
        <p className={cardStyles.secondaryRow}>
          Уже есть аккаунт?{' '}
          <Link to="/login" className={cardStyles.linkBtn}>
            Войти
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
