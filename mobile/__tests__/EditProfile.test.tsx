/**
 * EditProfile: GET /users/me on mount, fields render, Save calls PUT /users/profile
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import EditProfileScreen from '../src/screens/profile/EditProfileScreen';
import { ThemeProvider } from '../src/theme/ThemeContext';

const mockGet = jest.fn();
const mockPut = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));
jest.mock('@api/client', () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

beforeEach(() => {
  mockGet.mockResolvedValue({
    data: {
      data: {
        id: '1',
        email: 'u@test.com',
        name: 'Jane Doe',
        phone: '+15551234567',
        bio: 'Hello',
        avatar_url: null,
        created_at: '2025-01-01',
      },
    },
  });
  mockPut.mockResolvedValue({ data: { success: true } });
});

describe('EditProfileScreen', () => {
  it('loads GET /users/me on mount', async () => {
    render(
      <ThemeProvider>
        <EditProfileScreen />
      </ThemeProvider>
    );
    await screen.findByText('u@test.com', {}, { timeout: 2000 });
    expect(mockGet).toHaveBeenCalledWith('/users/me');
  });

  it('renders all fields', async () => {
    render(
      <ThemeProvider>
        <EditProfileScreen />
      </ThemeProvider>
    );
    await screen.findByText('u@test.com', {}, { timeout: 2000 });
    expect(screen.getByDisplayValue('Jane')).toBeTruthy();
    expect(screen.getByDisplayValue('Doe')).toBeTruthy();
    expect(screen.getByDisplayValue('+15551234567')).toBeTruthy();
    expect(screen.getByDisplayValue('Hello')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('Save calls PUT /users/profile with name, phone, bio', async () => {
    render(
      <ThemeProvider>
        <EditProfileScreen />
      </ThemeProvider>
    );
    await screen.findByText('u@test.com', {}, { timeout: 2000 });
    fireEvent.press(screen.getByText('Save'));
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        '/users/profile',
        expect.objectContaining({
          name: 'Jane Doe',
          phone: '+15551234567',
          bio: 'Hello',
        })
      );
    });
  });
});
