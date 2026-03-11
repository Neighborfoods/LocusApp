import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/useTheme';
import api from '../../api/client';

interface Transaction {
  id: number;
  type: 'credit' | 'debit' | 'equity' | 'rent';
  amount: number;
  description: string;
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function SavingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);

  const fetchData = async () => {
    try {
      const res = await api.get('/users/transactions');
      const data = res.data?.data ?? res.data ?? [];
      setTransactions(Array.isArray(data) ? data : []);
      const list = Array.isArray(data) ? data : [];
      const total = list.reduce(
        (sum: number, t: Transaction) => (t.type === 'credit' ? sum + t.amount : sum - t.amount),
        0
      );
      setTotalSavings(Math.max(0, total));
      const thisMonth = new Date().getMonth();
      const monthly = list
        .filter(
          (t: Transaction) =>
            new Date(t.created_at).getMonth() === thisMonth && t.type === 'credit'
        )
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      setMonthlyEarnings(monthly);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const TX_ICONS: Record<string, { icon: string; color: string }> = {
    credit: { icon: 'arrow-down-circle-outline', color: '#10B981' },
    debit: { icon: 'arrow-up-circle-outline', color: '#EF4444' },
    equity: { icon: 'percent', color: '#8B5CF6' },
    rent: { icon: 'city', color: '#F59E0B' },
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const meta = TX_ICONS[item.type] || TX_ICONS.credit;
    const isCredit = item.type === 'credit';
    return (
      <View style={[styles.txRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.txIcon, { backgroundColor: `${meta.color}18` }]}>
          <Icon name={meta.icon as any} size={22} color={meta.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txDesc, { color: colors.text }]} numberOfLines={1}>
            {item.description || item.type}
          </Text>
          <Text style={[styles.txDate, { color: colors.textSecondary }]}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isCredit ? '#10B981' : '#EF4444' }]}>
            {isCredit ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
          </Text>
          <Text
            style={[
              styles.txStatus,
              {
                color:
                  item.status === 'completed'
                    ? '#10B981'
                    : item.status === 'pending'
                      ? '#F59E0B'
                      : '#EF4444',
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Savings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Transfer' as never)}>
          <Icon name="plus-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>Total Balance</Text>
          <Text style={styles.summaryAmount}>${totalSavings.toLocaleString()}</Text>
          <Text style={styles.summarySubLabel}>All time</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#10B981' }]}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryAmount}>${monthlyEarnings.toLocaleString()}</Text>
          <Text style={styles.summarySubLabel}>Earnings</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.transferCTA, { backgroundColor: colors.surface }]}
        onPress={() => navigation.navigate('Transfer' as never)}
      >
        <Icon name="swap-horizontal-bold" size={20} color={colors.primary} />
        <Text style={[styles.transferCTAText, { color: colors.primary }]}>New Transfer</Text>
        <Icon name="chevron-right" size={18} color={colors.primary} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaction History</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Icon name="text-box-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No transactions yet
              </Text>
            </View>
          ) : null
        }
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
  },
  summaryAmount: {
    color: 'white',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 4,
  },
  summarySubLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
  },
  transferCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 14,
    gap: 10,
  },
  transferCTAText: { flex: 1, fontSize: 15, fontWeight: '600' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  txInfo: { flex: 1, gap: 3 },
  txDesc: { fontSize: 15, fontWeight: '500' },
  txDate: { fontSize: 12 },
  txRight: { alignItems: 'flex-end', gap: 3 },
  txAmount: { fontSize: 15, fontWeight: '600' },
  txStatus: { fontSize: 11, textTransform: 'capitalize' },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15 },
});
