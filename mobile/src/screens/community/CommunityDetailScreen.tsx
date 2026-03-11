import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { Community, Membership } from '@/types/models';
import { COMMUNITY_TYPE_LABELS, formatCents, formatPercent } from '@utils/formatters';
import api from '@api/client';
import { useAuthStore } from '@store/authStore';
import { AppStackParams } from '@navigation/AppNavigator';

const HEADER_HEIGHT = 300;
const SCROLL_THRESHOLD = HEADER_HEIGHT - 80;

type Tabs = 'overview' | 'members' | 'properties' | 'rules';

export default function CommunityDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const route = useRoute<RouteProp<AppStackParams, 'CommunityDetail'>>();
  const { communityId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<Tabs>('overview');

  const headerOpacity = scrollY.interpolate({
    inputRange: [SCROLL_THRESHOLD - 50, SCROLL_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const { data: community, isLoading } = useQuery<Community>({
    queryKey: ['communities', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}`);
      return data.data;
    },
  });

  const { data: memberships = [] } = useQuery<Membership[]>({
    queryKey: ['communities', communityId, 'members'],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/members`);
      return data.data ?? [];
    },
    enabled: !!community,
  });

  const myMembership = memberships.find((m) => m.user_id === user?.id);
  const isMember = !!myMembership;

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/communities/${communityId}/apply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId] });
    },
  });

  if (isLoading || !community) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const availableRooms = community.available_rooms ?? 0;
  const occupancyPct = (community.member_count / community.capacity) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity, borderBottomColor: colors.border }]}>
        <LinearGradient colors={[colors.background, colors.background]} style={StyleSheet.absoluteFillObject} />
        <TouchableOpacity style={[styles.stickyBackBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stickyTitle, { color: colors.text }]} numberOfLines={1}>{community.name}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Animated.View style={[styles.hero, { opacity: heroOpacity }]}>
          <FastImage
            style={StyleSheet.absoluteFillObject}
            source={{ uri: community.cover_url ?? 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400', priority: FastImage.priority.high }}
            resizeMode={FastImage.resizeMode.cover}
          />
          <LinearGradient colors={['transparent', colors.background]} style={styles.heroGrad} />

          {/* Back btn */}
          <TouchableOpacity style={styles.heroBackBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.heroShareBtn}>
            <Icon name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View style={[styles.typeBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.typeBadgeText, { color: colors.textSecondary }]}>{COMMUNITY_TYPE_LABELS[community.type]}</Text>
            </View>
            {availableRooms > 0 ? (
              <View style={[styles.openBadge, { backgroundColor: `${colors.accent}15`, borderColor: colors.accent }]}>
                <View style={[styles.openDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.openText, { color: colors.accent }]}>Accepting members</Text>
              </View>
            ) : (
              <View style={[styles.fullBadge, { backgroundColor: `${colors.textDisabled}15` }]}>
                <Text style={[styles.fullText, { color: colors.textDisabled }]}>Full</Text>
              </View>
            )}
          </View>
          <Text style={[styles.communityName, { color: colors.text }]}>{community.name}</Text>
          <View style={styles.locationRow}>
            <Icon name="map-marker" size={14} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>{community.city}, {community.state}</Text>
          </View>

          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statCard}>
              <Icon name="account-group" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{community.member_count}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Members</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCard}>
              <Icon name="door-open" size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: availableRooms > 0 ? colors.accent : colors.textDisabled }]}>{availableRooms}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Open rooms</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCard}>
              <Icon name="star" size={20} color={colors.gold} />
              <Text style={[styles.statValue, { color: colors.text }]}>{community.rating.toFixed(1)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCard}>
              <Icon name="bank" size={20} color={colors.info} />
              <Text style={[styles.statValue, { color: colors.text }]}>{formatCents(community.fund_balance_cents ?? 0)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fund</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {(['overview', 'members', 'properties', 'rules'] as Tabs[]).map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, { borderColor: colors.border }, activeTab === tab && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <View style={{ gap: Spacing.xl }}>
              {community.description && (
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
                  <Text style={[styles.descText, { color: colors.textSecondary }]}>{community.description}</Text>
                </View>
              )}

              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Occupancy</Text>
                <View style={styles.occupancyRow}>
                  <Text style={[styles.occupancyText, { color: colors.textSecondary }]}>{community.member_count} / {community.capacity} members</Text>
                  <Text style={[styles.occupancyPct, { color: colors.text }]}>{occupancyPct.toFixed(0)}%</Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
                  <View style={[styles.progressFill, { width: `${Math.min(occupancyPct, 100)}%` as any, backgroundColor: colors.primary }]} />
                </View>
              </View>

              {community.lifestyle_tags && community.lifestyle_tags.length > 0 && (
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Lifestyle</Text>
                  <View style={styles.tagRow}>
                    {community.lifestyle_tags.map((tag, i) => (
                      <View key={i} style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text></View>
                    ))}
                  </View>
                </View>
              )}

              <View style={[styles.equityCard, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}>
                <Icon name="chart-line" size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.equityTitle, { color: colors.text }]}>How equity works</Text>
                  <Text style={[styles.equityDesc, { color: colors.textSecondary }]}>
                    Your equity % = your property value ÷ total community value. Rental income is distributed monthly, proportional to your equity.
                  </Text>
                </View>
                <Icon name="information" size={18} color={colors.textSecondary} />
              </View>
            </View>
          )}

          {activeTab === 'members' && (
            <View style={{ gap: Spacing.md }}>
              {memberships.map((m) => (
                <View key={m.id} style={[styles.memberRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.memberAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.memberAvatarText}>
                      {m.user?.first_name?.charAt(0) ?? '?'}{m.user?.last_name?.charAt(0) ?? ''}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.memberName, { color: colors.text }]}>{m.user?.first_name} {m.user?.last_name}</Text>
                    <Text style={[styles.memberRole, { color: colors.textSecondary }]}>{m.role} · {formatPercent(m.equity_percent)} equity</Text>
                  </View>
                  {m.user?.professional_title && (
                    <View style={[styles.proTag, { backgroundColor: `${colors.info}15`, borderColor: `${colors.info}40` }]}>
                      <Text style={[styles.proTagText, { color: colors.info }]}>{m.user.professional_title}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {activeTab === 'properties' && (
            <View style={styles.emptyTab}>
              <Icon name="city" size={40} color={colors.textDisabled} />
              <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>Community properties visible after joining</Text>
            </View>
          )}

          {activeTab === 'rules' && (
            <View style={styles.emptyTab}>
              <Icon name="file-document-outline" size={40} color={colors.textDisabled} />
              <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>Community rules are managed by members</Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      <View style={[styles.ctaContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {isMember ? (
          <View style={[styles.memberCta, { backgroundColor: `${colors.accent}10`, borderColor: `${colors.accent}30` }]}>
            <View style={styles.memberCtaLeft}>
              <Icon name="check-circle" size={20} color={colors.accent} />
              <Text style={[styles.memberCtaText, { color: colors.accent }]}>You're a member · {formatPercent(myMembership!.equity_percent)} equity</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Voting', { communityId })}>
              <Icon name="vote-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : availableRooms > 0 ? (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => navigation.navigate('ApplyCommunity', { communityId })}
          >
            <LinearGradient colors={[...colors.gradPrimary]} style={styles.joinBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {joinMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="home-plus-outline" size={20} color="#fff" />
                  <Text style={styles.joinBtnText}>Apply to Join</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.waitlistBtn, { borderColor: colors.primary }]}>
            <LinearGradient colors={['rgba(91,79,232,0.2)', 'rgba(91,79,232,0.2)']} style={styles.joinBtnGrad}>
              <Icon name="clock-time-four-outline" size={20} color={colors.primary} />
              <Text style={[styles.joinBtnText, { color: colors.primary }]}>Join Waiting List</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, height: 88, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.md, borderBottomWidth: 1 },
  stickyBackBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  stickyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, flex: 1, textAlign: 'center' },
  hero: { height: HEADER_HEIGHT },
  heroGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  heroBackBtn: { position: 'absolute', top: Spacing['4xl'], left: Spacing.xxl, width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  heroShareBtn: { position: 'absolute', top: Spacing['4xl'], right: Spacing.xxl, width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  titleSection: { paddingHorizontal: Spacing.xxl, marginTop: -Spacing.lg, gap: Spacing.md },
  titleRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  typeBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1 },
  typeBadgeText: { fontSize: FontSize.xs },
  openBadge: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1 },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  fullBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  fullText: { fontSize: FontSize.xs },
  communityName: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  locationRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  locationText: { fontSize: FontSize.sm },
  statsRow: { flexDirection: 'row', borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, marginTop: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  statLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1 },
  tabs: { paddingHorizontal: Spacing.xxl, gap: Spacing.sm, paddingVertical: Spacing.lg },
  tab: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1 },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabTextActive: { color: '#fff' },
  tabContent: { paddingHorizontal: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  descText: { fontSize: FontSize.sm, lineHeight: 22 },
  occupancyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  occupancyText: { fontSize: FontSize.sm },
  occupancyPct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1 },
  tagText: { fontSize: FontSize.xs },
  equityCard: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1 },
  equityTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 4 },
  equityDesc: { fontSize: FontSize.xs, lineHeight: 18 },
  memberRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  memberName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  memberRole: { fontSize: FontSize.xs },
  proTag: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, borderWidth: 1 },
  proTagText: { fontSize: 10 },
  emptyTab: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyTabText: { fontSize: FontSize.sm, textAlign: 'center' },
  ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.xxl, paddingBottom: 36, borderTopWidth: 1 },
  memberCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1 },
  memberCtaLeft: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  memberCtaText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  joinBtn: { overflow: 'hidden', borderRadius: BorderRadius.xl },
  waitlistBtn: { overflow: 'hidden', borderRadius: BorderRadius.xl, borderWidth: 1 },
  joinBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  joinBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
