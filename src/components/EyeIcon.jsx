import React from 'react';

export default function EyeIcon({ open }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 004.8 4.8M9.9 5.1A10.4 10.4 0 0112 5c6 0 10 7 10 7a18.5 18.5 0 01-5.1 5.7M6.2 6.2A18.3 18.3 0 002 12s4 7 10 7a9.7 9.7 0 004.3-1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
