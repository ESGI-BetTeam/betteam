export const colors = {
  // Backgrounds
  background: '#0B0F1A',
  backgroundCard: 'rgba(255, 255, 255, 0.07)',
  backgroundGlass: 'rgba(16, 185, 129, 0.08)',
  backgroundElevated: '#141925',
  backgroundInput: '#1A1F2E',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#64748B',
  textMuted: '#475569',
  textInverse: '#0B0F1A',

  // Borders
  border: 'rgba(255, 255, 255, 0.10)',
  borderActive: 'rgba(16, 185, 129, 0.30)',

  // Primary / Accent
  accent: '#10B981',
  accentLight: 'rgba(16, 185, 129, 0.15)',
  accentWarning: '#FFC6AD',

  // Secondary
  secondary: '#6366F1',
  secondaryActive: '#6366F1',
  secondaryBackground: 'rgba(99, 102, 241, 0.08)',

  // Alert
  error: '#EF4444',
  errorDark: '#260B0B',
  errorLight: 'rgba(239, 68, 68, 0.15)',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;
