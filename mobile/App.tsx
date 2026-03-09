import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';
import { checkServerStatus } from './src/api/client';
import { useAuthStore } from './src/store/authStore';

/** Catches render errors so we see which component crashed (check Metro/JS logs). */
class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('APP ERROR BOUNDARY:', error?.message, error?.stack, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.errorSubtext}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const setServerReachable = useAuthStore((s) => s.setServerReachable);

  useEffect(() => {
    checkServerStatus().then((ok) => {
      setServerReachable(ok);
      if (!ok && __DEV__) {
        console.warn('[APP] Backend unreachable – Dev-Override "Bypass Login" will appear on login screen.');
      }
    });
  }, [setServerReachable]);

  return <RootNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppErrorBoundary>
        <AppContent />
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#08080F',
    padding: 24,
  },
  errorText: { color: '#F0F0FF', fontSize: 18, marginBottom: 8 },
  errorSubtext: { color: '#9898C0', fontSize: 14 },
});
