import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'light' | 'dark';
export type FontSize = 'small' | 'normal' | 'large';

interface ThemeContextValue {
  theme: AppTheme;
  fontSize: FontSize;
  setTheme: (t: AppTheme) => void;
  setFontSize: (s: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  fontSize: 'normal',
  setTheme: () => {},
  setFontSize: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try { return (localStorage.getItem('app-theme') as AppTheme) || 'light'; } catch { return 'light'; }
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    try { return (localStorage.getItem('app-font-size') as FontSize) || 'normal'; } catch { return 'normal'; }
  });

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try { localStorage.setItem('app-theme', theme); } catch {}
  }, [theme]);

  // Apply font-size data attribute to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    try { localStorage.setItem('app-font-size', fontSize); } catch {}
  }, [fontSize]);

  const setTheme = (t: AppTheme) => setThemeState(t);
  const setFontSize = (s: FontSize) => setFontSizeState(s);

  return (
    <ThemeContext.Provider value={{ theme, fontSize, setTheme, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
