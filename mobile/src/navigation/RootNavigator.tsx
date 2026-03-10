import {
    CommonActions,
    NavigationContainer,
    createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "@store/authStore";
import { useTheme } from "@theme/useTheme";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import AppNavigator from "./AppNavigator";
import AuthNavigator from "./AuthNavigator";

const Stack = createNativeStackNavigator();

const navigationRef = createNavigationContainerRef();

export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isInitialized, isLoading, loadUser } =
    useAuthStore();
  const hasLoggedLoadUser = useRef(false);

  useEffect(() => {
    console.log(
      "[NAV_TRACE] Current State: isAuthenticated=",
      isAuthenticated,
      "isInitialized=",
      isInitialized,
      "isLoading=",
      isLoading,
    );
  }, [isAuthenticated, isInitialized, isLoading]);

  useEffect(() => {
    loadUser().then(() => {
      const state = useAuthStore.getState();
      if (!hasLoggedLoadUser.current) {
        hasLoggedLoadUser.current = true;
        console.log("[RootNavigator] loadUser done", {
          isAuthenticated: state.isAuthenticated,
          isInitialized: state.isInitialized,
          hasUser: !!state.user,
        });
      }
    });
  }, [loadUser]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const frameId = requestAnimationFrame(() => {
      if (!navigationRef.isReady()) return;
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Tabs" as never }],
        }),
      );
    });
    return () => cancelAnimationFrame(frameId);
  }, [isAuthenticated]);

  if (!isInitialized || isLoading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      key={isAuthenticated ? "app" : "auth"}
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.bg,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.danger,
        },
      }}
    >
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
