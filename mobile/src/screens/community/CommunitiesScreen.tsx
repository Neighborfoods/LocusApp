import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { AppTextInput } from '@components/AppTextInput';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabParams } from '@navigation/AppNavigator';
import { useInfiniteQuery } from '@tanstack/react-query';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@theme/index';
import { Community } from '@/types/models';
import { COMMUNITY_TYPE_LABELS } from '@utils/formatters';
import api from '@api/client';
import { AppStackParams } from '@navigation/AppNavigator';

type SortOption = 'rating' | 'member_count' | 'available_rooms' | 'created_at';
type TypeFilter = 'all' | 'urban' | 'suburban' | 'rural' | 'resort' | 'commercial';

const TYPE_FILTERS: { value: TypeFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: 'apps' },
  { value: 'urban', label: 'Urban', icon: 'city' },
  { value: 'suburban', label: 'Suburban', icon: 'city' },
  { value: 'rural', label: 'Rural', icon: 'tree' },
  { value: 'resort', label: 'Resort', icon: 'umbrella-beach' },
];

function CommunityListCard({ community, onPress }: { community: Community; onPress: () => void }) {
  const { colors } = useTheme();
  const availableRooms = community.available_rooms ?? 0;
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.8}>
      <FastImage
        style={styles.cardImage}
        source={{ uri: community.cover_url ?? 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400', priority: FastImage.priority.normal }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.cardGrad} />

      <View style={styles.cardTopRow}>
        <View style={[styles.typeBadge, { borderColor: colors.border }]}>
          <Text style={[styles.typeBadgeText, { color: colors.text }]}>{COMMUNITY_TYPE_LABELS[community.type]}</Text>
        </View>
        {availableRooms > 0 && (
          <View style={[styles.availBadge, { backgroundColor: `${colors.accent}20`, borderColor: colors.accent }]}>
            <Icon name="door-open" size={12} color={colors.accent} />
            <Text style={[styles.availText, { color: colors.accent }]}>{availableRooms} open</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.cardName} numberOfLines={1}>{community.name}</Text>
        <Text style={styles.cardLocation}>
          <Icon name="map-marker-outline" size={12} color={colors.textSecondary} />
          {'  '}{community.city}, {community.state}
        </Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaChip}>
            <Icon name="account-group-outline" size={14} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{community.member_count}/{community.capacity}</Text>
          </View>
          <View style={styles.metaChip}>
            <Icon name="star" size={14} color={colors.gold} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{community.rating.toFixed(1)}</Text>
          </View>
          {community.lifestyle_tags && community.lifestyle_tags.length > 0 && (
            <View style={styles.metaChip}>
              <Icon name="dots-vertical" size={12} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{community.lifestyle_tags[0]}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CommunitiesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const route = useRoute<RouteProp<TabParams, 'Communities'>>();
  const autoFocusSearch = route.params?.autoFocusSearch;
  const searchInputRef = useRef<TextInput>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<SortOption>('rating');
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoFocusSearch) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [autoFocusSearch]);

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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Communities</Text>
        <TouchableOpacity style={[styles.mapBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => (navigation as any).navigate('Tabs', { screen: 'Map' })}>
          <Icon name="map-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="magnify" size={20} color={colors.textSecondary} />
          <AppTextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={handleSearch}
            placeholder="Search communities, cities..."
            placeholderTextColor={colors.textDisabled}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
              <Icon name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View>
        <FlatList
          horizontal
          data={TYPE_FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.typeFilterList}
          renderItem={({ item }) => {
            const active = typeFilter === item.value;
            return (
              <TouchableOpacity
                style={[styles.typePill, { backgroundColor: colors.surface, borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setTypeFilter(item.value)}
              >
                <Icon name={item.icon} size={14} color={active ? colors.textOnPrimary : colors.textSecondary} />
                <Text style={[styles.typePillText, { color: colors.textSecondary }, active && styles.typePillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View style={styles.sortRow}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>{communities.length} communities</Text>
        <TouchableOpacity
          style={[styles.sortBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            const opts: SortOption[] = ['rating', 'member_count', 'available_rooms', 'created_at'];
            const idx = opts.indexOf(sort);
            setSort(opts[(idx + 1) % opts.length]);
          }}
        >
          <Icon name="filter-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.sortText, { color: colors.text }]}>
            {sort === 'rating' ? 'Top rated' : sort === 'member_count' ? 'Largest' : sort === 'available_rooms' ? 'Most open' : 'Newest'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={communities}
          keyExtractor={(item) => item.id.toString()}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <CommunityListCard
              community={item}
              onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
          windowSize={5}
          initialNumToRender={6}
          updateCellsBatchingPeriod={50}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="magnify" size={48} color={colors.textDisabled} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No communities nearby</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Be the first to create one!</Text>
            </View>
          }
        />
      )}
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingTop: Spacing['4xl'], paddingBottom: Spacing.lg },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  mapBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  searchRow: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  searchInput: { flex: 1, fontSize: FontSize.md, textTransform: 'none' },
  typeFilterList: { paddingHorizontal: Spacing.xxl, gap: Spacing.sm, paddingBottom: Spacing.md },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1 },
  typePillText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  typePillTextActive: { color: '#fff' },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  countText: { fontSize: FontSize.sm },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1 },
  sortText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  listContent: { paddingHorizontal: Spacing.xxl, gap: Spacing.lg, paddingBottom: 100 },
  card: { height: 200, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.md },
  cardImage: { ...StyleSheet.absoluteFillObject },
  cardGrad: { ...StyleSheet.absoluteFillObject },
  cardTopRow: { position: 'absolute', top: Spacing.md, left: Spacing.md, right: Spacing.md, flexDirection: 'row', gap: Spacing.sm },
  typeBadge: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  typeBadgeText: { fontSize: FontSize.xs },
  availBadge: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  availText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  cardBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, gap: 4 },
  cardName: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  cardLocation: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs },
  cardMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  metaChip: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  metaText: { fontSize: FontSize.xs },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  emptySubtitle: { fontSize: FontSize.sm },
});
