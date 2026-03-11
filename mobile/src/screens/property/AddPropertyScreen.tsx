import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppTextInput } from '@components/AppTextInput';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@theme/index';
import api from '@api/client';
import { AppStackParams } from '@navigation/AppNavigator';

const PROPERTY_TYPES = ['House', 'Apartment', 'Room', 'Land'] as const;

export default function AddPropertyScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>(PROPERTY_TYPES[0]);
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [lat, _setLat] = useState<number | null>(null);
  const [lng, _setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Property title is required');
      Vibration.vibrate(10);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        type: type.trim(),
        address: address.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        description: description.trim() || undefined,
      };
      if (lat != null && lng != null) {
        payload.location = { lat, lng };
      }
      const res = await api.post('/properties', payload);
      const data = res?.data;
      if (data?.success && data?.data) {
        Vibration.vibrate(10);
        Alert.alert('Success', 'Property added.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        setError('Failed to add property');
      }
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Something went wrong');
      Vibration.vibrate(10);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Property</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerAlpha }]}>
            <Icon name="alert-circle" size={18} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Property Title</Text>
          <AppTextInput
            placeholder="e.g. Cozy 2BR near downtown"
            value={title}
            onChangeText={setTitle}
            autoCapitalize="words"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
          <View style={styles.typeRow}>
            {PROPERTY_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, type === t && { backgroundColor: colors.primary }]}
                onPress={() => { setType(t); Vibration.vibrate(10); }}
              >
                <Text style={[styles.typeChipText, { color: type === t ? colors.textOnPrimary : colors.text }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Address</Text>
          <AppTextInput
            placeholder="Street, city, state"
            value={address}
            onChangeText={setAddress}
            autoCapitalize="words"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Price per month ($)</Text>
          <AppTextInput
            placeholder="0"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            autoCapitalize="none"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
          <AppTextInput
            placeholder="Describe the property..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing['4xl'], paddingBottom: Spacing.lg, borderBottomWidth: 1 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xxl, paddingBottom: 100 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg },
  errorText: { fontSize: FontSize.sm, flex: 1 },
  card: { padding: Spacing.lg, borderRadius: 12, marginBottom: Spacing.lg, borderWidth: 1 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  typeChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  input: { borderWidth: 1, borderRadius: 8, padding: Spacing.md, marginTop: Spacing.xs },
  textArea: { borderWidth: 1, borderRadius: 8, padding: Spacing.md, minHeight: 100, textAlignVertical: 'top' },
  submitBtn: { borderRadius: 12, paddingVertical: Spacing.lg, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg, ...Shadows.md },
  submitText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
