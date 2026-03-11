/**
 * Theme barrel: re-exports from colors + local design tokens.
 * Colors is AppleDark (legacy compat). Use useTheme() for scheme-aware colors.
 */

import { AppleDark } from './colors';

export {
  ThemeProvider,
  useTheme,
  useThemePreference,
  useThemePreferenceOptional,
  type ThemePreference,
  type ThemeColors,
  LIGHT_THEME,
  DARK_THEME,
} from './ThemeContext';
export {
  Colors,
  AppleLight,
  AppleDark,
  getColors,
  withAlpha,
  type AppleColorSet,
  type ColorKey,
  type ColorPalette,
} from './colors';

// ── Design tokens (no runtime dependency on Colors) ─────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
  button: 14,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

export const FontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  primary: {
    shadowColor: AppleDark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  accent: {
    shadowColor: AppleDark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const AnimationConfig = {
  spring: { damping: 20, stiffness: 200, mass: 1 },
  fastSpring: { damping: 30, stiffness: 300, mass: 0.8 },
  duration: { fast: 150, normal: 250, slow: 400 },
} as const;

export const Theme = {
  colors: AppleDark,
  spacing: Spacing,
  borderRadius: BorderRadius,
  fontSize: FontSize,
  fontWeight: FontWeight,
  fontFamily: FontFamily,
  shadows: Shadows,
  animation: AnimationConfig,
} as const;

export type ThemeType = typeof Theme;
