import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { safeStorage } from '@utils/safeStorage';

const THEME_STORAGE_KEY = 'theme_preference';

export type ThemePreference = 'light' | 'dark' | 'system';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryLight: string;
  border: string;
  divider: string;
  success: string;
  warning: string;
  error: string;
  tabBar: string;
  tabBarBorder: string;
  statusBar: 'dark-content' | 'light-content';
  bg: string;
  surface2: string;
  surface3: string;
  textDisabled: string;
  textOnPrimary: string;
  accent: string;
  danger: string;
  gold: string;
  gradPrimary: readonly [string, string];
  gradAccent: readonly [string, string];
  gradGold: readonly [string, string];
  primaryDark: string;
  primaryAlpha: string;
  accentLight: string;
  accentDark: string;
  accentAlpha: string;
  goldLight: string;
  goldDark: string;
  goldAlpha: string;
  dangerAlpha: string;
  warningAlpha: string;
  info: string;
  overlay: string;
  overlayLight: string;
  borderLight: string;
  borderActive: string;
  pinAvailable: string;
  pinOccupied: string;
  pinContributed: string;
  pinCommunity: string;
  online: string;
  away: string;
  offline: string;
  gradDark: readonly [string, string];
  gradCard: readonly [string, string];
  gradOverlay: readonly [string, string];
  gradHero: readonly [string, string, string];
  reasonJobLoss: string;
  reasonLovedOne: string;
  reasonHighRates: string;
  reasonExploring: string;
  transparent: string;
};

export const LIGHT_THEME: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F7FA',
  surfaceSecondary: '#EEF2F7',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  border: '#E5E7EB',
  divider: '#F3F4F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  statusBar: 'dark-content',
  bg: '#FFFFFF',
  surface2: '#EEF2F7',
  surface3: '#E5E7EB',
  textDisabled: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  accent: '#10B981',
  danger: '#EF4444',
  gold: '#F59E0B',
  gradPrimary: ['#2563EB', '#2563EB'],
  gradAccent: ['#10B981', '#10B981'],
  gradGold: ['#F59E0B', '#F59E0B'],
  primaryDark: '#1D4ED8',
  primaryAlpha: 'rgba(37, 99, 235, 0.15)',
  accentLight: '#34D399',
  accentDark: '#059669',
  accentAlpha: 'rgba(16, 185, 129, 0.15)',
  goldLight: '#FBBF24',
  goldDark: '#D97706',
  goldAlpha: 'rgba(245, 158, 11, 0.15)',
  dangerAlpha: 'rgba(239, 68, 68, 0.15)',
  warningAlpha: 'rgba(245, 158, 11, 0.15)',
  info: '#3B82F6',
  overlay: 'rgba(0,0,0,0.4)',
  overlayLight: 'rgba(0,0,0,0.2)',
  borderLight: '#F3F4F6',
  borderActive: '#2563EB',
  pinAvailable: '#10B981',
  pinOccupied: '#F59E0B',
  pinContributed: '#2563EB',
  pinCommunity: '#3B82F6',
  online: '#10B981',
  away: '#F59E0B',
  offline: '#9CA3AF',
  gradDark: ['#F5F7FA', '#FFFFFF'],
  gradCard: ['#EEF2F7', '#F5F7FA'],
  gradOverlay: ['transparent', 'rgba(255,255,255,0.95)'],
  gradHero: ['transparent', 'rgba(255,255,255,0.9)', '#FFFFFF'],
  reasonJobLoss: '#EF4444',
  reasonLovedOne: '#9CA3AF',
  reasonHighRates: '#F59E0B',
  reasonExploring: '#10B981',
  transparent: 'transparent',
};

export const DARK_THEME: ThemeColors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceSecondary: '#252540',
  card: '#1E1E30',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  primary: '#3B82F6',
  primaryLight: '#1E3A5F',
  border: '#374151',
  divider: '#2D2D45',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  tabBar: '#1A1A2E',
  tabBarBorder: '#374151',
  statusBar: 'light-content',
  bg: '#0F0F1A',
  surface2: '#252540',
  surface3: '#2D2D45',
  textDisabled: '#6B7280',
  textOnPrimary: '#FFFFFF',
  accent: '#10B981',
  danger: '#EF4444',
  gold: '#F59E0B',
  gradPrimary: ['#3B82F6', '#3B82F6'],
  gradAccent: ['#10B981', '#10B981'],
  gradGold: ['#F59E0B', '#F59E0B'],
  primaryDark: '#2563EB',
  primaryAlpha: 'rgba(59, 130, 246, 0.2)',
  accentLight: '#34D399',
  accentDark: '#059669',
  accentAlpha: 'rgba(16, 185, 129, 0.2)',
  goldLight: '#FBBF24',
  goldDark: '#D97706',
  goldAlpha: 'rgba(245, 158, 11, 0.2)',
  dangerAlpha: 'rgba(239, 68, 68, 0.2)',
  warningAlpha: 'rgba(245, 158, 11, 0.2)',
  info: '#60A5FA',
  overlay: 'rgba(0,0,0,0.75)',
  overlayLight: 'rgba(0,0,0,0.4)',
  borderLight: '#4B5563',
  borderActive: '#3B82F6',
  pinAvailable: '#10B981',
  pinOccupied: '#F59E0B',
  pinContributed: '#3B82F6',
  pinCommunity: '#60A5FA',
  online: '#10B981',
  away: '#F59E0B',
  offline: '#6B7280',
  gradDark: ['#1A1A2E', '#0F0F1A'],
  gradCard: ['#252540', '#1A1A2E'],
  gradOverlay: ['transparent', 'rgba(0,0,0,0.98)'],
  gradHero: ['transparent', 'rgba(0,0,0,0.85)', '#0F0F1A'],
  reasonJobLoss: '#EF4444',
  reasonLovedOne: '#9CA3AF',
  reasonHighRates: '#F59E0B',
  reasonExploring: '#10B981',
  transparent: 'transparent',
};

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemDark, setSystemDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    safeStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        setPreferenceState(stored as ThemePreference);
      }
    });
  }, []);

  useEffect(() => {
    setSystemDark(systemScheme === 'dark');
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemDark(colorScheme === 'dark');
    });
    return () => sub.remove();
  }, [systemScheme]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    safeStorage.setItem(THEME_STORAGE_KEY, p);
  }, []);

  const isDark = preference === 'system' ? systemDark : preference === 'dark';
  const colors = isDark ? DARK_THEME : LIGHT_THEME;

  const value: ThemeContextValue = useMemo(
    () => ({ colors, isDark, preference, setPreference }),
    [colors, isDark, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function useThemePreference(): ThemeContextValue {
  return useTheme();
}

export function useThemePreferenceOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
