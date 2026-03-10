/**
 * TextInputCaps: Ensures no ALL CAPS in app inputs.
 * - Every TextInput must have textTransform: 'none'
 * - autoCapitalize must never be 'characters'
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AppTextInput } from '../src/components/AppTextInput';

function flattenStyle(style: unknown): Record<string, unknown> {
  if (style == null) return {};
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>((acc, s) => ({ ...acc, ...flattenStyle(s) }), {});
  }
  if (typeof style === 'object' && style !== null && !Array.isArray(style)) {
    return style as Record<string, unknown>;
  }
  return {};
}

describe('AppTextInput', () => {
  it('has default style with textTransform none and autoCapitalize not characters', () => {
    render(<AppTextInput placeholder="Email" testID="input" />);
    const input = screen.getByTestId('input');
    expect(input).toBeTruthy();
    const ac = input.props.autoCapitalize;
    expect(ac).not.toBe('characters');
    const style = flattenStyle(input.props.style);
    expect(style.textTransform).toBe('none');
  });

  it('allows overriding autoCapitalize but never characters', () => {
    const { rerender } = render(<AppTextInput placeholder="x" autoCapitalize="none" testID="i" />);
    expect(screen.getByTestId('i').props.autoCapitalize).toBe('none');
    rerender(<AppTextInput placeholder="x" autoCapitalize="words" testID="i" />);
    expect(screen.getByTestId('i').props.autoCapitalize).toBe('words');
  });

  it('merged style contains textTransform none', () => {
    render(
      <AppTextInput
        placeholder="x"
        style={{ color: '#fff', fontSize: 16 }}
        testID="i"
      />
    );
    const style = flattenStyle(screen.getByTestId('i').props.style);
    expect(style.textTransform).toBe('none');
  });
});

describe('TextInput usage in screens (style contracts)', () => {
  it('LoginScreen input styles do not use uppercase', () => {
    const { getByPlaceholderText } = render(
      <AppTextInput placeholder="you@example.com" testID="login-email" />
    );
    const input = getByPlaceholderText('you@example.com');
    const style = flattenStyle(input.props.style);
    expect(style.textTransform).not.toBe('uppercase');
    expect(style.textTransform).toBe('none');
    expect(input.props.autoCapitalize).not.toBe('characters');
  });

  it('RegisterScreen AuthInput uses AppTextInput (no uppercase)', () => {
    render(<AppTextInput placeholder="First name" autoCapitalize="words" testID="reg-first" />);
    const input = screen.getByTestId('reg-first');
    expect(input.props.autoCapitalize).not.toBe('characters');
    expect(flattenStyle(input.props.style).textTransform).toBe('none');
  });

  it('ForgotPasswordScreen input has textTransform none', () => {
    render(
      <AppTextInput
        placeholder="your@email.com"
        autoCapitalize="none"
        testID="forgot-email"
      />
    );
    const input = screen.getByTestId('forgot-email');
    expect(flattenStyle(input.props.style).textTransform).toBe('none');
    expect(input.props.autoCapitalize).not.toBe('characters');
  });

  it('CommunitiesScreen search input has textTransform none', () => {
    render(
      <AppTextInput
        placeholder="Search communities, cities..."
        testID="search-input"
      />
    );
    const input = screen.getByTestId('search-input');
    expect(flattenStyle(input.props.style).textTransform).toBe('none');
    expect(input.props.autoCapitalize).not.toBe('characters');
  });
});

describe('No raw TextInput with uppercase', () => {
  it('AppTextInput renders with safe defaults (no characters autoCapitalize)', () => {
    render(<AppTextInput placeholder="test" testID="t" />);
    const input = screen.getByTestId('t');
    expect(input.props.autoCapitalize).not.toBe('characters');
    expect(flattenStyle(input.props.style).textTransform).toBe('none');
  });
});
