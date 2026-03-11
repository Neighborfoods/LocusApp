import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/useTheme';
import type { ThemeColors } from '@theme/ThemeContext';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { FundSummary, FundTransaction, MemberEarning, Community } from '@/types/models';
import { formatCents, formatPercent, formatRelative, formatDate } from '@utils/formatters';
import api from '@api/client';
import { AppStackParams } from '@navigation/AppNavigator';
import { useAuthStore } from '@store/authStore';

// ── Transaction row ────────────────────────────────────────────────────────────

function getTxMeta(type: string, colors: ThemeColors): { icon: string; color: string } {
  const map: Record<string, { icon: string; color: string }> = {
    rental_income: { icon: 'home', color: colors.accent },
    distribution: { icon: 'cash-multiple', color: colors.primary },
    expense: { icon: 'cash-minus', color: colors.danger },
    reserve: { icon: 'safe', color: colors.gold },
    purchase: { icon: 'home-plus', color: colors.info },
  };
  return map[type] ?? { icon: 'swap-horizontal-bold', color: colors.textSecondary };
}

function TxRow({ tx }: { tx: FundTransaction }) {
  const { colors } = useTheme();
  const meta = getTxMeta(tx.type, colors);
  const isPositive = ['rental_income', 'distribution'].includes(tx.type);
  return (
    <View style={[styles.txRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.txIcon, { backgroundColor: `${meta.color}20` }]}>
        <Icon name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.txLabel, { color: colors.text }]}>{tx.description || tx.type.replace(/_/g, ' ')}</Text>
        <Text style={[styles.txDate, { color: colors.textSecondary }]}>{formatRelative(tx.created_at)}</Text>
      </View>
      <Text style={[styles.txAmount, { color: isPositive ? colors.accent : colors.danger }]}>
        {isPositive ? '+' : '-'}{formatCents(tx.amount_cents)}
      </Text>
    </View>
  );
}

// ── Earnings row ──────────────────────────────────────────────────────────────

function EarningRow({ earning }: { earning: MemberEarning }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.earningRow, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.earningPeriod, { color: colors.text }]}>{formatDate(earning.created_at)}</Text>
        <Text style={[styles.earningEquity, { color: colors.textSecondary }]}>{formatPercent(earning.equity_snapshot_pct ?? earning.equity_pct_at_time)} equity</Text>
      </View>
      <Text style={[styles.earningAmount, { color: colors.accent }]}>+{formatCents(earning.amount_cents)}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function FinanceScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  useAuthStore();
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
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Icon name="chart-line" size={64} color={colors.textDisabled} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No communities yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Join a community to start earning from your property</Text>
        <TouchableOpacity style={styles.findBtn} onPress={() => navigation.navigate('Communities' as any)}>
          <LinearGradient colors={[...colors.gradPrimary]} style={styles.findBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.findBtnText}>Find a Community</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={fundLoading} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Finance</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Your equity income</Text>
      </View>

      {myCommunities.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.communityPicker}>
          {myCommunities.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.commChip, { backgroundColor: colors.surface, borderColor: colors.border }, activeCommunityId === c.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setSelectedCommunity(c.id)}
            >
              <Text style={[styles.commChipText, { color: colors.textSecondary }, activeCommunityId === c.id && styles.commChipTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <LinearGradient colors={[...colors.gradPrimary]} style={styles.earningsBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View>
          <Text style={styles.bannerLabel}>Your total earnings</Text>
          <Text style={styles.bannerAmount}>{formatCents(totalEarnings)}</Text>
          <Text style={styles.bannerSub}>From {myEarnings.length} distributions</Text>
        </View>
        <View style={styles.bannerRight}>
          <Icon name="trending-up" size={36} color="rgba(255,255,255,0.3)" />
        </View>
      </LinearGradient>

      {fundSummary && (
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="bank" size={24} color={colors.primary} />
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCents(fundSummary.balance_cents)}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Fund balance</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="home" size={24} color={colors.accent} />
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCents(fundSummary.total_income_cents ?? fundSummary.total_earnings_cents)}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total income</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="history" size={24} color={colors.gold} />
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCents(fundSummary.monthly_income_cents ?? 0)}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>This month</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="wallet" size={24} color={colors.info} />
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCents(fundSummary.reserve_cents ?? fundSummary.reserve_amount_cents)}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Reserve</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>My earnings history</Text>
        {myEarnings.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={[styles.emptySectionText, { color: colors.textSecondary }]}>No distributions yet</Text>
          </View>
        ) : (
          myEarnings.slice(0, 5).map((e) => <EarningRow key={e.id} earning={e} />)
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Community fund activity</Text>
        </View>
        {txLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          transactions.slice(0, 10).map((tx) => <TxRow key={tx.id} tx={tx} />)
        )}
      </View>

      <TouchableOpacity
        style={[styles.transferCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => navigation.navigate('Transfer', { fromCommunityId: activeCommunityId })}
      >
        <View style={styles.transferLeft}>
          <Icon name="swap-horizontal-bold" size={24} color={colors.primary} />
          <View>
            <Text style={[styles.transferTitle, { color: colors.text }]}>Transfer to another community</Text>
            <Text style={[styles.transferSubtitle, { color: colors.textSecondary }]}>Move your equity between communities</Text>
          </View>
        </View>
        <Icon name="chevron-right" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 100 },
  header: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing['4xl'], paddingBottom: Spacing.lg },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, marginTop: 2 },
  headerSubtitle: { fontSize: FontSize.sm, marginTop: 2 },
  communityPicker: { paddingHorizontal: Spacing.xxl, gap: Spacing.sm, paddingBottom: Spacing.lg },
  commChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1 },
  commChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  commChipTextActive: { color: '#fff' },
  earningsBanner: { marginHorizontal: Spacing.xxl, borderRadius: BorderRadius.xl, padding: Spacing.xxl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  bannerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, marginBottom: 4 },
  bannerAmount: { color: '#fff', fontSize: FontSize['3xl'], fontWeight: FontWeight.bold },
  bannerSub: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs, marginTop: 4 },
  bannerRight: { opacity: 0.8 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xxl, gap: Spacing.md, marginBottom: Spacing.xl },
  summaryCard: { flex: 1, minWidth: '45%', borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm, borderWidth: 1 },
  summaryValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  summaryLabel: { fontSize: FontSize.xs },
  section: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  txRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1 },
  txIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  txLabel: { fontSize: FontSize.sm, textTransform: 'capitalize' },
  txDate: { fontSize: FontSize.xs, marginTop: 2 },
  txAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  earningRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1 },
  earningPeriod: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  earningEquity: { fontSize: FontSize.xs, marginTop: 2 },
  earningAmount: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  emptySection: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptySectionText: { fontSize: FontSize.sm },
  transferCard: { marginHorizontal: Spacing.xxl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1 },
  transferLeft: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', flex: 1 },
  transferTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  transferSubtitle: { fontSize: FontSize.xs },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xxl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSize.sm, textAlign: 'center' },
  findBtn: { overflow: 'hidden', borderRadius: BorderRadius.xl, marginTop: Spacing.md },
  findBtnGrad: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl },
  findBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
