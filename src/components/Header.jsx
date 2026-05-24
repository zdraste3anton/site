import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const onLogin = path === '/login';
  const onRegister = path === '/register';
  const authFormPage = onLogin || onRegister;

  return (
    <header className={styles.header}>
      <div
        className={`${styles.inner} ${authFormPage ? styles.innerAuthOnly : ''}`.trim()}
      >
        <Link to="/" className={styles.brand}>
          <BrandLogo className={styles.brandMark} />
          <span className={styles.brandText}>CharacterForge</span>
        </Link>
        {!authFormPage ? (
          <button type="button" className={styles.loginBtn} onClick={() => navigate('/login')}>
            Войти
          </button>
        ) : null}
      </div>
    </header>
  );
}
