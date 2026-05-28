import { useContext } from 'react';
import { ThemeContext } from '../theme/ThemeProvider';

export function useThemePreference() {
  const { theme, setTheme } = useContext(ThemeContext);
  return { preference: theme, setPreference: setTheme };
}
