/**
 * AddProperty: form validation, submit calls POST /properties
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AddPropertyScreen from '../src/screens/property/AddPropertyScreen';
import { ThemeProvider } from '../src/theme/ThemeContext';

const mockPost = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
}));
jest.mock('@api/client', () => ({
  __esModule: true,
  default: { post: (...args: unknown[]) => mockPost(...args) },
}));

beforeEach(() => {
  mockPost.mockResolvedValue({ data: { success: true, data: { id: '1' } } });
});

describe('AddPropertyScreen', () => {
  it('renders Add Property form with all fields', () => {
    render(
      <ThemeProvider>
        <AddPropertyScreen />
      </ThemeProvider>
    );
    expect(screen.getByText('Add Property')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. Cozy 2BR near downtown')).toBeTruthy();
    expect(screen.getByText('House')).toBeTruthy();
    expect(screen.getByText('Submit')).toBeTruthy();
  });

  it('shows error when submitting without title', () => {
    render(
      <ThemeProvider>
        <AddPropertyScreen />
      </ThemeProvider>
    );
    fireEvent.press(screen.getByText('Submit'));
    expect(screen.getByText('Property title is required')).toBeTruthy();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('calls POST /properties when title is filled', async () => {
    render(
      <ThemeProvider>
        <AddPropertyScreen />
      </ThemeProvider>
    );
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Cozy 2BR near downtown'), 'Cozy 2BR');
    fireEvent.press(screen.getByText('Submit'));
    expect(mockPost).toHaveBeenCalledWith(
      '/properties',
      expect.objectContaining({ title: 'Cozy 2BR' })
    );
  });
});
