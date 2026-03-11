import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import Geolocation from '@react-native-community/geolocation';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { Community, Property } from '@/types/models';
import { formatCents, COMMUNITY_TYPE_LABELS } from '@utils/formatters';
import api from '@api/client';
import { AppStackParams } from '@navigation/AppNavigator';

const { width } = Dimensions.get('window');

// ── API hooks (take lat/lng from args) ────────────────────────────────────────

function useNearbyProperties(lat: number | null, lng: number | null) {
  return useQuery<Property[]>({
    queryKey: ['properties', 'nearby', lat, lng],
    queryFn: async () => {
      if (lat == null || lng == null) return [];
      const url = `/properties?lat=${lat}&lng=${lng}&radius=50&page=1&limit=10`;
      const { data } = await api.get(url);
      const list = data.data ?? [];
      if (__DEV__) console.log('[HOME] Properties response:', list?.length ?? 0, list);
      return list;
    },
    enabled: lat != null && lng != null,
    staleTime: 2 * 60 * 1000,
  });
}

function useNearbyCommunities(lat: number | null, lng: number | null) {
  return useQuery<Community[]>({
    queryKey: ['communities', 'nearby', lat, lng],
    queryFn: async () => {
      if (lat == null || lng == null) return [];
      const url = `/communities?lat=${lat}&lng=${lng}&radius=50&page=1&limit=10`;
      const { data } = await api.get(url);
      const list = data.data ?? [];
      if (__DEV__) console.log('[HOME] Communities response:', list?.length ?? 0, list);
      return list;
    },
    enabled: lat != null && lng != null,
    staleTime: 2 * 60 * 1000,
  });
}

const useMyCommunities = () =>
  useQuery<Community[]>({
    queryKey: ['communities', 'mine'],
    queryFn: async () => {
      const { data } = await api.get('/communities?mine=true');
      return data.data ?? [];
    },
    staleTime: 60 * 1000,
  });

// ── Subcomponents ─────────────────────────────────────────────────────────────

