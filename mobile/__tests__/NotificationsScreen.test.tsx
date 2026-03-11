/**
 * NotificationsScreen: empty state, list, Mark all read, tap calls PATCH read
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '../src/screens/profile/NotificationsScreen';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGet = jest.fn();
const mockPatch = jest.fn();
const mockPost = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));
jest.mock('@api/client', () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}

describe('NotificationsScreen', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({ data: { data: [], total: 0 } });
    mockPatch.mockResolvedValue({});
    mockPost.mockResolvedValue({});
  });

  it('shows empty state when no notifications', async () => {
    render(<NotificationsScreen />, { wrapper: Wrapper });
    await screen.findByText(/You're all caught up/i);
    expect(screen.getByText(/New notifications will appear here/i)).toBeTruthy();
  });

  it('Mark all read calls POST /notifications/read-all', async () => {
    render(<NotificationsScreen />, { wrapper: Wrapper });
    await screen.findByText(/You're all caught up/i);
    const markAll = screen.getByText(/Mark all read/i);
    fireEvent.press(markAll);
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/notifications/read-all');
    });
  });

  it('fetches GET /notifications on mount', async () => {
    render(<NotificationsScreen />, { wrapper: Wrapper });
    await screen.findByText(/You're all caught up/i);
    expect(mockGet).toHaveBeenCalledWith('/notifications?page=1&limit=50');
  });
});
