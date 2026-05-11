import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { DarkColors, LightColors, ThemeColors } from './colors';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colors: DarkColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    AsyncStorage.getItem('theme').then((saved) => {
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    });
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    AsyncStorage.setItem('theme', next);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, colors: theme === 'dark' ? DarkColors : LightColors, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