function EarningsBanner({
  totalEarnings,
  onPress,
}: {
  totalEarnings: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.earningsBannerWrap}
    >
      <LinearGradient colors={[...colors.gradPrimary]} style={styles.earningsBanner}>
        <View>
          <Text style={styles.earningsLabel}>Your total earnings</Text>
          <Text style={styles.earningsValue}>{formatCents(totalEarnings)}</Text>
          <View style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>View all transactions →</Text>
          </View>
        </View>
        <Icon name="trending-up" size={36} color="rgba(255,255,255,0.4)" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

function PropertyCard({ property, onPress }: { property: Property; onPress: () => void }) {
  const { colors } = useTheme();
  const price = (property as any).price ?? property.estimated_value_cents;
  return (
    <TouchableOpacity style={[styles.propertyCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.propertyImagePlaceholder, { backgroundColor: colors.surfaceSecondary }]}>
        <Icon name="home" size={32} color={colors.textTertiary} />
      </View>
      <Text style={[styles.propertyTitle, { color: colors.text }]} numberOfLines={1}>{property.title}</Text>
      <Text style={[styles.propertyPrice, { color: colors.primary }]}>{formatCents(typeof price === 'number' ? price * 100 : price ?? 0)}/mo</Text>
      <Text style={[styles.propertyLocation, { color: colors.textSecondary }]} numberOfLines={1}>
        <Icon name="map-marker-outline" size={12} color={colors.textSecondary} /> {(property as any).address || property.address || '—'}
      </Text>
    </TouchableOpacity>
  );
}

function CommunityCard({
  community,
  onPress,
}: {
  community: Community;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const availableRooms = community.available_rooms ?? 0;
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.8}>
      <FastImage
        style={styles.cardImage}
        source={{
          uri: community.cover_url ?? 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
          priority: FastImage.priority.normal,
        }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <LinearGradient colors={[...colors.gradOverlay]} style={styles.cardGradient} />
      <View style={[styles.typeBadge, { borderColor: colors.border }]}>
        <Text style={[styles.typeBadgeText, { color: colors.text }]}>{COMMUNITY_TYPE_LABELS[community.type]}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>{community.name}</Text>
        <Text style={styles.cardLocation}>
          <Icon name="map-marker-outline" size={12} color={colors.textSecondary} />
          {' '}{community.city}, {community.state}
        </Text>
        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <Icon name="account-group-outline" size={14} color={colors.primary} />
            <Text style={[styles.cardStatText, { color: colors.textSecondary }]}>{community.member_count}/{community.capacity}</Text>
          </View>
          <View style={styles.cardStat}>
            <Icon name="door-open" size={14} color={availableRooms > 0 ? colors.accent : colors.textDisabled} />
            <Text style={[styles.cardStatText, { color: availableRooms > 0 ? colors.accent : colors.textDisabled }]}>
              {availableRooms} rooms
            </Text>
          </View>
          <View style={styles.cardStat}>
            <Icon name="star" size={14} color={colors.gold} />
            <Text style={[styles.cardStatText, { color: colors.textSecondary }]}>{(community.rating ?? 0).toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function QuickAction({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const { user } = useAuthStore();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    Geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted) return;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (__DEV__) console.log('[HOME] GPS:', lat, lng);
        setCoords({ lat, lng });
      },
      (error) => {
        if (isMounted && __DEV__) console.warn('[HOME] GPS error:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
    return () => { isMounted = false; };
  }, []);

  const { data: nearbyProperties = [], isLoading: propertiesLoading, isError: propertiesError, refetch: refetchProperties } = useNearbyProperties(coords?.lat ?? null, coords?.lng ?? null);
  const { data: nearbyCommunities = [], isLoading: communitiesLoading, isError: communitiesError, refetch: refetchCommunities } = useNearbyCommunities(coords?.lat ?? null, coords?.lng ?? null);
  const { data: mine = [], isLoading: _mineLoading } = useMyCommunities();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProperties(), refetchCommunities()]);
    setRefreshing(false);
  }, [refetchProperties, refetchCommunities]);

  const totalEarnings = mine.reduce((acc, c) => acc + (c.total_earnings_cents ?? 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good morning 👋</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.first_name ?? 'Welcome'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={[styles.notifBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Icon name="bell-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <EarningsBanner
          totalEarnings={totalEarnings}
          onPress={() => navigation.navigate('Savings')}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick actions</Text>
          <View style={styles.quickActions}>
            <QuickAction
              icon="home-plus-outline"
              label="Add Property"
              color={colors.primary}
              onPress={() => navigation.navigate('AddProperty')}
            />
            <QuickAction
              icon="map-search-outline"
              label="Find Community"
              color={colors.accent}
              onPress={() =>
                navigation.navigate('Tabs', {
                  screen: 'Communities',
                  params: { autoFocusSearch: true },
                })
              }
            />
            <QuickAction
              icon="vote-outline"
              label="Active Votes"
              color={colors.gold}
              onPress={() =>
                mine.length > 0
                  ? navigation.navigate('Voting', { communityId: String(mine[0].id) })
                  : navigation.navigate('Tabs', { screen: 'Communities' })
              }
            />
            <QuickAction
              icon="swap-horizontal-bold"
              label="Transfer"
              color={colors.info}
              onPress={() => (navigation as any).navigate('Transfer')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Properties</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Tabs', { screen: 'Map' })}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
            </TouchableOpacity>
          </View>
          {propertiesLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading properties…</Text>
            </View>
          )}
          {!propertiesLoading && propertiesError && (
            <View style={styles.errorRow}>
              <Text style={[styles.errorText, { color: colors.error }]}>Could not load properties</Text>
              <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetchProperties()}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {!propertiesLoading && !propertiesError && nearbyProperties.length > 0 && (
            <FlatList
              horizontal
              data={nearbyProperties}
              keyExtractor={(item) => item.id.toString()}
              removeClippedSubviews={true}
              maxToRenderPerBatch={6}
              windowSize={3}
              initialNumToRender={3}
              renderItem={({ item }) => (
                <PropertyCard
                  property={item}
                  onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              ItemSeparatorComponent={() => <View style={{ width: Spacing.md }} />}
            />
          )}
          {!propertiesLoading && !propertiesError && nearbyProperties.length === 0 && coords != null && (
            <View style={styles.emptyRow}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Be the first to add a property 🏠</Text>
              <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddProperty')}>
                <Text style={styles.emptyBtnText}>Add Property</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Communities Near You</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Tabs', { screen: 'Map' })}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
            </TouchableOpacity>
          </View>
          {communitiesLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading communities…</Text>
            </View>
          )}
          {!communitiesLoading && communitiesError && (
            <View style={styles.errorRow}>
              <Text style={[styles.errorText, { color: colors.error }]}>Could not load communities</Text>
              <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetchCommunities()}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {!communitiesLoading && !communitiesError && nearbyCommunities.length > 0 && (
            <FlatList
              horizontal
              data={nearbyCommunities}
              keyExtractor={(item) => item.id.toString()}
              removeClippedSubviews={true}
              maxToRenderPerBatch={6}
              windowSize={3}
              initialNumToRender={3}
              renderItem={({ item }) => (
                <CommunityCard
                  community={item}
                  onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              ItemSeparatorComponent={() => <View style={{ width: Spacing.md }} />}
            />
          )}
          {!communitiesLoading && !communitiesError && nearbyCommunities.length === 0 && coords != null && (
            <View style={styles.emptyRow}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No communities nearby yet</Text>
              <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('CreateCommunity')}>
                <Text style={styles.emptyBtnText}>Create Community</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {mine.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>My communities</Text>
            </View>
            <FlatList
              horizontal
              data={mine}
              keyExtractor={(item) => item.id.toString()}
              removeClippedSubviews={true}
              maxToRenderPerBatch={6}
              windowSize={3}
              initialNumToRender={3}
              renderItem={({ item }) => (
                <CommunityCard
                  community={item}
                  onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              ItemSeparatorComponent={() => <View style={{ width: Spacing.md }} />}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default React.memo(HomeScreen);

const CARD_WIDTH = width * 0.72;
const PROPERTY_CARD_WIDTH = 160;
const PROPERTY_CARD_HEIGHT = 200;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.lg,
  },
  greeting: { fontSize: FontSize.sm, marginTop: 2 },
  userName: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, marginTop: 2 },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  earningsBannerWrap: {
    marginHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  earningsBanner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, marginBottom: 4 },
  earningsValue: { color: '#fff', fontSize: FontSize['3xl'], fontWeight: FontWeight.bold },
  viewAllRow: { marginTop: 8 },
  viewAllText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  section: { marginBottom: Spacing.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  seeAll: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  quickActions: { flexDirection: 'row', paddingHorizontal: Spacing.xxl, gap: Spacing.md },
  quickAction: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  quickActionIcon: { width: 52, height: 52, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 10, textAlign: 'center', fontWeight: FontWeight.medium },
  horizontalList: { paddingHorizontal: Spacing.xxl },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg },
  loadingText: { fontSize: FontSize.sm },
  errorRow: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg },
  errorText: { fontSize: FontSize.sm, marginBottom: Spacing.sm },
  retryBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md },
  retryBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  emptyRow: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: FontSize.base, marginBottom: Spacing.md },
  emptyBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.md },
  emptyBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  propertyCard: {
    width: PROPERTY_CARD_WIDTH,
    height: PROPERTY_CARD_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...Shadows.sm,
  },
  propertyImagePlaceholder: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, paddingHorizontal: Spacing.sm, paddingTop: Spacing.xs },
  propertyPrice: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, paddingHorizontal: Spacing.sm },
  propertyLocation: { fontSize: FontSize.xs, paddingHorizontal: Spacing.sm, paddingTop: 2 },
  card: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  cardImage: { ...StyleSheet.absoluteFillObject },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  typeBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
  },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md },
  cardName: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 4 },
  cardLocation: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, marginBottom: Spacing.sm },
  cardStats: { flexDirection: 'row', gap: Spacing.md },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: FontSize.xs },
});
