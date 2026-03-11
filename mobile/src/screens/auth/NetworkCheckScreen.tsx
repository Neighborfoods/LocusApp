import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { getApiBaseUrl } from '@utils/apiBaseUrl';
import { checkServerStatus } from '@api/client';
import { useAuthStore } from '@store/authStore';
import { AuthStackParams } from '@navigation/AuthNavigator';

type PingStatus = 'idle' | 'checking' | 'ok' | 'fail';

export default function NetworkCheckScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParams, 'NetworkCheck'>>();
  const bypassLogin = useAuthStore((s) => s.bypassLogin);
  const [pingStatus, setPingStatus] = useState<PingStatus>('idle');
  const [pingMessage, setPingMessage] = useState<string>('');
  const apiUrl = getApiBaseUrl();

  const runPing = useCallback(async () => {
    setPingStatus('checking');
    setPingMessage('');
    try {
      const ok = await checkServerStatus();
      setPingStatus(ok ? 'ok' : 'fail');
      setPingMessage(ok ? 'Backend is reachable.' : 'Backend did not respond.');
    } catch (e: any) {
      setPingStatus('fail');
      setPingMessage(e?.message ?? 'Request failed.');
    }
  }, []);

  const handleForceBypass = () => {
    bypassLogin();
    // RootNavigator will switch to App stack when isAuthenticated becomes true
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Icon name="arrow-left" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Network Check</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Diagnostic tool for backend connectivity
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Current API URL</Text>
        <Text style={[styles.url, { color: colors.text }]} selectable>
          {apiUrl}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Ping status</Text>
        {pingStatus === 'idle' && (
          <TouchableOpacity
            onPress={runPing}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          >
            <Icon name="web" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Check connectivity</Text>
          </TouchableOpacity>
        )}
        {pingStatus === 'checking' && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>Checking…</Text>
          </View>
        )}
        {pingStatus === 'ok' && (
          <View style={styles.statusRow}>
            <Icon name="check-circle" size={24} color={colors.success ?? '#22c55e'} />
            <Text style={[styles.statusText, { color: colors.text }]}>Reachable</Text>
            {pingMessage ? (
              <Text style={[styles.hint, { color: colors.textSecondary }]}>{pingMessage}</Text>
            ) : null}
          </View>
        )}
        {pingStatus === 'fail' && (
          <View style={styles.failBlock}>
            <View style={styles.statusRow}>
              <Icon name="close-circle" size={24} color={colors.danger} />
              <Text style={[styles.statusText, { color: colors.danger }]}>Unreachable</Text>
            </View>
            {pingMessage ? (
              <Text style={[styles.hint, { color: colors.textSecondary }]}>{pingMessage}</Text>
            ) : null}
            <TouchableOpacity onPress={runPing} style={[styles.secondaryBtn, { borderColor: colors.border }]}>
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {(pingStatus === 'fail' || pingStatus === 'idle') && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Backend down?</Text>
          <Text style={[styles.hint, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
            Use Force Bypass to enter the app and test the UI without the API.
          </Text>
          <TouchableOpacity
            onPress={handleForceBypass}
            style={[styles.bypassBtn, { borderColor: colors.danger }]}
          >
            <Icon name="account" size={20} color={colors.danger} />
            <Text style={[styles.bypassBtnText, { color: colors.danger }]}>Force Bypass</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.footer, { color: colors.textDisabled }]}>
        Backend: http://129.146.186.180 (Oracle Cloud Node + Nginx).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.xxl, paddingBottom: Spacing['4xl'] },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  section: { marginBottom: Spacing.xl },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.sm, marginTop: 4 },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.sm },
  url: { fontSize: FontSize.sm, fontFamily: 'monospace' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
  },
  primaryBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusText: { fontSize: FontSize.md },
  hint: { fontSize: FontSize.sm, marginTop: Spacing.sm },
  failBlock: { gap: Spacing.sm },
  secondaryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.button,
    marginTop: Spacing.sm,
  },
  secondaryBtnText: { fontSize: FontSize.sm },
  bypassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.button,
  },
  bypassBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  footer: { fontSize: FontSize.xs, marginTop: Spacing.lg },
});
