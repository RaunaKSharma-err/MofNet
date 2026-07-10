import { Platform } from 'react-native';

import type { ViewStyle } from 'react-native';

export const shadows: Record<string, ViewStyle> = {
  none: {},
  sm: {
    shadowColor: '#0A1014',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0A1014',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0A1014',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#0A1014',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: {
    shadowColor: '#17C3B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryGlow: {
    shadowColor: '#006989',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const getShadow = (key: keyof typeof shadows, isDark: boolean = false): ViewStyle => {
  const shadow = shadows[key];
  if (isDark && Platform.OS === 'android') {
    return { elevation: (shadow as any).elevation };
  }
  return shadow;
};
