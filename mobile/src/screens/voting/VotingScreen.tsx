import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { Vote, VoteResultResponse } from '@types/models';
import { VOTE_TYPE_LABELS, formatRelative, formatDate } from '@utils/formatters';
import api from '@api/client';
import { AppStackParams } from '@navigation/AppNavigator';

type StatusFilter = 'active' | 'completed' | 'pending';

const STATUS_COLORS: Record<string, string> = {
  active: Colors.accent,
  pending: Colors.gold,
  completed: Colors.textSecondary,
  cancelled: Colors.danger,
};

function VoteCard({ vote, communityId, onPress }: { vote: Vote; communityId: string; onPress: () => void }) {
  const queryClient = useQueryClient();
  const statusColor = STATUS_COLORS[vote.status] ?? Colors.textSecondary;
  const isActive = vote.status === 'active';
  const userVoted = !!vote.my_ballot;

  const castMutation = useMutation({
    mutationFn: (choice: 'yes' | 'no' | 'abstain') =>
      api.post(`/communities/${communityId}/votes/${vote.id}/cast`, { choice }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['votes', communityId] }),
  });

  return (
    <TouchableOpacity style={styles.voteCard} onPress={onPress} activeOpacity={0.85}>
      {/* Status badge */}
      <View style={styles.voteTopRow}>
        <View style={[styles.statusBadge, { borderColor: `${statusColor}50`, backgroundColor: `${statusColor}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{vote.status}</Text>
        </View>
        <Text style={styles.voteType}>{VOTE_TYPE_LABELS[vote.type]}</Text>
      </View>

      {/* Title & description */}
      <Text style={styles.voteTitle}>{vote.title}</Text>
      {vote.description && (
        <Text style={styles.voteDesc} numberOfLines={2}>{vote.description}</Text>
      )}

      {/* Owner veto notice */}
      {vote.owner_veto_used && (
        <View style={styles.vetoBanner}>
          <Icon name="gavel" size={14} color={Colors.danger} />
          <Text style={styles.vetoText}>Owner veto applied — vote overridden</Text>
        </View>
      )}

      {/* Progress */}
      {vote.result && (
        <View style={styles.resultRow}>
          <View style={styles.resultBar}>
            <View style={[styles.resultFillYes, { flex: vote.result.yes_pct / 100 }]} />
            <View style={[styles.resultFillNo, { flex: vote.result.no_pct / 100 }]} />
          </View>
          <Text style={styles.resultText}>
            {vote.result.yes_pct.toFixed(0)}% yes · {vote.result.no_pct.toFixed(0)}% no
          </Text>
        </View>
      )}

      {/* Voting buttons */}
      {isActive && !userVoted && (
        <View style={styles.voteButtons}>
          {(['yes', 'no', 'abstain'] as const).map((choice) => {
            const config = {
              yes: { icon: 'thumb-up', color: Colors.accent },
              no: { icon: 'thumb-down', color: Colors.danger },
              abstain: { icon: 'minus-circle', color: Colors.textSecondary },
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
          <Icon name="check-circle" size={16} color={Colors.accent} />
          <Text style={styles.votedText}>You voted {vote.my_ballot?.choice} · {formatRelative(vote.my_ballot?.created_at ?? '')}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.voteFooter}>
        <Icon name="account-group-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.voteFooterText}>{vote.vote_count ?? 0} votes</Text>
        <View style={styles.footerDot} />
        <Icon name="clock-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.voteFooterText}>
          {vote.status === 'active' && vote.ends_at
            ? `Ends ${formatRelative(vote.ends_at)}`
            : formatDate(vote.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function VotingScreen() {
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Votes</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateVote', { communityId })}
        >
          <Icon name="plus" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Status filter */}
      <View style={styles.filterRow}>
        {(['active', 'pending', 'completed'] as StatusFilter[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterPill, statusFilter === s && styles.filterPillActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Governance notice */}
      <View style={styles.govNotice}>
        <Icon name="information-outline" size={16} color={Colors.info} />
        <Text style={styles.govText}>
          Homeowners have veto power over votes affecting their own property.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={votes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <VoteCard
              vote={item}
              communityId={communityId}
              onPress={() => navigation.navigate('VoteDetail', { communityId, voteId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="vote-outline" size={48} color={Colors.textDisabled} />
              <Text style={styles.emptyTitle}>No {statusFilter} votes</Text>
              <Text style={styles.emptySubtitle}>
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
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xxl, paddingTop: Spacing['4xl'], paddingBottom: Spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  createBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: `${Colors.primary}20`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${Colors.primary}40` },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.xxl, gap: Spacing.sm, marginBottom: Spacing.md },
  filterPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  filterTextActive: { color: '#fff' },
  govNotice: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginHorizontal: Spacing.xxl, marginBottom: Spacing.md, backgroundColor: `${Colors.info}10`, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.info}30` },
  govText: { fontSize: FontSize.xs, color: Colors.info, flex: 1, lineHeight: 18 },
  list: { paddingHorizontal: Spacing.xxl, gap: Spacing.md, paddingBottom: 100 },
  voteCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  voteTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'capitalize' },
  voteType: { fontSize: FontSize.xs, color: Colors.textSecondary },
  voteTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  voteDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  vetoBanner: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', backgroundColor: `${Colors.danger}10`, borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: `${Colors.danger}30` },
  vetoText: { fontSize: FontSize.xs, color: Colors.danger },
  resultRow: { gap: Spacing.xs },
  resultBar: { height: 6, flexDirection: 'row', borderRadius: 3, overflow: 'hidden', backgroundColor: Colors.bg },
  resultFillYes: { backgroundColor: Colors.accent, height: '100%' },
  resultFillNo: { backgroundColor: Colors.danger, height: '100%' },
  resultText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  voteButtons: { flexDirection: 'row', gap: Spacing.sm },
  voteBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, borderWidth: 1 },
  voteBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'capitalize' },
  votedRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  votedText: { fontSize: FontSize.xs, color: Colors.accent },
  voteFooter: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  voteFooterText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  footerDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.border },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
