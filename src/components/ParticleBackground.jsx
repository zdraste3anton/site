import React, { useMemo } from 'react';
import styles from './ParticleBackground.module.css';

const PARTICLE_COUNT = 18;

function buildParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 4,
    driftDur: 16 + Math.random() * 24,
    driftDelay: Math.random() * -40,
    dx: (Math.random() - 0.5) * 100,
    dy: (Math.random() - 0.5) * 100,
    twinkleDur: 4 + Math.random() * 6,
    twinkleDelay: Math.random() * -12,
    baseOpacity: 0.32 + Math.random() * 0.38,
  }));
}


export default function ParticleBackground({ variant = 'section' }) {
  const particles = useMemo(buildParticles, []);
  const layerClass =
    variant === 'viewport' ? `${styles.layer} ${styles.layerViewport}` : `${styles.layer} ${styles.layerSection}`;

  return (
    <div className={layerClass} aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className={styles.particle}
          style={{
            '--left': `${p.left}%`,
            '--top': `${p.top}%`,
            '--size': `${p.size}px`,
            '--drift-dur': `${p.driftDur}s`,
            '--drift-delay': `${p.driftDelay}s`,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--twinkle-dur': `${p.twinkleDur}s`,
            '--twinkle-delay': `${p.twinkleDelay}s`,
            '--base-opacity': p.baseOpacity,
          }}
        />
      ))}
    </div>
  );
}
