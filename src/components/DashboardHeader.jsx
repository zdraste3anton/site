import React, { useEffect, useState } from 'react';
import { Link, NavLink, useMatch, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import styles from './DashboardHeader.module.css';

const navLinkClass = ({ isActive }) =>
  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`.trim();

function BurgerIcon({ open }) {
  return (
    <span className={styles.burger} aria-hidden>
      <span className={`${styles.burgerBar} ${open ? styles.burgerBar1Open : ''}`} />
      <span className={`${styles.burgerBar} ${open ? styles.burgerBarMid : ''}`} />
      <span className={`${styles.burgerBar} ${open ? styles.burgerBar3Open : ''}`} />
    </span>
  );
}

export default function DashboardHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const generatorMatch = useMatch({ path: '/generator/*' });
  const profileMatch = useMatch({ path: '/profile/*' });
  const characterSheetMatch = useMatch({ path: '/characters/:id' });
  const profileNavActive = Boolean(profileMatch || characterSheetMatch);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/dashboard" className={styles.brand}>
          <BrandLogo className={styles.brandMark} />
          <span className={styles.brandText}>CharacterForge</span>
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={menuOpen}
          aria-controls="cf-main-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={styles.srOnly}>{menuOpen ? 'Закрыть меню' : 'Открыть меню'}</span>
          <BurgerIcon open={menuOpen} />
        </button>

        <div
          className={`${styles.navBackdrop} ${menuOpen ? styles.navBackdropVisible : ''}`}
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />

        <nav id="cf-main-nav" className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`} aria-label="Основная навигация">
          <NavLink to="/dashboard" className={navLinkClass} end onClick={() => setMenuOpen(false)}>
            Главная
          </NavLink>
          <NavLink to="/compendium" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Справочник
          </NavLink>
          <NavLink
            to="/generator/mechanics"
            className={({ isActive }) =>
              `${styles.navLink} ${generatorMatch || isActive ? styles.navLinkActive : ''}`.trim()
            }
            onClick={() => setMenuOpen(false)}
          >
            Генератор
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `${styles.navLink} ${profileNavActive || isActive ? styles.navLinkActive : ''}`.trim()
            }
            onClick={() => setMenuOpen(false)}
          >
            Профиль
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
