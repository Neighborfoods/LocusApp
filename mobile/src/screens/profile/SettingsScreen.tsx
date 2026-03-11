import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Vibration,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { AppTextInput } from '@components/AppTextInput';
import api from '@api/client';
import { AppStackParams } from '@navigation/AppNavigator';
import type { ThemePreference } from '@theme/ThemeContext';
import { BiometricService, type BiometricCapability } from '../../services/BiometricService';

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams, 'Settings'>>();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const cap = await BiometricService.getCapability();
      setBiometricCapability(cap);
      if (cap.available) {
        setBiometricEnabled(await BiometricService.isEnabled());
      }
    })();
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const result = await BiometricService.authenticate('Verify to enable biometric login');
      if (!result.success) return;
    }
    await BiometricService.setEnabled(value);
    setBiometricEnabled(value);
    Vibration.vibrate(10);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields required');
      Vibration.vibrate(10);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      Vibration.vibrate(10);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      Vibration.vibrate(10);
      return;
    }
    setPasswordError(null);
    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Your password has been updated.');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err && (err as any).response?.data?.error;
      setPasswordError(msg || 'Failed to change password');
      Vibration.vibrate(10);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const preferences: ThemePreference[] = ['light', 'dark', 'system'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.segmentedRow, { backgroundColor: colors.surface }]}>
          {preferences.map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.segment,
                preference === p && { backgroundColor: colors.primary },
              ]}
              onPress={() => { Vibration.vibrate(10); setPreference(p); }}
            >
              <Text style={[styles.segmentText, { color: preference === p ? colors.textOnPrimary : colors.text }]}>
                {p === 'system' ? 'System' : p === 'light' ? 'Light' : 'Dark'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.xl }]}>SECURITY</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {biometricCapability?.available && (
            <View style={[styles.menuRow, styles.settingRow]}>
              <View style={styles.settingLeft}>
                <Icon name={biometricCapability.iconName as any} size={22} color={colors.primary} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>{biometricCapability.label}</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="white"
              />
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.xl }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.menuRow} onPress={() => setPasswordModalVisible(true)}>
            <Icon name="lock-outline" size={22} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>Change Password</Text>
            <Icon name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuRow, styles.menuRowBorder, { borderBottomColor: colors.divider }]}>
            <Icon name="shield-check-outline" size={22} color={colors.textTertiary} />
            <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Two-Factor Auth</Text>
            <Text style={[styles.comingSoon, { color: colors.textTertiary }]}>Coming Soon</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.xl }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.menuRow}>
            <Text style={[styles.menuLabel, { color: colors.text }]}>Version</Text>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>1.0.1 (Build 3)</Text>
          </View>
          <TouchableOpacity style={[styles.menuRow, styles.menuRowBorder, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.menuLabel, { color: colors.text }]}>Terms of Service</Text>
            <Icon name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuRow, styles.menuRowBorder, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.menuLabel, { color: colors.text }]}>Privacy Policy</Text>
            <Icon name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow}>
            <Text style={[styles.menuLabel, { color: colors.text }]}>Rate Locus</Text>
            <Icon name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.error, marginTop: Spacing.xl }]}>DANGER ZONE</Text>
        <TouchableOpacity style={[styles.dangerBtn, { borderColor: colors.error }]} onPress={handleDeleteAccount}>
          <Icon name="alert-circle" size={22} color={colors.error} />
          <Text style={[styles.dangerBtnText, { color: colors.error }]}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={passwordModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
            {passwordError && (
              <Text style={[styles.modalError, { color: colors.error }]}>{passwordError}</Text>
            )}
            <AppTextInput
              placeholder="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholderTextColor={colors.textSecondary}
            />
            <AppTextInput
              placeholder="New password (min 8)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholderTextColor={colors.textSecondary}
            />
            <AppTextInput
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setPasswordModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.primary }]} onPress={handleChangePassword} disabled={passwordLoading}>
                {passwordLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnTextPrimary}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xxl, paddingBottom: 100 },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  segmentedRow: { flexDirection: 'row', borderRadius: BorderRadius.md, padding: 4 },
  segment: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  segmentText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  menuRowBorder: { borderBottomWidth: 1 },
  settingRow: { justifyContent: 'space-between' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  menuLabel: { flex: 1, fontSize: FontSize.base },
  comingSoon: { fontSize: FontSize.sm },
  versionText: { fontSize: FontSize.sm },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.lg, borderRadius: 8, borderWidth: 1 },
  dangerBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xxl, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.lg },
  modalError: { fontSize: FontSize.sm, marginBottom: Spacing.md },
  modalInput: { borderWidth: 1, borderRadius: 8, padding: Spacing.md, marginBottom: Spacing.md },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  modalBtn: { flex: 1, paddingVertical: Spacing.lg, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalBtnPrimary: {},
  modalBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  modalBtnTextPrimary: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
