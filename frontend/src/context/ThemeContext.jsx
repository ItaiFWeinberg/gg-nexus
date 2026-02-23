import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import THEMES from './themeConstants';

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext(null);

export default function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => {
    try {
      return localStorage.getItem('gg_nexus_theme') || 'red';
    } catch {
      return 'red';
    }
  });

  const applyTheme = useCallback((key) => {
    const theme = THEMES[key] || THEMES.red;
    const root = document.documentElement;
    root.style.setProperty('--color-nox-red', theme.accent);
    root.style.setProperty('--color-nox-red-bright', theme.bright);
    root.style.setProperty('--color-nox-red-dim', theme.dim);
    root.style.setProperty('--color-nox-red-glow', theme.glow);
    root.style.setProperty('--color-nox-red-glow-strong', theme.glowStrong);
  }, []);

  useEffect(() => { applyTheme(themeKey); }, [themeKey, applyTheme]);

  const setTheme = useCallback((key) => {
    setThemeKey(key);
    try {
      localStorage.setItem('gg_nexus_theme', key);
    } catch {
      // storage unavailable
    }
  }, []);

  const value = useMemo(() => ({
    themeKey, setTheme, themes: THEMES, accent: (THEMES[themeKey] || THEMES.red).accent,
  }), [themeKey, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}