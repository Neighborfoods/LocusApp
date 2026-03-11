import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { Vote } from '@/types/models';
import { VOTE_TYPE_LABELS, formatRelative, formatDate } from '@utils/formatters';
import api from '@api/client';
import { AppStackParams } from '@navigation/AppNavigator';

type StatusFilter = 'active' | 'completed' | 'pending';

function getStatusColors(colors: ReturnType<typeof useTheme>['colors']): Record<string, string> {
  return {
    active: colors.accent,
    pending: colors.gold,
    completed: colors.textSecondary,
    cancelled: colors.danger,
  };
}

function VoteCard({ vote, communityId, onPress }: { vote: Vote; communityId: string; onPress: () => void }) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const statusColors = getStatusColors(colors);
  const statusColor = statusColors[vote.status] ?? colors.textSecondary;
  const isActive = vote.status === 'active';
  const userVoted = !!vote.my_ballot;

  const castMutation = useMutation({
    mutationFn: (choice: 'yes' | 'no' | 'abstain') =>
      api.post(`/communities/${communityId}/votes/${vote.id}/cast`, { choice }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['votes', communityId] }),
  });

  return (
    <TouchableOpacity style={[styles.voteCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.85}>
      {/* Status badge */}
      <View style={styles.voteTopRow}>
        <View style={[styles.statusBadge, { borderColor: `${statusColor}50`, backgroundColor: `${statusColor}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{vote.status}</Text>
        </View>
        <Text style={[styles.voteType, { color: colors.textSecondary }]}>{VOTE_TYPE_LABELS[vote.type]}</Text>
      </View>

      <Text style={[styles.voteTitle, { color: colors.text }]}>{vote.title}</Text>
      {vote.description && (
        <Text style={[styles.voteDesc, { color: colors.textSecondary }]} numberOfLines={2}>{vote.description}</Text>
      )}

      {vote.owner_veto_used && (
        <View style={[styles.vetoBanner, { backgroundColor: `${colors.danger}10`, borderColor: `${colors.danger}30` }]}>
          <Icon name="vote-outline" size={14} color={colors.danger} />
          <Text style={[styles.vetoText, { color: colors.danger }]}>Owner veto applied — vote overridden</Text>
        </View>
      )}

      {(vote.yes_pct != null || vote.no_pct != null) && (
        <View style={styles.resultRow}>
          <View style={[styles.resultBar, { backgroundColor: colors.background }]}>
            <View style={[styles.resultFillYes, { flex: (vote.yes_pct ?? 0) / 100, backgroundColor: colors.accent }]} />
            <View style={[styles.resultFillNo, { flex: (vote.no_pct ?? 0) / 100, backgroundColor: colors.danger }]} />
          </View>
          <Text style={[styles.resultText, { color: colors.textSecondary }]}>
            {(vote.yes_pct ?? 0).toFixed(0)}% yes · {(vote.no_pct ?? 0).toFixed(0)}% no
          </Text>
        </View>
      )}

      {isActive && !userVoted && (
        <View style={styles.voteButtons}>
          {(['yes', 'no', 'abstain'] as const).map((choice) => {
            const config = {
              yes: { icon: 'thumb-up', color: colors.accent },
              no: { icon: 'thumb-down', color: colors.danger },
              abstain: { icon: 'minus-circle', color: colors.textSecondary },
            }[choice];
            return (
              <TouchableOpacity
                key={choice}
                style={[styles.voteBtn, { borderColor: `${config.color}50`, backgroundColor: `${config.color}10` }]}
                onPress={(e) => { e.stopPropagation?.(); castMutation.mutate(choice); }}
                disabled={castMutation.isPending}
              >
                <Icon name={config.icon} size={16} color={config.color} />
                <Text style={[styles.voteBtnText, { color: config.color }]}>{choice}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {isActive && userVoted && (
        <View style={styles.votedRow}>
          <Icon name="check-circle" size={16} color={colors.accent} />
          <Text style={[styles.votedText, { color: colors.accent }]}>
            You voted {typeof vote.my_ballot === 'object' && vote.my_ballot && 'choice' in vote.my_ballot ? vote.my_ballot.choice : vote.my_ballot} · {formatRelative(typeof vote.my_ballot === 'object' && vote.my_ballot && 'created_at' in vote.my_ballot ? vote.my_ballot.created_at ?? '' : '')}
          </Text>
        </View>
      )}

      <View style={styles.voteFooter}>
        <Icon name="account-group-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.voteFooterText, { color: colors.textSecondary }]}>{vote.vote_count ?? (vote.yes_count + vote.no_count + vote.abstain_count)} votes</Text>
        <View style={[styles.footerDot, { backgroundColor: colors.border }]} />
        <Icon name="clock-time-four-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.voteFooterText, { color: colors.textSecondary }]}>
          {vote.status === 'active' && (vote.ends_at ?? vote.expires_at)
            ? `Ends ${formatRelative(vote.ends_at ?? vote.expires_at)}`
            : formatDate(vote.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function VotingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const route = useRoute<RouteProp<AppStackParams, 'Voting'>>();
  const { communityId } = route.params;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  const { data: votes = [], isLoading, refetch, isRefetching } = useQuery<Vote[]>({
    queryKey: ['votes', communityId, statusFilter],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/votes?status=${statusFilter}&limit=30`);
      return data.data ?? [];
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Community Votes</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}
          onPress={() => navigation.navigate('CreateVote', { communityId })}
        >
          <Icon name="plus" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(['active', 'pending', 'completed'] as StatusFilter[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterPill, { backgroundColor: colors.surface, borderColor: colors.border }, statusFilter === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterText, { color: colors.textSecondary }, statusFilter === s && styles.filterTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.govNotice, { backgroundColor: `${colors.info}10`, borderColor: `${colors.info}30` }]}>
        <Icon name="information" size={16} color={colors.info} />
        <Text style={[styles.govText, { color: colors.info }]}>
          Homeowners have veto power over votes affecting their own property.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={votes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
          windowSize={5}
          initialNumToRender={6}
          updateCellsBatchingPeriod={50}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <VoteCard
              vote={item}
              communityId={communityId}
              onPress={() => navigation.navigate('VoteDetail', { communityId, voteId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="vote-outline" size={48} color={colors.textDisabled} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No {statusFilter} votes</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {statusFilter === 'active' ? 'Tap + to create a new vote' : 'Check back later'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xxl, paddingTop: Spacing['4xl'], paddingBottom: Spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  createBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.xxl, gap: Spacing.sm, marginBottom: Spacing.md },
  filterPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1 },
  filterText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  filterTextActive: { color: '#fff' },
  govNotice: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginHorizontal: Spacing.xxl, marginBottom: Spacing.md, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1 },
  govText: { fontSize: FontSize.xs, flex: 1, lineHeight: 18 },
  list: { paddingHorizontal: Spacing.xxl, gap: Spacing.md, paddingBottom: 100 },
  voteCard: { borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md, borderWidth: 1 },
  voteTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'capitalize' },
  voteType: { fontSize: FontSize.xs },
  voteTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  voteDesc: { fontSize: FontSize.sm, lineHeight: 20 },
  vetoBanner: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1 },
  vetoText: { fontSize: FontSize.xs },
  resultRow: { gap: Spacing.xs },
  resultBar: { height: 6, flexDirection: 'row', borderRadius: 3, overflow: 'hidden' },
  resultFillYes: { height: '100%' },
  resultFillNo: { height: '100%' },
  resultText: { fontSize: FontSize.xs },
  voteButtons: { flexDirection: 'row', gap: Spacing.sm },
  voteBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, borderWidth: 1 },
  voteBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'capitalize' },
  votedRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  votedText: { fontSize: FontSize.xs },
  voteFooter: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  voteFooterText: { fontSize: FontSize.xs },
  footerDot: { width: 3, height: 3, borderRadius: 1.5 },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  emptySubtitle: { fontSize: FontSize.sm },
});
