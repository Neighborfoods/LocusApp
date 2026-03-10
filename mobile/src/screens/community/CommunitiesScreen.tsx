import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { AppTextInput } from '@components/AppTextInput';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@theme/index';
import { Community } from '@types/models';
import { COMMUNITY_TYPE_LABELS, formatCents } from '@utils/formatters';
import api from '@api/client';
import { AppStackParams } from '@navigation/AppNavigator';

type SortOption = 'rating' | 'member_count' | 'available_rooms' | 'created_at';
type TypeFilter = 'all' | 'urban' | 'suburban' | 'rural' | 'resort' | 'commercial';

const TYPE_FILTERS: { value: TypeFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: 'apps' },
  { value: 'urban', label: 'Urban', icon: 'city' },
  { value: 'suburban', label: 'Suburban', icon: 'home-city' },
  { value: 'rural', label: 'Rural', icon: 'tree' },
  { value: 'resort', label: 'Resort', icon: 'umbrella-beach' },
];

function CommunityListCard({ community, onPress }: { community: Community; onPress: () => void }) {
  const availableRooms = community.available_rooms ?? 0;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Image */}
      <FastImage
        style={styles.cardImage}
        source={{ uri: community.cover_url ?? 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400', priority: FastImage.priority.normal }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.cardGrad} />

      {/* Top badges */}
      <View style={styles.cardTopRow}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{COMMUNITY_TYPE_LABELS[community.type]}</Text>
        </View>
        {availableRooms > 0 && (
          <View style={styles.availBadge}>
            <Icon name="door-open" size={12} color={Colors.accent} />
            <Text style={styles.availText}>{availableRooms} open</Text>
          </View>
        )}
      </View>

      {/* Bottom content */}
      <View style={styles.cardBottom}>
        <Text style={styles.cardName} numberOfLines={1}>{community.name}</Text>
        <Text style={styles.cardLocation}>
          <Icon name="map-marker-outline" size={12} color={Colors.textSecondary} />
          {'  '}{community.city}, {community.state}
        </Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaChip}>
            <Icon name="account-group-outline" size={14} color={Colors.primary} />
            <Text style={styles.metaText}>{community.member_count}/{community.capacity}</Text>
          </View>
          <View style={styles.metaChip}>
            <Icon name="star" size={14} color={Colors.gold} />
            <Text style={styles.metaText}>{community.rating.toFixed(1)}</Text>
          </View>
          {community.lifestyle_tags && community.lifestyle_tags.length > 0 && (
            <View style={styles.metaChip}>
              <Icon name="tag" size={12} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{community.lifestyle_tags[0]}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CommunitiesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<SortOption>('rating');
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(text), 400);
  };

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching,
  } = useInfiniteQuery({
    queryKey: ['communities', 'list', debouncedSearch, typeFilter, sort],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: '15',
        sort,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
      });
      const { data: res } = await api.get(`/communities?${params}`);
      return res;
    },
    getNextPageParam: (last) =>
      last.meta?.page < last.meta?.total_pages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
  });

  const communities: Community[] = data?.pages.flatMap((p) => p.data ?? []) ?? [];

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communities</Text>
        <TouchableOpacity style={styles.mapBtn} onPress={() => navigation.navigate('Map' as any)}>
          <Icon name="map-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={20} color={Colors.textSecondary} />
          <AppTextInput
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearch}
            placeholder="Search communities, cities..."
            placeholderTextColor={Colors.textDisabled}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
              <Icon name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Type filters */}
      <View>
        <FlatList
          horizontal
          data={TYPE_FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeFilterList}
          renderItem={({ item }) => {
            const active = typeFilter === item.value;
            return (
              <TouchableOpacity
                style={[styles.typePill, active && styles.typePillActive]}
                onPress={() => setTypeFilter(item.value)}
              >
                <Icon name={item.icon} size={14} color={active ? '#fff' : Colors.textSecondary} />
                <Text style={[styles.typePillText, active && styles.typePillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Sort row */}
      <View style={styles.sortRow}>
        <Text style={styles.countText}>{communities.length} communities</Text>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => {
            const opts: SortOption[] = ['rating', 'member_count', 'available_rooms', 'created_at'];
            const idx = opts.indexOf(sort);
            setSort(opts[(idx + 1) % opts.length]);
          }}
        >
          <Icon name="sort" size={16} color={Colors.textSecondary} />
          <Text style={styles.sortText}>
            {sort === 'rating' ? 'Top rated' : sort === 'member_count' ? 'Largest' : sort === 'available_rooms' ? 'Most open' : 'Newest'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={communities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommunityListCard
              community={item}
              onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="home-search" size={48} color={Colors.textDisabled} />
              <Text style={styles.emptyTitle}>No communities found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filters or search</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingTop: Spacing['4xl'], paddingBottom: Spacing.lg },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.text },
  mapBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  searchRow: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  searchInput: { flex: 1, color: Colors.text, fontSize: FontSize.md, textTransform: 'none' },
  typeFilterList: { paddingHorizontal: Spacing.xxl, gap: Spacing.sm, paddingBottom: Spacing.md },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  typePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typePillText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  typePillTextActive: { color: '#fff' },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  countText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  sortText: { fontSize: FontSize.xs, color: Colors.text, fontWeight: FontWeight.medium },
  listContent: { paddingHorizontal: Spacing.xxl, gap: Spacing.lg, paddingBottom: 100 },
  card: { height: 200, borderRadius: BorderRadius.xl, overflow: 'hidden', backgroundColor: Colors.surface, ...Shadows.md },
  cardImage: { ...StyleSheet.absoluteFillObject },
  cardGrad: { ...StyleSheet.absoluteFillObject },
  cardTopRow: { position: 'absolute', top: Spacing.md, left: Spacing.md, right: Spacing.md, flexDirection: 'row', gap: Spacing.sm },
  typeBadge: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  typeBadgeText: { color: Colors.text, fontSize: FontSize.xs },
  availBadge: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: `${Colors.accent}20`, paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.accent },
  availText: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  cardBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, gap: 4 },
  cardName: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  cardLocation: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs },
  cardMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  metaChip: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  metaText: { color: Colors.textSecondary, fontSize: FontSize.xs },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
