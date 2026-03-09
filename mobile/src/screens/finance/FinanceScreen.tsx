import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@theme/index';
import { FundSummary, FundTransaction, MemberEarning, Community } from '@types/models';
import { formatCents, formatPercent, formatRelative, formatDate } from '@utils/formatters';
import api from '@api/client';
import { AppStackParams } from '@navigation/AppNavigator';
import { useAuthStore } from '@store/authStore';

// ── Transaction row ────────────────────────────────────────────────────────────

const TX_ICONS: Record<string, { icon: string; color: string }> = {
  rental_income: { icon: 'home-currency-usd', color: Colors.accent },
  distribution: { icon: 'cash-multiple', color: Colors.primary },
  expense: { icon: 'cash-minus', color: Colors.danger },
  reserve: { icon: 'safe', color: Colors.gold },
  purchase: { icon: 'home-plus', color: Colors.info },
};

function TxRow({ tx }: { tx: FundTransaction }) {
  const meta = TX_ICONS[tx.type] ?? { icon: 'swap-horizontal', color: Colors.textSecondary };
  const isPositive = ['rental_income', 'distribution'].includes(tx.type);
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: `${meta.color}20` }]}>
        <Icon name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txLabel}>{tx.description || tx.type.replace(/_/g, ' ')}</Text>
        <Text style={styles.txDate}>{formatRelative(tx.created_at)}</Text>
      </View>
      <Text style={[styles.txAmount, { color: isPositive ? Colors.accent : Colors.danger }]}>
        {isPositive ? '+' : '-'}{formatCents(tx.amount_cents)}
      </Text>
    </View>
  );
}

// ── Earnings row ──────────────────────────────────────────────────────────────

