import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Vibration,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActionSheetIOS,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary, type ImageLibraryOptions } from 'react-native-image-picker';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { AppTextInput } from '@components/AppTextInput';
import api from '@api/client';
import { AppStackParams } from '@navigation/AppNavigator';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams, 'EditProfile'>>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [nameParts, setNameParts] = useState({ first: '', last: '' });
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUploading, _setAvatarUploading] = useState(false);

  const pickImage = async (source: 'camera' | 'library') => {
    const opts: ImageLibraryOptions = { mediaType: 'photo', quality: 0.8, maxWidth: 400, maxHeight: 400 };
    try {
      const result = source === 'camera'
        ? await launchCamera(opts)
        : await launchImageLibrary(opts);
      if (result.assets?.[0]?.uri) setAvatarUri(result.assets[0].uri);
      if (result.errorCode) {
        if (result.errorCode === 'camera_unavailable' || result.errorCode === 'permission') {
          Alert.alert('Photo', result.errorMessage ?? 'Camera or library is unavailable.');
        }
      }
    } catch {
      Alert.alert('Photo', 'Could not open camera or library.');
    }
  };

  const handleAvatarPress = () => {
    const options = avatarUri
      ? ['Take Photo', 'Choose from Library', 'Remove Photo', 'Cancel']
      : ['Take Photo', 'Choose from Library', 'Cancel'];

    if (Platform.OS === 'ios' && ActionSheetIOS) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: avatarUri ? 2 : undefined,
          title: 'Profile Photo',
        },
        async (index) => {
          if (index === 0) await pickImage('camera');
          if (index === 1) await pickImage('library');
          if (index === 2 && avatarUri) setAvatarUri(null);
        }
      );
    } else {
      Alert.alert('Profile Photo', undefined, [
        { text: 'Take Photo', onPress: () => pickImage('camera') },
        { text: 'Choose from Library', onPress: () => pickImage('library') },
        ...(avatarUri ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: () => setAvatarUri(null) }] : []),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/users/me');
        const data = res?.data?.data;
        if (cancelled || !data) return;
        setName(data.name ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        setBio(data.bio ?? '');
        if (data.avatar_url) setAvatarUri(data.avatar_url);
        const n = (data.name ?? '').trim();
        const [first = '', ...rest] = n.split(/\s+/);
        setNameParts({ first, last: rest.join(' ') });
      } catch (_) {
        if (!cancelled) setError('Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    const fullName = [nameParts.first, nameParts.last].filter(Boolean).join(' ').trim();
    if (!fullName) {
      setError('Name is required');
      Vibration.vibrate(10);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const isLocalFile = avatarUri && (avatarUri.startsWith('file://') || avatarUri.startsWith('content://'));
      if (isLocalFile && avatarUri) {
        const formData = new FormData();
        formData.append('name', fullName);
        formData.append('phone', phone || '');
        formData.append('bio', bio || '');
        formData.append('avatar', {
          uri: avatarUri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as unknown as Blob);
        await api.put('/users/profile', formData);
      } else {
        const payload: { name: string; phone: string | null; bio: string | null; avatar_url?: string | null } = {
          name: fullName,
          phone: phone || null,
          bio: bio || null,
        };
        if (avatarUri !== undefined) payload.avatar_url = avatarUri || null;
        await api.put('/users/profile', payload);
      }
      Vibration.vibrate(10);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (_) {
      setError('Failed to save');
      Vibration.vibrate(10);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingBottom: (insets.bottom || 0) + 40,
            paddingHorizontal: 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerAlpha }]}>
              <Icon name="alert-circle" size={18} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.75} style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri, cache: 'force-cache' }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Icon name="account" size={48} color={colors.textTertiary} />
                </View>
              )}
              <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                <Icon name="camera" size={13} color="white" />
              </View>
              {avatarUploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="white" size="small" />
                </View>
              )}
            </View>
            <Text style={[styles.editPhotoLabel, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>First Name</Text>
            <AppTextInput
              value={nameParts.first}
              onChangeText={(t) => setNameParts((p) => ({ ...p, first: t }))}
              placeholder="First name"
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Last Name</Text>
            <AppTextInput
              value={nameParts.last}
              onChangeText={(t) => setNameParts((p) => ({ ...p, last: t }))}
              placeholder="Last name"
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Email</Text>
            <View style={[styles.input, styles.inputDisabled, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Icon name="lock" size={18} color={colors.textTertiary} style={styles.lockIcon} />
              <Text style={[styles.inputText, { color: colors.textSecondary }]}>{email || '—'}</Text>
            </View>
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Phone</Text>
            <AppTextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone"
              keyboardType="phone-pad"
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Bio (150 chars)</Text>
            <AppTextInput
              value={bio}
              onChangeText={(t) => setBio(t.slice(0, 150))}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={3}
              style={[styles.input, styles.bioInput, { color: colors.text, borderColor: colors.border }]}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>{bio.length}/150</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xxl, paddingBottom: 100 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg },
  errorText: { fontSize: FontSize.sm, flex: 1 },
  avatarContainer: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  avatarWrapper: { width: 96, height: 96, borderRadius: 48, position: 'relative' },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoLabel: { marginTop: 8, fontSize: 15, fontWeight: '500' },
  card: { padding: Spacing.lg, borderRadius: 12, borderWidth: 1 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  input: { borderWidth: 1, borderRadius: 8, padding: Spacing.md },
  inputDisabled: { flexDirection: 'row', alignItems: 'center' },
  inputText: { fontSize: FontSize.base, flex: 1 },
  lockIcon: { marginRight: Spacing.sm },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: FontSize.xs, marginTop: Spacing.xs },
  saveBtn: { marginTop: Spacing.xl, paddingVertical: Spacing.lg, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
