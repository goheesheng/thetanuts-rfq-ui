'use client';

import { useState, useEffect } from 'react';

export default function ColorModeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains('light'));
  }, []);

  const toggle = () => {
    const nextLight = !isLight;
    setIsLight(nextLight);
    if (nextLight) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
    try {
      const { setThemeMode } = require('@reown/appkit/react');
      if (typeof setThemeMode === 'function') {
        setThemeMode(nextLight ? 'light' : 'dark');
      }
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] bg-transparent border-none cursor-pointer font-mono text-xs"
      aria-label="Toggle color mode"
    >
      {isLight ? '[dark]' : '[light]'}
    </button>
  );
}
