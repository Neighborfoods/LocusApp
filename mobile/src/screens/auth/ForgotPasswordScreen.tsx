import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { AppTextInput } from '@components/AppTextInput';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import api from '@api/client';

export default function ForgotPasswordScreen() {
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
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconBox}>
            <Icon name="lock-reset" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            {sent
              ? "Check your inbox. We've sent a reset link to your email."
              : "Enter your email and we'll send you a link to reset your password."}
          </Text>

          {!sent && (
            <>
              {error && (
                <View style={styles.errorBanner}>
                  <Icon name="alert-circle" size={14} color={Colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              <AppTextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
              <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.btn}>
                <LinearGradient colors={Colors.gradPrimary} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {sent && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btn}>
              <LinearGradient colors={Colors.gradPrimary} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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
  container: { flex: 1, backgroundColor: Colors.bg },
  backBtn: { marginTop: Spacing['4xl'], marginLeft: Spacing.xxl, width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  content: { flex: 1, paddingHorizontal: Spacing.xxl, justifyContent: 'center', gap: Spacing.xl, marginTop: -80 },
  iconBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: `${Colors.primary}15`, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', borderWidth: 1, borderColor: `${Colors.primary}30` },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  errorBanner: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: `${Colors.danger}15`, borderWidth: 1, borderColor: `${Colors.danger}40`, borderRadius: BorderRadius.md, padding: Spacing.md },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, color: Colors.text, fontSize: FontSize.md, textTransform: 'none' },
  btn: { overflow: 'hidden', borderRadius: BorderRadius.lg },
  btnGrad: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.lg },
  btnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
