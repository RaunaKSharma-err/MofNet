interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  background: string;
  surface: string;
  card: string;
  cardElevated: string;
  darkBackground: string;
  darkSurface: string;
  darkCard: string;
  success: string;
  warning: string;
  error: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderLight: string;
  overlay: string;
  glassLight: string;
  glassBorder: string;
  meshConnected: string;
  meshWeak: string;
  meshOffline: string;
  gradientStart: string;
  gradientEnd: string;
}

export type { ThemeColors };

export const lightColors: ThemeColors = {
  primary: '#006989',
  primaryDark: '#004F66',
  primaryLight: '#E6F0F4',
  accent: '#17C3B2',
  accentDark: '#0FA396',
  accentLight: '#E2F8F5',
  background: '#F4F7FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  darkBackground: '#0A1014',
  darkSurface: '#121A21',
  darkCard: '#17212B',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#EF4444',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E9F0',
  borderLight: '#F0F3F8',
  overlay: 'rgba(10, 16, 20, 0.4)',
  glassLight: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',
  meshConnected: '#4CAF50',
  meshWeak: '#FFC107',
  meshOffline: '#9CA3AF',
  gradientStart: '#006989',
  gradientEnd: '#17C3B2',
} satisfies ThemeColors;

export const darkColors: ThemeColors = {
  primary: '#17C3B2',
  primaryDark: '#0FA396',
  primaryLight: '#0E2A33',
  accent: '#17C3B2',
  accentDark: '#0FA396',
  accentLight: '#0E2A33',
  background: '#0A1014',
  surface: '#121A21',
  card: '#17212B',
  cardElevated: '#1E2A36',
  darkBackground: '#0A1014',
  darkSurface: '#121A21',
  darkCard: '#17212B',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#EF4444',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  border: '#243240',
  borderLight: '#1B2632',
  overlay: 'rgba(0, 0, 0, 0.6)',
  glassLight: 'rgba(23, 33, 43, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  meshConnected: '#4CAF50',
  meshWeak: '#FFC107',
  meshOffline: '#4B5563',
  gradientStart: '#006989',
  gradientEnd: '#17C3B2',
} satisfies ThemeColors;
