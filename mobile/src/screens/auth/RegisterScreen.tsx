import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { AuthStackParams } from '@navigation/AuthNavigator';
import { HOUSING_REASON_LABELS } from '@utils/formatters';

// ── Schema ────────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  first_name: z.string().min(2, 'Too short'),
  last_name: z.string().min(2, 'Too short'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number').optional().or(z.literal('')),
});

const step2Schema = z.object({
  password: z.string().min(8, 'Min 8 characters').regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs number'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

const HOUSING_REASONS = [
  { value: 'job_loss', icon: 'briefcase-remove', description: 'Lost my job or income' },
  { value: 'loss_of_loved_one', icon: 'heart-broken', description: 'Lost someone close to me' },
  { value: 'high_mortgage_rates', icon: 'trending-up', description: 'Mortgage rates became unaffordable' },
  { value: 'divorce', icon: 'account-multiple-remove', description: 'Going through a divorce' },
  { value: 'exploring', icon: 'compass', description: "I'm just exploring the concept" },
] as const;

function StepIndicator({
  current,
  total,
  colors,
}: {
  current: number;
  total: number;
  colors: ReturnType<typeof import('@theme/colors').getColors>;
}) {
  const si = createStepIndicatorStyles(colors);
  return (
    <View style={si.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={si.row}>
          <View style={[si.circle, i <= current - 1 && si.circleActive]}>
            {i < current - 1 ? (
              <Icon name="check" size={12} color="#fff" />
            ) : (
              <Text style={[si.num, i === current - 1 && si.numActive]}>{i + 1}</Text>
            )}
          </View>
          {i < total - 1 && <View style={[si.line, i < current - 1 && si.lineActive]} />}
        </View>
      ))}
    </View>
  );
}

const createStepIndicatorStyles = (colors: ReturnType<typeof import('@theme/colors').getColors>) =>
  StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.xl },
    row: { flexDirection: 'row', alignItems: 'center' },
    circle: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    circleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    num: { fontSize: 12, color: colors.textSecondary, fontWeight: FontWeight.semibold },
    numActive: { color: '#fff' },
    line: { width: 40, height: 1.5, backgroundColor: colors.border, marginHorizontal: 4 },
    lineActive: { backgroundColor: colors.primary },
  });

