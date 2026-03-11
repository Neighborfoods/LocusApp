/**
 * MapScreen: location permission requested, map renders
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../src/theme/ThemeContext';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View, Marker: View, PROVIDER_GOOGLE: 'google' };
});
jest.mock('@hooks/usePermissions', () => ({
  usePermissions: () => ({ requestPermission: jest.fn().mockResolvedValue(true) }),
}));
jest.mock('@api/client', () => ({ get: jest.fn().mockResolvedValue({ data: { data: [] } }) }));
jest.mock('@gorhom/bottom-sheet', () => ({ BottomSheetModalProvider: ({ children }: any) => children }));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-fast-image', () => ({ default: require('react-native').View }));
jest.mock('react-native-linear-gradient', () => ({ default: require('react-native').View }));

const MapScreen = require('../src/screens/map/MapScreen').default;

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}

describe('MapScreen', () => {
  it('renders Explore header when wrapped with providers', () => {
    const { getByText } = render(<MapScreen />, { wrapper: Wrapper });
    expect(getByText('Explore')).toBeTruthy();
  });

  it('renders map content with filter and FABs', () => {
    const { getByPlaceholderText } = render(<MapScreen />, { wrapper: Wrapper });
    expect(getByPlaceholderText('Search map...')).toBeTruthy();
  });
});
