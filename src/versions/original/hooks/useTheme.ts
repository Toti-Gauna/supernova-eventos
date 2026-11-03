import { useCallback, useLayoutEffect, useState } from 'react';
import { readStorage, writeStorage } from '../../../lib/storage';

export type Theme = 'dark' | 'light';
const THEME_KEY = 'supernova-theme-v1';
export const COMMERCIAL_THEME_KEY = 'orbita-commercial-theme-v1';

function initialTheme(key: string, fallback: Theme): Theme {
  const stored = readStorage<unknown>(key, fallback);
  return stored === 'light' ? 'light' : 'dark';
}

/** Comercial passes its own key and a light default; the original keeps the shared dark default. */
export function useTheme(key = THEME_KEY, fallback: Theme = 'dark') {
  const [theme, setTheme] = useState<Theme>(() => initialTheme(key, fallback));

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f5f7fa' : '#030b1c');
    writeStorage(key, theme);
  }, [key, theme]);

  const toggleTheme = useCallback(() => setTheme(current => current === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggleTheme };
}