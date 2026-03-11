/**
 * ThemeSystem: preference light/dark/system, setPreference, colors, AsyncStorage
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider, useTheme, LIGHT_THEME, DARK_THEME } from '../src/theme/ThemeContext';

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

function ThemeConsumer() {
  const { colors, isDark, preference, setPreference } = useTheme();
  return (
    <>
      <text testID="isDark">{String(isDark)}</text>
      <text testID="pref">{preference}</text>
      <text testID="bg">{colors.background}</text>
      <text testID="primary">{colors.primary}</text>
      <button testID="setLight" title="Light" onPress={() => setPreference('light')} />
      <button testID="setDark" title="Dark" onPress={() => setPreference('dark')} />
      <button testID="setSystem" title="System" onPress={() => setPreference('system')} />
    </>
  );
}

describe('ThemeSystem', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockClear();
  });

  it('default preference is system', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('pref').props.children).toBe('system');
  });

  it('preference "light" yields LIGHT theme colors', async () => {
    AsyncStorage.getItem.mockResolvedValue('light');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('pref').props.children).toBe('light');
    });
    expect(screen.getByTestId('bg').props.children).toBe(LIGHT_THEME.background);
    expect(screen.getByTestId('primary').props.children).toBe(LIGHT_THEME.primary);
  });

  it('preference "dark" yields DARK theme colors', async () => {
    AsyncStorage.getItem.mockResolvedValue('dark');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('pref').props.children).toBe('dark');
    });
    expect(screen.getByTestId('bg').props.children).toBe(DARK_THEME.background);
    expect(screen.getByTestId('primary').props.children).toBe(DARK_THEME.primary);
    expect(screen.getByTestId('isDark').props.children).toBe('true');
  });

  it('setPreference updates preference and saves to AsyncStorage', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    fireEvent.press(screen.getByTestId('setLight'));
    expect(screen.getByTestId('pref').props.children).toBe('light');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme_preference', 'light');
  });
});
