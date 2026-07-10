export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const borderWidth = {
  hairline: 0.5,
  thin: 1,
  thick: 2,
} as const;

export const TOUCH_TARGET = 48;
export const TAB_BAR_HEIGHT = 72;
export const HEADER_HEIGHT = 56;

export const layout = {
  screenPadding: spacing.md,
  cardPadding: spacing.md,
  cardGap: spacing.md,
  sectionGap: spacing.lg,
  itemGap: spacing.sm,
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
