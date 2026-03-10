import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { AppTextInput } from '@components/AppTextInput';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { AuthStackParams } from '@navigation/AuthNavigator';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParams>>();
  const route = useRoute<RouteProp<AuthStackParams, 'Login'>>();
  const { login, isLoading, guestLogin, bypassLogin, serverReachable } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: route.params?.prefillEmail ?? '', password: '' },
  });

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await login(data.email, data.password);
      // Navigation handled automatically by RootNavigator auth gate
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        status === 404
          ? 'Use registration instead. This backend does not support login yet.'
          : err?.response?.data?.error?.message ?? 'Login failed. Please try again.';
      setApiError(message);
      shake();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
            <Icon name="home-group" size={32} color="#fff" />
          </View>
          <Text style={[styles.logoText, { color: colors.text }]}>locus</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Your community. Your home. Your income.</Text>
        </View>

        <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
          {apiError && (
            <View style={[styles.apiError, { backgroundColor: colors.dangerAlpha, borderColor: colors.danger }]}>
              <Icon name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={[styles.apiErrorText, { color: colors.danger }]}>{apiError}</Text>
            </View>
          )}

          <View style={styles.fieldWrapper}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email address</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputRow, { borderBottomColor: colors.border, backgroundColor: colors.surface }, errors.email && { borderBottomColor: colors.danger }]}>
                  <Icon name="email-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <AppTextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textDisabled}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    returnKeyType="next"
                  />
                </View>
              )}
            />
            {errors.email && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.email.message}</Text>}
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputRow, { borderBottomColor: colors.border, backgroundColor: colors.surface }, errors.password && { borderBottomColor: colors.danger }]}>
                  <Icon name="lock-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <AppTextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textDisabled}
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.password.message}</Text>}
          </View>

          <View style={styles.forgotRow}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>
            {__DEV__ && (
              <TouchableOpacity onPress={() => navigation.navigate('NetworkCheck')} style={styles.networkCheckBtn}>
                <Text style={[styles.networkCheckText, { color: colors.textSecondary }]}>Network Check</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            activeOpacity={0.85}
            style={[styles.submitBtn, { backgroundColor: colors.primary, borderRadius: BorderRadius.button }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={[styles.registerHint, { color: colors.textSecondary }]}>New to Locus?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register', {})}>
              <Text style={[styles.registerLink, { color: colors.primary }]}> Create account</Text>
            </TouchableOpacity>
          </View>
          {__DEV__ && (
            <>
              {!serverReachable && (
                <TouchableOpacity onPress={() => bypassLogin()} style={[styles.guestRow, styles.bypassRow]}>
                  <Text style={[styles.bypassText, { color: colors.primary }]}>Bypass Login (backend unreachable)</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => guestLogin()} style={styles.guestRow}>
                <Text style={[styles.guestText, { color: colors.textSecondary }]}>Guest (Dev) – skip backend</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xxl, paddingVertical: Spacing['4xl'] },
  logoSection: { alignItems: 'center', marginBottom: Spacing['4xl'] },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  form: { gap: Spacing.lg },
  apiError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
  },
  apiErrorText: { fontSize: FontSize.sm, flex: 1 },
  fieldWrapper: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 0,
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 52,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: FontSize.base, textTransform: 'none' },
  eyeBtn: { padding: Spacing.xs },
  fieldError: { fontSize: FontSize.xs },
  forgotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.xs },
  forgotBtn: {},
  forgotText: { fontSize: FontSize.sm },
  networkCheckBtn: { paddingVertical: Spacing.xs },
  networkCheckText: { fontSize: FontSize.xs },
  submitBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  submitText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  registerHint: { fontSize: FontSize.base },
  registerLink: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  guestRow: { alignItems: 'center', marginTop: Spacing.md },
  guestText: { fontSize: FontSize.sm },
  bypassRow: { marginTop: Spacing.sm },
  bypassText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
