import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@theme/index';
import { Community, Membership } from '@types/models';
import { COMMUNITY_TYPE_LABELS, formatCents, formatPercent } from '@utils/formatters';
import api from '@api/client';
import { useAuthStore } from '@store/authStore';
import { AppStackParams } from '@navigation/AppNavigator';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 300;
const SCROLL_THRESHOLD = HEADER_HEIGHT - 80;

type Tabs = 'overview' | 'members' | 'properties' | 'rules';

export default function CommunityDetailScreen() {
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const availableRooms = community.available_rooms ?? 0;
  const occupancyPct = (community.member_count / community.capacity) * 100;

  return (
    <View style={styles.container}>
      {/* Animated sticky header */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <LinearGradient colors={[Colors.bg, Colors.bg]} style={StyleSheet.absoluteFillObject} />
        <TouchableOpacity style={styles.stickyBackBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.stickyTitle} numberOfLines={1}>{community.name}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: heroOpacity }]}>
          <FastImage
            style={StyleSheet.absoluteFillObject}
            source={{ uri: community.cover_url ?? 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400', priority: FastImage.priority.high }}
            resizeMode={FastImage.resizeMode.cover}
          />
          <LinearGradient colors={['transparent', Colors.bg]} style={styles.heroGrad} />

          {/* Back btn */}
          <TouchableOpacity style={styles.heroBackBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.heroShareBtn}>
            <Icon name="share-variant" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Title section */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{COMMUNITY_TYPE_LABELS[community.type]}</Text>
            </View>
            {availableRooms > 0 ? (
              <View style={styles.openBadge}>
                <View style={styles.openDot} />
                <Text style={styles.openText}>Accepting members</Text>
              </View>
            ) : (
              <View style={styles.fullBadge}>
                <Text style={styles.fullText}>Full</Text>
              </View>
            )}
          </View>
          <Text style={styles.communityName}>{community.name}</Text>
          <View style={styles.locationRow}>
            <Icon name="map-marker" size={14} color={Colors.primary} />
            <Text style={styles.locationText}>{community.city}, {community.state}</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Icon name="account-group" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{community.member_count}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Icon name="door-open" size={20} color={Colors.accent} />
              <Text style={[styles.statValue, { color: availableRooms > 0 ? Colors.accent : Colors.textDisabled }]}>{availableRooms}</Text>
              <Text style={styles.statLabel}>Open rooms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Icon name="star" size={20} color={Colors.gold} />
              <Text style={styles.statValue}>{community.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Icon name="bank" size={20} color={Colors.info} />
              <Text style={styles.statValue}>{formatCents(community.fund_balance_cents ?? 0)}</Text>
              <Text style={styles.statLabel}>Fund</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {(['overview', 'members', 'properties', 'rules'] as Tabs[]).map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
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
                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.descText}>{community.description}</Text>
                </View>
              )}

              {/* Occupancy */}
              <View>
                <Text style={styles.sectionTitle}>Occupancy</Text>
                <View style={styles.occupancyRow}>
                  <Text style={styles.occupancyText}>{community.member_count} / {community.capacity} members</Text>
                  <Text style={styles.occupancyPct}>{occupancyPct.toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(occupancyPct, 100)}%` as any }]} />
                </View>
              </View>

              {/* Lifestyle tags */}
              {community.lifestyle_tags && community.lifestyle_tags.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>Lifestyle</Text>
                  <View style={styles.tagRow}>
                    {community.lifestyle_tags.map((tag, i) => (
                      <View key={i} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                    ))}
                  </View>
                </View>
              )}

              {/* Equity preview */}
              <View style={styles.equityCard}>
                <Icon name="chart-pie" size={24} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.equityTitle}>How equity works</Text>
                  <Text style={styles.equityDesc}>
                    Your equity % = your property value ÷ total community value. Rental income is distributed monthly, proportional to your equity.
                  </Text>
                </View>
                <Icon name="information-outline" size={18} color={Colors.textSecondary} />
              </View>
            </View>
          )}

          {activeTab === 'members' && (
            <View style={{ gap: Spacing.md }}>
              {memberships.map((m) => (
                <View key={m.id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {m.user?.first_name?.charAt(0) ?? '?'}{m.user?.last_name?.charAt(0) ?? ''}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{m.user?.first_name} {m.user?.last_name}</Text>
                    <Text style={styles.memberRole}>{m.role} · {formatPercent(m.equity_percent)} equity</Text>
                  </View>
                  {m.user?.professional_title && (
                    <View style={styles.proTag}>
                      <Text style={styles.proTagText}>{m.user.professional_title}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {activeTab === 'properties' && (
            <View style={styles.emptyTab}>
              <Icon name="home-city" size={40} color={Colors.textDisabled} />
              <Text style={styles.emptyTabText}>Community properties visible after joining</Text>
            </View>
          )}

          {activeTab === 'rules' && (
            <View style={styles.emptyTab}>
              <Icon name="file-document-outline" size={40} color={Colors.textDisabled} />
              <Text style={styles.emptyTabText}>Community rules are managed by members</Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        {isMember ? (
          <View style={styles.memberCta}>
            <View style={styles.memberCtaLeft}>
              <Icon name="check-circle" size={20} color={Colors.accent} />
              <Text style={styles.memberCtaText}>You're a member · {formatPercent(myMembership!.equity_percent)} equity</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Voting', { communityId })}>
              <Icon name="vote-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ) : availableRooms > 0 ? (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => navigation.navigate('ApplyCommunity', { communityId })}
          >
            <LinearGradient colors={Colors.gradPrimary} style={styles.joinBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {joinMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="home-plus" size={20} color="#fff" />
                  <Text style={styles.joinBtnText}>Apply to Join</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.waitlistBtn}>
            <LinearGradient colors={['rgba(91,79,232,0.2)', 'rgba(91,79,232,0.2)']} style={styles.joinBtnGrad}>
              <Icon name="clock-outline" size={20} color={Colors.primary} />
              <Text style={[styles.joinBtnText, { color: Colors.primary }]}>Join Waiting List</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, height: 88, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  stickyBackBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  stickyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, flex: 1, textAlign: 'center' },
  hero: { height: HEADER_HEIGHT },
  heroGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  heroBackBtn: { position: 'absolute', top: Spacing['4xl'], left: Spacing.xxl, width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  heroShareBtn: { position: 'absolute', top: Spacing['4xl'], right: Spacing.xxl, width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  titleSection: { paddingHorizontal: Spacing.xxl, marginTop: -Spacing.lg, gap: Spacing.md },
  titleRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  typeBadge: { backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  typeBadgeText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  openBadge: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: `${Colors.accent}15`, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.accent },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  openText: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: FontWeight.semibold },
  fullBadge: { backgroundColor: `${Colors.textDisabled}15`, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  fullText: { fontSize: FontSize.xs, color: Colors.textDisabled },
  communityName: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.text },
  locationRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  locationText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  statLabel: { fontSize: 9, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  tabs: { paddingHorizontal: Spacing.xxl, gap: Spacing.sm, paddingVertical: Spacing.lg },
  tab: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive: { color: '#fff' },
  tabContent: { paddingHorizontal: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  descText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
  occupancyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  occupancyText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  occupancyPct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  progressBar: { height: 6, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  tagText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  equityCard: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', backgroundColor: `${Colors.primary}10`, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: `${Colors.primary}30` },
  equityTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 4 },
  equityDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  memberRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  memberName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  memberRole: { fontSize: FontSize.xs, color: Colors.textSecondary },
  proTag: { backgroundColor: `${Colors.info}15`, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: `${Colors.info}40` },
  proTagText: { fontSize: 10, color: Colors.info },
  emptyTab: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyTabText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.xxl, paddingBottom: 36, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border },
  memberCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: `${Colors.accent}10`, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: `${Colors.accent}30` },
  memberCtaLeft: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  memberCtaText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold },
  joinBtn: { overflow: 'hidden', borderRadius: BorderRadius.xl },
  waitlistBtn: { overflow: 'hidden', borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.primary },
  joinBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  joinBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
