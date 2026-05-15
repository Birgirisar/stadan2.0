export const DarkColors = {
  bg: '#0a0c0f',
  bgRgb: '10, 12, 15',
  surface: '#14171c',
  surfaceElev: '#1a1e24',
  surfaceSunken: '#0e1115',
  border: '#23282f',
  borderStrong: '#2d333c',
  text: '#f1f2f4',
  textSecondary: '#a3a8b2',
  textMuted: '#6c727c',
  accent: '#2dd47e',
  accentSoft: '#0f3325',
  live: '#ff5c5c',
  liveSoft: '#2a1414',
  liveBorder: '#61373C',
  gold: '#e8b04a',
  goldSoft: '#3a2e10',
  win: '#15a85f',
  draw: '#3a3f47',
  loss: '#d6334a',
  promotion: '#15a85f',
  relegation: '#d6334a',
} as const;

export const LightColors = {
  bg: '#f4f4f1',
  bgRgb: '244, 244, 241',
  surface: '#ffffff',
  surfaceElev: '#ffffff',
  surfaceSunken: '#ebebe6',
  border: '#e3e3dc',
  borderStrong: '#d4d4cb',
  text: '#0e1014',
  textSecondary: '#5a5d66',
  textMuted: '#8a8d96',
  accent: '#0a4d2e',
  accentSoft: '#d8efe2',
  live: '#e23838',
  liveSoft: '#fde8e8',
  liveBorder: '#E3B3AE',
  gold: '#c98a1a',
  goldSoft: '#f7e9c4',
  win: '#1b8c3f',
  draw: '#6c727c',
  loss: '#d6334a',
  promotion: '#1b8c3f',
  relegation: '#d6334a',
} as const;

export interface ThemeColors {
  bg: string;
  bgRgb: string;
  surface: string;
  surfaceElev: string;
  surfaceSunken: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  live: string;
  liveSoft: string;
  liveBorder: string;
  gold: string;
  goldSoft: string;
  win: string;
  draw: string;
  loss: string;
  promotion: string;
  relegation: string;
}
