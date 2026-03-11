import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/useTheme';
import api from '../../api/client';

type TransferType = 'send' | 'request' | 'equity';

export default function TransferScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [transferType, setTransferType] = useState<TransferType>('send');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const TRANSFER_TYPES = [
    { value: 'send' as TransferType, label: 'Send', icon: 'arrow-up-circle-outline' },
    { value: 'request' as TransferType, label: 'Request', icon: 'arrow-down-circle-outline' },
    { value: 'equity' as TransferType, label: 'Equity', icon: 'percent-outline' },
  ];

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!recipient.trim()) {
      Alert.alert('Missing Recipient', 'Please enter email or username.');
      return;
    }

    Alert.alert(
      'Confirm Transfer',
      `${transferType === 'send' ? 'Send' : transferType === 'request' ? 'Request' : 'Transfer equity of'} $${amount} ${transferType === 'send' ? 'to' : 'from'} ${recipient}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              await api.post('/users/transactions', {
                type: transferType,
                amount: parseFloat(amount),
                recipient,
                note,
              });
              Alert.alert('Success', 'Transfer submitted successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch {
              Alert.alert('Error', 'Transfer failed. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transfer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.typeSelector, { backgroundColor: colors.surface }]}>
          {TRANSFER_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.typeBtn,
                transferType === t.value && {
                  backgroundColor: colors.card,
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 3,
                },
              ]}
              onPress={() => setTransferType(t.value)}
            >
              <Icon
                name={t.icon}
                size={20}
                color={transferType === t.value ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeLabel,
                  { color: transferType === t.value ? colors.primary : colors.textSecondary },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.amountCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currencySign, { color: colors.text }]}>$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              style={[styles.amountInput, { color: colors.text }]}
            />
          </View>
        </View>

        <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            {transferType === 'request' ? 'Request from' : 'Send to'}
          </Text>
          <TextInput
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Email or username"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.textInput, { color: colors.text }]}
          />
        </View>

        <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            style={[styles.textInput, styles.noteInput, { color: colors.text }]}
          />
        </View>

        {transferType === 'equity' && (
          <View style={[styles.infoCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Icon name="information" size={18} color="#2563EB" />
            <Text style={styles.infoText}>
              Equity transfers affect your ownership share in a community. This action requires
              community governance approval.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: loading ? colors.textSecondary : colors.primary },
          ]}
          onPress={handleTransfer}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>
            {loading
              ? 'Processing...'
              : `Confirm ${TRANSFER_TYPES.find((t) => t.value === transferType)?.label}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    marginTop: 8,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 13,
  },
  typeLabel: { fontSize: 14, fontWeight: '600' },
  amountCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  currencySign: { fontSize: 32, fontWeight: '300', marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: '200', flex: 1 },
  inputCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: { fontSize: 16 },
  noteInput: { minHeight: 60, textAlignVertical: 'top' },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 18 },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
