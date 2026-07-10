import { Platform } from 'react-native';

export const typography = {
  hero: {
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 34,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption: {
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  button: {
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  buttonSmall: {
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  overline: {
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 14,
    letterSpacing: 1,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
} as const;

export type Typography = typeof typography;
