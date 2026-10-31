import { useState, useEffect, useCallback } from 'react';

export function useTheme(): {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
} {
  const [isDark, setIsDarkState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('theme');
    if (stored) {
      return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const applyTheme = useCallback((dark: boolean) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark, applyTheme]);

  const toggleTheme = useCallback(() => {
    setIsDarkState((prev) => {
      const next = !prev;
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  const setTheme = useCallback(
    (dark: boolean) => {
      setIsDarkState(dark);
      applyTheme(dark);
    },
    [applyTheme]
  );

  return { isDark, toggleTheme, setTheme };
}
