import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { DarkColors, LightColors, ThemeColors } from './colors';

type Theme = 'dark' | 'light';

const THEME_KEY = 'staðan:theme-preference';

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colors: DarkColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') setThemeState(saved);
    }).catch(() => {
      console.warn('ThemeProvider: failed to load theme preference, defaulting to dark');
    });
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    AsyncStorage.setItem(THEME_KEY, next);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider
      value={{ theme, colors: theme === 'dark' ? DarkColors : LightColors, toggleTheme, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