function Field({
  label,
  error,
  colors,
  ...props
}: { label: string; error?: string; colors: ReturnType<typeof import('@theme/colors').getColors> } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.inputBase,
          { backgroundColor: colors.surface, borderBottomColor: colors.border, color: colors.text },
          error && { borderBottomColor: colors.danger },
        ]}
        placeholderTextColor={colors.textDisabled}
        {...props}
      />
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParams>>();
  const { register: authRegister, forceTransitionToApp, guestLogin } = useAuthStore();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [housingReason, setHousingReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userExistsEmail, setUserExistsEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showForceSkip, setShowForceSkip] = useState(false);
  const forceSkipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorAnim = useRef(new Animated.Value(0)).current;
  const FORCE_SKIP_THRESHOLD_MS = 10_000;

  const step1Form = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const step2Form = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(errorAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(errorAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(errorAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleStep1 = step1Form.handleSubmit((data) => {
    setStep1Data(data);
    setStep(2);
  });

  const handleStep2 = () => {
    if (!housingReason) {
      setError('Please tell us why you joined Locus');
      shakeError();
      return;
    }
    setStep(3);
  };

  const isSubmittingRef = useRef(false);

  const handleStep3 = step2Form.handleSubmit(async (data) => {
    if (!step1Data || !housingReason) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setShowForceSkip(false);
    if (forceSkipTimerRef.current) clearTimeout(forceSkipTimerRef.current);
    forceSkipTimerRef.current = setTimeout(() => setShowForceSkip(true), FORCE_SKIP_THRESHOLD_MS);
    setError(null);
    setUserExistsEmail(null);
    try {
      await authRegister({
        ...step1Data,
        password: data.password,
        housing_reason: housingReason,
        background_check_consent: true,
      });
      // Success: tokens saved, isAuthenticated set in authStore. RootNavigator
      // switches from AuthStack to AppStack (Map/Home); do not call goBack().
    } catch (e: any) {
      const isUserExists = e?.isUserExists === true;
      const msg = e?.response?.data?.error?.message ?? e?.message ?? 'Registration failed';
      setError(msg);
      setUserExistsEmail(isUserExists ? (e?.prefillEmail ?? step1Data?.email ?? null) : null);
      shakeError();
      if (isUserExists && (e?.prefillEmail ?? step1Data?.email)) {
        navigation.navigate('Login', { prefillEmail: e?.prefillEmail ?? step1Data?.email ?? undefined });
      }
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
      if (forceSkipTimerRef.current) {
        clearTimeout(forceSkipTimerRef.current);
        forceSkipTimerRef.current = null;
      }
      setShowForceSkip(false);
    }
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Pressable
              onLongPress={() => __DEV__ && forceTransitionToApp()}
              delayLongPress={600}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.title, { color: colors.text }]}>Join Locus</Text>
            </Pressable>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create your account</Text>
          </View>
        </View>

        <StepIndicator current={step} total={3} colors={colors} />

        {/* Error banner */}
        {error && (
          <Animated.View style={[styles.errorBanner, { backgroundColor: colors.dangerAlpha, borderColor: colors.danger, transform: [{ translateX: errorAnim }] }]}>
            <Icon name="alert-circle" size={16} color={colors.danger} style={styles.errorBannerIcon} />
            <View style={styles.errorBannerContent}>
              <Text style={[styles.errorBannerText, { color: colors.danger }]}>{error}</Text>
              {userExistsEmail ? (
                <TouchableOpacity onPress={() => navigation.navigate('Login', { prefillEmail: userExistsEmail })} style={styles.loginInsteadBtn}>
                  <Text style={[styles.loginInsteadText, { color: colors.primary }]}>Log in instead</Text>
                </TouchableOpacity>
              ) : null}
              {__DEV__ && (
                <TouchableOpacity onPress={() => guestLogin()} style={styles.loginInsteadBtn}>
                  <Text style={[styles.loginInsteadText, { color: colors.primary }]}>Continue as Guest (Dev)</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* ── Step 1: Personal Info ── */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepLabel, { color: colors.text }]}>Let's start with the basics</Text>
            <View style={styles.form}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Controller control={step1Form.control} name="first_name" render={({ field }) => (
                    <Field colors={colors} label="First name" value={field.value} onChangeText={field.onChange} error={step1Form.formState.errors.first_name?.message} placeholder="John" autoCapitalize="words" />
                  )} />
                </View>
                <View style={{ flex: 1 }}>
                  <Controller control={step1Form.control} name="last_name" render={({ field }) => (
                    <Field colors={colors} label="Last name" value={field.value} onChangeText={field.onChange} error={step1Form.formState.errors.last_name?.message} placeholder="Doe" autoCapitalize="words" />
                  )} />
                </View>
              </View>

              <Controller control={step1Form.control} name="email" render={({ field }) => (
                <Field colors={colors} label="Email" value={field.value} onChangeText={field.onChange} error={step1Form.formState.errors.email?.message} placeholder="john@example.com" keyboardType="email-address" autoCapitalize="none" />
              )} />

              <Controller control={step1Form.control} name="phone" render={({ field }) => (
                <Field colors={colors} label="Phone (optional)" value={field.value ?? ''} onChangeText={field.onChange} error={step1Form.formState.errors.phone?.message} placeholder="+1 555 000 0000" keyboardType="phone-pad" />
              )} />
            </View>

            <TouchableOpacity onPress={handleStep1} style={[styles.nextBtn, { backgroundColor: colors.primary, borderRadius: BorderRadius.button }]}>
              <Text style={styles.nextBtnText}>Continue</Text>
              <Icon name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Housing Reason ── */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepLabel, { color: colors.text }]}>What brought you to Locus?</Text>
            <Text style={[styles.stepHint, { color: colors.textSecondary }]}>This is confidential and helps us tailor your experience.</Text>

            <View style={styles.reasonsGrid}>
              {HOUSING_REASONS.map((reason) => {
                const selected = housingReason === reason.value;
                return (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      selected && { borderColor: colors.primary, backgroundColor: colors.primaryAlpha },
                    ]}
                    onPress={() => setHousingReason(reason.value)}
                    activeOpacity={0.7}
                  >
                    <Icon name={reason.icon} size={28} color={selected ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.reasonText, { color: colors.textSecondary }, selected && { color: colors.text }]}>{reason.description}</Text>
                    {selected && (
                      <View style={styles.reasonCheck}>
                        <Icon name="check-circle" size={18} color={colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={handleStep2} style={[styles.nextBtn, { backgroundColor: colors.primary, borderRadius: BorderRadius.button }]}>
              <Text style={styles.nextBtnText}>Continue</Text>
              <Icon name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 3: Password + Consent ── */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepLabel, { color: colors.text }]}>Secure your account</Text>
            <View style={styles.form}>
              <Controller control={step2Form.control} name="password" render={({ field }) => (
                <View style={{ gap: 6 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
                  <View style={styles.pwRow}>
                    <TextInput
                      style={[
                        styles.inputBase,
                        styles.pwInput,
                        { backgroundColor: colors.surface, borderBottomColor: colors.border, color: colors.text },
                        step2Form.formState.errors.password && { borderBottomColor: colors.danger },
                      ]}
                      value={field.value}
                      onChangeText={field.onChange}
                      secureTextEntry={!showPw}
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      placeholderTextColor={colors.textDisabled}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity style={styles.pwToggle} onPress={() => setShowPw(p => !p)}>
                      <Icon name={showPw ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {step2Form.formState.errors.password && <Text style={[styles.errorText, { color: colors.danger }]}>{step2Form.formState.errors.password.message}</Text>}
                </View>
              )} />

              <Controller control={step2Form.control} name="confirm_password" render={({ field }) => (
                <Field colors={colors} label="Confirm password" value={field.value} onChangeText={field.onChange} error={step2Form.formState.errors.confirm_password?.message} secureTextEntry={!showPw} placeholder="Repeat password" autoCapitalize="none" />
              )} />
            </View>

            <View style={[styles.consentBox, { backgroundColor: colors.accentAlpha, borderColor: colors.accent + '50' }]}>
              <Icon name="shield-check" size={20} color={colors.accent} />
              <Text style={[styles.consentText, { color: colors.textSecondary }]}>
                By continuing, you agree to our Terms of Service and Privacy Policy. A background check consent will be required before joining any community.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleStep3}
              style={[styles.nextBtn, { backgroundColor: colors.primary, borderRadius: BorderRadius.button }, loading && styles.nextBtnDisabled]}
              disabled={loading}
              activeOpacity={loading ? 1 : 0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>Create Account</Text>
                  <Icon name="check-circle" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
            {(showForceSkip || (__DEV__ && step === 3)) && (
              <TouchableOpacity
                onPress={() => forceTransitionToApp()}
                style={[styles.forceSkipBtn, { borderColor: colors.danger }]}
              >
                <Text style={[styles.forceSkipText, { color: colors.danger }]}>Force Skip to App (debug)</Text>
              </TouchableOpacity>
            )}
            {__DEV__ && (
              <TouchableOpacity
                onPress={() => forceTransitionToApp()}
                style={[styles.forceSkipBtn, styles.skipToMapBtn, { borderColor: colors.primary }]}
              >
                <Text style={[styles.forceSkipText, { color: colors.primary }]}>Skip to Map (Dev Only)</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.signInRow}>
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>
            Already a member?{' '}
            <Text style={{ color: colors.primary, fontWeight: FontWeight.semibold }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
        {__DEV__ && (
          <TouchableOpacity onPress={() => guestLogin()} style={styles.guestRow}>
            <Text style={[styles.guestText, { color: colors.textSecondary }]}>Guest (Dev) – skip backend</Text>
          </TouchableOpacity>
        )}
        {__DEV__ && (
          <TouchableOpacity
            onPress={() => forceTransitionToApp()}
            style={[styles.skipToMapBtnStandalone, { borderColor: colors.primary }]}
          >
            <Text style={[styles.forceSkipText, { color: colors.primary }]}>Skip to Map (Dev Only)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xxl, paddingTop: Spacing['4xl'], paddingBottom: Spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.sm, marginTop: 2 },
  stepContainer: { paddingHorizontal: Spacing.xxl, gap: Spacing.xl },
  stepLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  stepHint: { fontSize: FontSize.sm, marginTop: -Spacing.md },
  form: { gap: Spacing.lg },
  row: { flexDirection: 'row', gap: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  inputBase: {
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
  },
  errorText: { fontSize: FontSize.xs, marginTop: 2 },
  errorBanner: {
    marginHorizontal: Spacing.xxl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorBannerIcon: { marginTop: 2 },
  errorBannerContent: { flex: 1 },
  errorBannerText: { fontSize: FontSize.sm },
  loginInsteadBtn: { marginTop: Spacing.sm },
  loginInsteadText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  forceSkipBtn: { marginTop: Spacing.lg, paddingVertical: Spacing.md, borderWidth: 1, borderRadius: BorderRadius.md, alignItems: 'center' },
  forceSkipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  skipToMapBtn: { marginTop: Spacing.sm },
  skipToMapBtnStandalone: { marginTop: Spacing.lg, paddingVertical: Spacing.md, borderWidth: 1, borderRadius: BorderRadius.md, alignItems: 'center', marginHorizontal: Spacing.xxl },
  guestRow: { alignItems: 'center', paddingTop: Spacing.md },
  guestText: { fontSize: FontSize.sm },
  pwRow: { position: 'relative' },
  pwInput: { paddingRight: 50 },
  pwToggle: { position: 'absolute', right: Spacing.lg, top: '50%', transform: [{ translateY: -10 }] },
  reasonsGrid: { gap: Spacing.md },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    position: 'relative',
  },
  reasonText: { fontSize: FontSize.sm, flex: 1 },
  reasonCheck: { position: 'absolute', top: Spacing.md, right: Spacing.md },
  consentBox: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  consentText: { fontSize: FontSize.xs, flex: 1, lineHeight: 18 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  nextBtnDisabled: { opacity: 0.8 },
  nextBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  signInRow: { alignItems: 'center', paddingTop: Spacing.xl },
  signInText: { fontSize: FontSize.sm },
});
