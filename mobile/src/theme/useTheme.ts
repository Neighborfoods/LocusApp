import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getColors, type ColorPalette } from './colors';

export function useTheme(): { colors: ColorPalette; isDark: boolean } {
  const scheme = useColorScheme();
  return useMemo(() => {
    const isDark = scheme === 'dark';
    const colors = getColors(scheme ?? 'light');
    return { colors, isDark };
  }, [scheme]);
}
