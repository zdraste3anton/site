import React from 'react';
import styles from './SearchBar.module.css';

export default function SearchBar({ value, onChange, placeholder, ariaLabel, fullWidth = false }) {
  return (
    <div className={`${styles.searchWrap} ${fullWidth ? styles.searchWrapFull : ''}`}>
      <input
        type="search"
        className={styles.search}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
      />
    </div>
  );
}
