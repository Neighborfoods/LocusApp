import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from '@store/authStore';
import { useTheme } from '@theme/useTheme';
import { FontSize, FontWeight } from '@theme/index';
import { AuthStackParams } from '@navigation/AuthNavigator';

export default function SplashScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParams>>();
  const { isAuthenticated, isInitialized } = useAuthStore();

  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(dotOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);
    animationRef.current = sequence;
    sequence.start();
    return () => {
      animationRef.current?.stop();
      animationRef.current = null;
    };
  }, [scale, opacity, dotOpacity]);

  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // RootNavigator already renders AppNavigator; no action needed
      } else {
        navigation.replace('Onboarding');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [isInitialized, isAuthenticated, navigation]);

  const onLogoLongPress = () => {
    if (__DEV__) {
      useAuthStore.getState().guestLogin();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Pressable onLongPress={onLogoLongPress} delayLongPress={800} style={styles.logoPressable}>
        <Animated.View style={[styles.logoBox, { transform: [{ scale }], opacity, backgroundColor: colors.primary, shadowColor: colors.primary }]}>
          <LinearGradient
            colors={[...colors.gradPrimary]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoLetter}>L</Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>

      <Animated.View style={{ opacity }}>
        <Text style={[styles.appName, { color: colors.text }]}>
          LOCUS
          <Animated.Text style={[styles.dot, { opacity: dotOpacity, color: colors.primary }]}>.</Animated.Text>
        </Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>Your community. Your home.</Text>
      </Animated.View>

      <View style={styles.glowContainer}>
        <LinearGradient
          colors={[colors.primaryAlpha, 'transparent']}
          style={styles.glow}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logoPressable: { alignItems: 'center', justifyContent: 'center' },
  logoBox: {
    width: 90,
    height: 90,
    borderRadius: 28,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  logoGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
  },
  appName: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    letterSpacing: 8,
  },
  dot: {
    fontSize: 32,
  },
  tagline: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  glowContainer: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
});
