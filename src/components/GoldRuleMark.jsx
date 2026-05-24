import React, { useId } from 'react';


export default function GoldRuleMark({ className }) {
  const uid = useId().replace(/:/g, '');
  const g1 = `gm1-${uid}`;
  const g2 = `gm2-${uid}`;

  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M10 2c.8 2.2 2.4 3.4 2.4 5.4 0 1.6-.9 2.8-2.4 3.4.6-1 .9-2 .7-3.1C10.2 6.6 8.5 5.2 10 2z"
        fill={`url(#${g1})`}
        opacity="0.95"
      />
      <path
        d="M10 18c-1.2-2-1-3.8.2-5.1 1.1 1.3 1.4 3.1.2 5.1h-.4z"
        fill={`url(#${g2})`}
        opacity="0.85"
      />
      <defs>
        <linearGradient id={g1} x1="8" y1="2" x2="14" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id={g2} x1="10" y1="12" x2="10" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
    </svg>
  );
}
