import React from 'react';
import ParticleBackground from './ParticleBackground';
import styles from './BackgroundEffects.module.css';

export default function BackgroundEffects() {
  return (
    <>
      <div className={styles.orbPurple} aria-hidden />
      <div className={styles.orbOrange} aria-hidden />
      <ParticleBackground variant="viewport" />
    </>
  );
}
