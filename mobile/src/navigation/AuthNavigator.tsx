import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@theme/useTheme';

// Screens
import SplashScreen from '@screens/auth/SplashScreen';
import OnboardingScreen from '@screens/auth/OnboardingScreen';
import LoginScreen from '@screens/auth/LoginScreen';
import RegisterScreen from '@screens/auth/RegisterScreen';
import ForgotPasswordScreen from '@screens/auth/ForgotPasswordScreen';
import NetworkCheckScreen from '@screens/auth/NetworkCheckScreen';

export type AuthStackParams = {
  Splash: undefined;
  Onboarding: undefined;
  Login: { prefillEmail?: string };
  Register: { prefillEmail?: string };
  ForgotPassword: undefined;
  NetworkCheck: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParams>();

export default function AuthNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="NetworkCheck"
        component={NetworkCheckScreen}
        options={{ title: 'Network Check', animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
