/**
 * Apple Semantic Colors — high-end minimalist.
 * Background #FFFFFF, Secondary #F2F2F7, Accent #007AFF.
 * No berry/cyan/purple; subtle clean surfaces only. Use useTheme() for scheme-aware colors.
 */

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryAlpha: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  accentAlpha: string;
  gold: string;
  goldLight: string;
  goldDark: string;
  goldAlpha: string;
  success: string;
  danger: string;
  dangerAlpha: string;
  warning: string;
  warningAlpha: string;
  info: string;
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  overlay: string;
  overlayLight: string;
  border: string;
  borderLight: string;
  borderActive: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  textOnPrimary: string;
  pinAvailable: string;
  pinOccupied: string;
  pinContributed: string;
  pinCommunity: string;
  online: string;
  away: string;
  offline: string;
  gradPrimary: readonly [string, string];
  gradAccent: readonly [string, string];
  gradGold: readonly [string, string];
  gradDark: readonly [string, string];
  gradCard: readonly [string, string];
  gradOverlay: readonly [string, string];
  gradHero: readonly [string, string, string];
  reasonJobLoss: string;
  reasonLovedOne: string;
  reasonHighRates: string;
  reasonExploring: string;
  transparent: string;
}

export const AppleLight = {
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0051D5',
  primaryAlpha: 'rgba(0, 122, 255, 0.15)',

  accent: '#34C759',
  accentLight: '#5DD879',
  accentDark: '#248A3D',
  accentAlpha: 'rgba(52, 199, 89, 0.15)',

  gold: '#FF9F0A',
  goldLight: '#FFB340',
  goldDark: '#C93400',
  goldAlpha: 'rgba(255, 159, 10, 0.15)',

  success: '#34C759',
  danger: '#FF3B30',
  dangerAlpha: 'rgba(255, 59, 48, 0.15)',
  warning: '#FF9500',
  warningAlpha: 'rgba(255, 149, 0, 0.15)',
  info: '#5AC8FA',

  bg: '#FFFFFF',
  surface: '#F2F2F7',
  surface2: '#E5E5EA',
  surface3: '#D1D1D6',
  overlay: 'rgba(0,0,0,0.4)',
  overlayLight: 'rgba(0,0,0,0.2)',

  border: '#C6C6C8',
  borderLight: '#E5E5EA',
  borderActive: '#007AFF',

  text: '#000000',
  textSecondary: '#8E8E93',
  textDisabled: '#C7C7CC',
  textOnPrimary: '#FFFFFF',

  pinAvailable: '#34C759',
  pinOccupied: '#FF9F0A',
  pinContributed: '#007AFF',
  pinCommunity: '#5AC8FA',

  online: '#34C759',
  away: '#FF9500',
  offline: '#8E8E93',

  /* Subtle surfaces only — no berry/purple/cyan gradients */
  gradPrimary: ['#007AFF', '#007AFF'] as const,
  gradAccent: ['#34C759', '#34C759'] as const,
  gradGold: ['#FF9F0A', '#FF9F0A'] as const,
  gradDark: ['#F2F2F7', '#FFFFFF'] as const,
  gradCard: ['#E5E5EA', '#F2F2F7'] as const,
  gradOverlay: ['transparent', 'rgba(255,255,255,0.95)'] as const,
  gradHero: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#FFFFFF'] as const,

  reasonJobLoss: '#FF3B30',
  reasonLovedOne: '#8E8E93',
  reasonHighRates: '#FF9500',
  reasonExploring: '#34C759',

  transparent: 'transparent',
} as const;

export const AppleDark = {
  primary: '#0A84FF',
  primaryLight: '#409CFF',
  primaryDark: '#0066CC',
  primaryAlpha: 'rgba(10, 132, 255, 0.2)',

  accent: '#30D158',
  accentLight: '#5DD879',
  accentDark: '#248A3D',
  accentAlpha: 'rgba(48, 209, 88, 0.2)',

  gold: '#FF9F0A',
  goldLight: '#FFB340',
  goldDark: '#C93400',
  goldAlpha: 'rgba(255, 159, 10, 0.2)',

  success: '#30D158',
  danger: '#FF453A',
  dangerAlpha: 'rgba(255, 69, 58, 0.2)',
  warning: '#FF9F0A',
  warningAlpha: 'rgba(255, 159, 10, 0.2)',
  info: '#64D2FF',

  bg: '#000000',
  surface: '#1C1C1E',
  surface2: '#2C2C2E',
  surface3: '#3A3A3C',
  overlay: 'rgba(0,0,0,0.75)',
  overlayLight: 'rgba(0,0,0,0.4)',

  border: '#38383A',
  borderLight: '#48484A',
  borderActive: '#0A84FF',

  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textDisabled: '#636366',
  textOnPrimary: '#FFFFFF',

  pinAvailable: '#30D158',
  pinOccupied: '#FF9F0A',
  pinContributed: '#0A84FF',
  pinCommunity: '#64D2FF',

  online: '#30D158',
  away: '#FF9F0A',
  offline: '#636366',

  gradPrimary: ['#0A84FF', '#0A84FF'] as const,
  gradAccent: ['#30D158', '#30D158'] as const,
  gradGold: ['#FF9F0A', '#FF9F0A'] as const,
  gradDark: ['#1C1C1E', '#000000'] as const,
  gradCard: ['#2C2C2E', '#1C1C1E'] as const,
  gradOverlay: ['transparent', 'rgba(0,0,0,0.98)'] as const,
  gradHero: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)', '#000000'] as const,

  reasonJobLoss: '#FF453A',
  reasonLovedOne: '#8E8E93',
  reasonHighRates: '#FF9F0A',
  reasonExploring: '#30D158',

  transparent: 'transparent',
} as const;

export type AppleColorSet = typeof AppleLight;

export function getColors(scheme: 'light' | 'dark'): ColorPalette {
  return scheme === 'dark' ? AppleDark : AppleLight;
}

/** Legacy: same as AppleDark. Use getColors(scheme) or useTheme() for scheme-aware palette. */
export const Colors: ColorPalette = AppleDark;

export type ColorKey = keyof ColorPalette;

export const withAlpha = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};
