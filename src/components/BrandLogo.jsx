import React from 'react';
import logoSrc from '../assets/brand-logo.png';
import styles from './BrandLogo.module.css';

export default function BrandLogo({ className = '', variant = 'header' }) {
  const sizeClass = variant === 'card' ? styles.inCard : styles.inHeader;
  return <img src={logoSrc} alt="" className={`${sizeClass} ${className}`.trim()} decoding="async" />;
}
