import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { AppTextInput } from '@components/AppTextInput';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import api from '@api/client';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.includes('@')) { setError('Enter a valid email'); return; }
    setLoading(true); setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
            <Icon name="lock-reset" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Reset password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {sent
              ? "Check your inbox. We've sent a reset link to your email."
              : "Enter your email and we'll send you a link to reset your password."}
          </Text>

          {!sent && (
            <>
              {error && (
                <View style={[styles.errorBanner, { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}40` }]}>
                  <Icon name="alert-circle" size={14} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              )}
              <AppTextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textDisabled}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
              <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.btn}>
                <LinearGradient colors={[...colors.gradPrimary]} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {sent && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btn}>
              <LinearGradient colors={[...colors.gradPrimary]} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.btnText}>Back to Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { marginTop: Spacing['4xl'], marginLeft: Spacing.xxl, width: 40, height: 40, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.xxl, justifyContent: 'center', gap: Spacing.xl, marginTop: -80 },
  iconBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', borderWidth: 1 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, textAlign: 'center' },
  subtitle: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },
  errorBanner: { flexDirection: 'row', gap: 6, alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md },
  errorText: { fontSize: FontSize.sm },
  input: { borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.md, textTransform: 'none' },
  btn: { overflow: 'hidden', borderRadius: BorderRadius.lg },
  btnGrad: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.lg },
  btnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
