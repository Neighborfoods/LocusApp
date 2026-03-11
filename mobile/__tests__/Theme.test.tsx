/**
 * Theme: ThemeProvider and useThemePreference
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider, useThemePreference } from '../src/theme/ThemeContext';

function PreferenceConsumer() {
  const { preference } = useThemePreference();
  return <text testID="pref">{preference}</text>;
}

describe('Theme', () => {
  it('useThemePreference returns preference inside ThemeProvider', () => {
    render(
      <ThemeProvider>
        <PreferenceConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('pref').props.children).toBe('system');
  });
});
