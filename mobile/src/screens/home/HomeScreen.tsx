import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { Community } from '@types/models';
import { formatCents, COMMUNITY_TYPE_LABELS } from '@utils/formatters';
import api from '@api/client';
import { AppStackParams } from '@navigation/AppNavigator';

const { width } = Dimensions.get('window');

// ── API hooks ─────────────────────────────────────────────────────────────────

const useNearbyCommunities = () =>
  useQuery<Community[]>({
    queryKey: ['communities', 'nearby'],
    queryFn: async () => {
      const { data } = await api.get('/communities/nearby?lat=34.0522&lng=-118.2437&radius=50');
      return data.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

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

function EarningsBanner({ totalEarnings }: { totalEarnings: number }) {
  return (
    <LinearGradient colors={Colors.gradPrimary} style={styles.earningsBanner}>
      <View>
        <Text style={styles.earningsLabel}>Your total earnings</Text>
        <Text style={styles.earningsValue}>{formatCents(totalEarnings)}</Text>
      </View>
      <Icon name="trending-up" size={36} color="rgba(255,255,255,0.4)" />
    </LinearGradient>
  );
}

function CommunityCard({
  community,
  onPress,
}: {
  community: Community;
  onPress: () => void;
}) {
  const availableRooms = community.available_rooms;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Cover image */}
      <FastImage
        style={styles.cardImage}
        source={{
          uri: community.cover_url ?? 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
          priority: FastImage.priority.normal,
        }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <LinearGradient colors={Colors.gradOverlay} style={styles.cardGradient} />

      {/* Type badge */}
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{COMMUNITY_TYPE_LABELS[community.type]}</Text>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>{community.name}</Text>
        <Text style={styles.cardLocation}>
          <Icon name="map-marker-outline" size={12} color={Colors.textSecondary} />
          {' '}{community.city}, {community.state}
        </Text>
        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <Icon name="account-group-outline" size={14} color={Colors.primary} />
            <Text style={styles.cardStatText}>{community.member_count}/{community.capacity}</Text>
          </View>
          <View style={styles.cardStat}>
            <Icon name="door-open" size={14} color={availableRooms > 0 ? Colors.accent : Colors.textDisabled} />
            <Text style={[styles.cardStatText, { color: availableRooms > 0 ? Colors.accent : Colors.textDisabled }]}>
              {availableRooms} rooms
            </Text>
          </View>
          <View style={styles.cardStat}>
            <Icon name="star" size={14} color={Colors.gold} />
            <Text style={styles.cardStatText}>{community.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function QuickAction({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const { user } = useAuthStore();
  const { data: nearby = [], isLoading: nearbyLoading, refetch } = useNearbyCommunities();
  const { data: mine = [], isLoading: mineLoading } = useMyCommunities();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const totalEarnings = mine.reduce((acc, c) => acc + (c.total_earnings_cents ?? 0), 0);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.userName}>{user?.first_name ?? 'Welcome'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notifBtn}
          >
            <Icon name="bell-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Earnings banner */}
        <EarningsBanner totalEarnings={totalEarnings} />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickActions}>
            <QuickAction
              icon="home-plus-outline"
              label="Add Property"
              color={Colors.primary}
              onPress={() => navigation.navigate('CreateCommunity')}
            />
            <QuickAction
              icon="map-search-outline"
              label="Find Community"
              color={Colors.accent}
              onPress={() => navigation.navigate('Communities' as any)}
            />
            <QuickAction
              icon="vote-outline"
              label="Active Votes"
              color={Colors.gold}
              onPress={() => mine[0] && navigation.navigate('Voting', { communityId: mine[0].id })}
            />
            <QuickAction
              icon="swap-horizontal"
              label="Transfer"
              color={Colors.info}
              onPress={() => mine[0] && navigation.navigate('Transfer', { fromCommunityId: mine[0].id })}
            />
          </View>
        </View>

        {/* My communities */}
        {mine.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My communities</Text>
            </View>
            <FlatList
              horizontal
              data={mine}
              keyExtractor={(item) => item.id}
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

        {/* Discover nearby */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discover nearby</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Map' as any)}>
              <Text style={styles.seeAll}>View map</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={nearby}
            keyExtractor={(item) => item.id}
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
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = width * 0.72;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.lg,
  },
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary },
  userName: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.text, marginTop: 2 },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  earningsBanner: {
    marginHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  earningsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, marginBottom: 4 },
  earningsValue: { color: '#fff', fontSize: FontSize['3xl'], fontWeight: FontWeight.bold },
  section: { marginBottom: Spacing.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  seeAll: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  quickActions: { flexDirection: 'row', paddingHorizontal: Spacing.xxl, gap: Spacing.md },
  quickAction: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  quickActionIcon: { width: 52, height: 52, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', fontWeight: FontWeight.medium },
  horizontalList: { paddingHorizontal: Spacing.xxl },
  card: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
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
    borderColor: Colors.border,
  },
  typeBadgeText: { color: Colors.text, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md },
  cardName: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 4 },
  cardLocation: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, marginBottom: Spacing.sm },
  cardStats: { flexDirection: 'row', gap: Spacing.md },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { color: Colors.textSecondary, fontSize: FontSize.xs },
});