function EarningRow({ earning }: { earning: MemberEarning }) {
  return (
    <View style={styles.earningRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.earningPeriod}>{formatDate(earning.created_at)}</Text>
        <Text style={styles.earningEquity}>{formatPercent(earning.equity_snapshot_pct)} equity</Text>
      </View>
      <Text style={styles.earningAmount}>+{formatCents(earning.amount_cents)}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function FinanceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const { user } = useAuthStore();
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);

  const { data: myCommunities = [] } = useQuery<Community[]>({
    queryKey: ['communities', 'mine'],
    queryFn: async () => {
      const { data } = await api.get('/communities?mine=true');
      return data.data ?? [];
    },
  });

  const activeCommunityId = selectedCommunity ?? myCommunities[0]?.id ?? null;

  const { data: fundSummary, isLoading: fundLoading, refetch } = useQuery<FundSummary>({
    queryKey: ['finance', 'fund', activeCommunityId],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${activeCommunityId}/fund/summary`);
      return data.data;
    },
    enabled: !!activeCommunityId,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery<FundTransaction[]>({
    queryKey: ['finance', 'transactions', activeCommunityId],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${activeCommunityId}/fund/transactions?limit=30`);
      return data.data ?? [];
    },
    enabled: !!activeCommunityId,
  });

  const { data: myEarnings = [] } = useQuery<MemberEarning[]>({
    queryKey: ['finance', 'earnings', activeCommunityId],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${activeCommunityId}/finance/earnings/me`);
      return data.data ?? [];
    },
    enabled: !!activeCommunityId,
  });

  const totalEarnings = myEarnings.reduce((acc, e) => acc + e.amount_cents, 0);

  if (!activeCommunityId) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="home-analytics" size={64} color={Colors.textDisabled} />
        <Text style={styles.emptyTitle}>No communities yet</Text>
        <Text style={styles.emptySubtitle}>Join a community to start earning from your property</Text>
        <TouchableOpacity style={styles.findBtn} onPress={() => navigation.navigate('Communities' as any)}>
          <LinearGradient colors={Colors.gradPrimary} style={styles.findBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.findBtnText}>Find a Community</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={fundLoading} onRefresh={refetch} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Finance</Text>
        <Text style={styles.headerSubtitle}>Your equity income</Text>
      </View>

      {/* Community selector */}
      {myCommunities.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.communityPicker}>
          {myCommunities.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.commChip, activeCommunityId === c.id && styles.commChipActive]}
              onPress={() => setSelectedCommunity(c.id)}
            >
              <Text style={[styles.commChipText, activeCommunityId === c.id && styles.commChipTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Total earnings banner */}
      <LinearGradient colors={Colors.gradPrimary} style={styles.earningsBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View>
          <Text style={styles.bannerLabel}>Your total earnings</Text>
          <Text style={styles.bannerAmount}>{formatCents(totalEarnings)}</Text>
          <Text style={styles.bannerSub}>From {myEarnings.length} distributions</Text>
        </View>
        <View style={styles.bannerRight}>
          <Icon name="trending-up" size={36} color="rgba(255,255,255,0.3)" />
        </View>
      </LinearGradient>

      {/* Fund summary cards */}
      {fundSummary && (
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Icon name="bank" size={24} color={Colors.primary} />
            <Text style={styles.summaryValue}>{formatCents(fundSummary.balance_cents)}</Text>
            <Text style={styles.summaryLabel}>Fund balance</Text>
          </View>
          <View style={styles.summaryCard}>
            <Icon name="home-currency-usd" size={24} color={Colors.accent} />
            <Text style={styles.summaryValue}>{formatCents(fundSummary.total_income_cents)}</Text>
            <Text style={styles.summaryLabel}>Total income</Text>
          </View>
          <View style={styles.summaryCard}>
            <Icon name="calendar-month" size={24} color={Colors.gold} />
            <Text style={styles.summaryValue}>{formatCents(fundSummary.monthly_income_cents)}</Text>
            <Text style={styles.summaryLabel}>This month</Text>
          </View>
          <View style={styles.summaryCard}>
            <Icon name="safe" size={24} color={Colors.info} />
            <Text style={styles.summaryValue}>{formatCents(fundSummary.reserve_cents)}</Text>
            <Text style={styles.summaryLabel}>Reserve</Text>
          </View>
        </View>
      )}

      {/* My earnings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My earnings history</Text>
        {myEarnings.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No distributions yet</Text>
          </View>
        ) : (
          myEarnings.slice(0, 5).map((e) => <EarningRow key={e.id} earning={e} />)
        )}
      </View>

      {/* Fund transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community fund activity</Text>
        </View>
        {txLoading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          transactions.slice(0, 10).map((tx) => <TxRow key={tx.id} tx={tx} />)
        )}
      </View>

      {/* Transfer CTA */}
      <TouchableOpacity
        style={styles.transferCard}
        onPress={() => navigation.navigate('Transfer', { fromCommunityId: activeCommunityId })}
      >
        <View style={styles.transferLeft}>
          <Icon name="swap-horizontal" size={24} color={Colors.primary} />
          <View>
            <Text style={styles.transferTitle}>Transfer to another community</Text>
            <Text style={styles.transferSubtitle}>Move your equity between communities</Text>
          </View>
        </View>
        <Icon name="chevron-right" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 100 },
  header: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing['4xl'], paddingBottom: Spacing.lg },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.text },
  headerSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  communityPicker: { paddingHorizontal: Spacing.xxl, gap: Spacing.sm, paddingBottom: Spacing.lg },
  commChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  commChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  commChipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  commChipTextActive: { color: '#fff' },
  earningsBanner: { marginHorizontal: Spacing.xxl, borderRadius: BorderRadius.xl, padding: Spacing.xxl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  bannerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, marginBottom: 4 },
  bannerAmount: { color: '#fff', fontSize: FontSize['3xl'], fontWeight: FontWeight.bold },
  bannerSub: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs, marginTop: 4 },
  bannerRight: { opacity: 0.8 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xxl, gap: Spacing.md, marginBottom: Spacing.xl },
  summaryCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  summaryValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  section: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  txRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  txIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  txLabel: { fontSize: FontSize.sm, color: Colors.text, textTransform: 'capitalize' },
  txDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  txAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  earningRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  earningPeriod: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  earningEquity: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  earningAmount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.accent },
  emptySection: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptySectionText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  transferCard: { marginHorizontal: Spacing.xxl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  transferLeft: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', flex: 1 },
  transferTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  transferSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary },
  emptyContainer: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xxl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  findBtn: { overflow: 'hidden', borderRadius: BorderRadius.xl, marginTop: Spacing.md },
  findBtnGrad: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl },
  findBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
