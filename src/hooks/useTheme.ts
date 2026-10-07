import { useCallback, useLayoutEffect, useState } from 'react';
import { readStorage, writeStorage } from '../lib/storage';

export type Theme = 'dark' | 'light';
const THEME_KEY = 'supernova-theme-v1';

function initialTheme(): Theme {
  const stored = readStorage<unknown>(THEME_KEY, 'dark');
  return stored === 'light' ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f8f7fc' : '#0c0b14');
    writeStorage(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(current => current === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggleTheme };
}
