import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
  TextInput,
  Keyboard,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { CommunityMapPin, PropertyMapPin } from '@/types/models';
import api from '@api/client';
import { formatCents, COMMUNITY_TYPE_LABELS } from '@utils/formatters';
import { AppStackParams } from '@navigation/AppNavigator';
import Geolocation from '@react-native-community/geolocation';
import { GeocodingService, type GeocodingResult } from '../../services/GeocodingService';
import FilterBottomSheet, { type FilterBottomSheetRef } from '../../components/map/FilterBottomSheet';
import { MapFilters, DEFAULT_FILTERS } from '../../types/filters';

const DEFAULT_DELTA = 0.05;
const INITIAL_REGION: Region = {
  latitude: 34.0522,
  longitude: -118.2437,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};


type FilterType = 'all' | 'communities' | 'properties';

// ── Pin components ─────────────────────────────────────────────────────────────

function CommunityPin({ pin, onPress }: { pin: CommunityMapPin; onPress: () => void }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, damping: 15 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 15 }),
    ]).start();
    onPress();
  };
  return (
    <Marker coordinate={{ latitude: pin.latitude, longitude: pin.longitude }} onPress={handlePress}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.communityPin} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Icon name="account-group" size={14} color="#fff" />
          <Text style={styles.pinText}>{pin.member_count}</Text>
        </LinearGradient>
        <View style={[styles.pinTail, { borderTopColor: colors.primary }]} />
      </Animated.View>
    </Marker>
  );
}

function PropertyPin({ pin, onPress }: { pin: PropertyMapPin; onPress: () => void }) {
  const colors = pin.is_available
    ? ['#00C896', '#00A07A'] as [string, string]
    : ['#FF4757', '#CC3844'] as [string, string];
  return (
    <Marker coordinate={{ latitude: pin.latitude, longitude: pin.longitude }} onPress={onPress}>
      <View>
        <LinearGradient colors={colors} style={[styles.communityPin, { minWidth: 60 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Icon name="home" size={12} color="#fff" />
          <Text style={styles.pinText}>{formatCents(pin.rent_cents_per_month ?? 0)}/mo</Text>
        </LinearGradient>
        <View style={[styles.pinTail, { borderTopColor: pin.is_available ? '#00A07A' : '#CC3844' }]} />
      </View>
    </Marker>
  );
}

// ── Selected community card ────────────────────────────────────────────────────

function CommunityPreviewCard({ pin, onTap }: { pin: CommunityMapPin; onTap: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.previewCard} onPress={onTap} activeOpacity={0.9}>
      <FastImage
        style={styles.previewImage}
        source={{ uri: pin.cover_url ?? 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400', priority: FastImage.priority.normal }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.previewContent}>
        <View style={styles.previewBadge}>
          <Text style={[styles.previewBadgeText, { color: colors.textSecondary }]}>{COMMUNITY_TYPE_LABELS[pin.type]}</Text>
        </View>
        <Text style={styles.previewName}>{pin.name}</Text>
        <View style={styles.previewStats}>
          <Icon name="account-group" size={14} color={colors.textSecondary} />
          <Text style={[styles.previewStat, { color: colors.textSecondary }]}>{pin.member_count} members</Text>
          <View style={[styles.previewDot, { backgroundColor: colors.border }]} />
          <Icon name="star" size={14} color={colors.warning} />
          <Text style={[styles.previewStat, { color: colors.textSecondary }]}>{pin.rating.toFixed(1)}</Text>
        </View>
        <View style={styles.previewCta}>
          <Text style={[styles.previewCtaText, { color: colors.primary }]}>View Community</Text>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const [filter, setFilter] = useState<FilterType>('all');

  const layoutStyles = useMemo(
    () => ({
      topBar: {
        position: 'absolute' as const,
        top: insets.top + 8,
        left: 16,
        right: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 11,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 10,
      },
      filterRow: {
        position: 'absolute' as const,
        top: insets.top + 76,
        left: 16,
        right: 16,
        flexDirection: 'row' as const,
        gap: 8,
        zIndex: 10,
      },
      fabContainer: {
        position: 'absolute' as const,
        bottom: insets.bottom + 90,
        right: 20,
        alignItems: 'center' as const,
        gap: 12,
        zIndex: 10,
      },
      fabSecondary: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'white',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      },
      fabPrimary: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#2563EB',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 10,
      },
      statusBar: {
        position: 'absolute' as const,
        bottom: insets.bottom + 88,
        left: 16,
        right: 88,
        backgroundColor: 'white',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 11,
        flexDirection: 'row' as const,
        justifyContent: 'space-around' as const,
        alignItems: 'center' as const,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 10,
      },
      statusBarText: { fontSize: 13, fontWeight: '600' as const, color: colors.text },
      suggestionsContainer: {
        position: 'absolute' as const,
        top: insets.top + 72,
        left: 16,
        right: 16,
        backgroundColor: 'white',
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 12,
        zIndex: 20,
        overflow: 'hidden' as const,
      },
    }),
    [insets.top, insets.bottom, colors.text]
  );
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityMapPin | null>(null);
  const [region, setRegion] = useState(INITIAL_REGION);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [_userRegion, setUserRegion] = useState<Region | null>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterSheetRef = useRef<FilterBottomSheetRef>(null);

  useEffect(() => {
    let cancelled = false;
    const opts = { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 };
    const onSuccess = (position: { coords: { latitude: number; longitude: number } }) => {
      if (cancelled) return;
      const { latitude, longitude } = position.coords;
      const r: Region = {
        latitude,
        longitude,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
      };
      setUserRegion(r);
      setRegion(r);
      mapRef.current?.animateToRegion(r, 800);
    };
    const onError = (error: unknown) => {
      if (!cancelled && __DEV__) console.warn('[MapScreen] Location error:', error);
    };
    const run = async () => {
      try {
        Geolocation.getCurrentPosition(onSuccess, onError, opts);
      } catch (e) {
        if (!cancelled && __DEV__) console.warn('[MapScreen] Geolocation setup error:', e);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (text.trim().length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await GeocodingService.search(text);
      setSearchResults(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    }, 400);
  }, []);

  const handleSelectResult = useCallback(
    (result: GeocodingResult) => {
      setSearchQuery(result.name);
      setShowSuggestions(false);
      Keyboard.dismiss();
      const newRegion: Region = {
        latitude: result.lat,
        longitude: result.lng,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 600);
    },
    []
  );

  const handleFilterPress = useCallback(() => {
    filterSheetRef.current?.expand();
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.radius !== DEFAULT_FILTERS.radius) count++;
    if (filters.propertyType !== 'all') count++;
    if (filters.communityType !== 'all') count++;
    if (filters.bedroomsMin > 0) count++;
    if (filters.sortBy !== 'distance') count++;
    return count;
  }, [filters]);

  const { data: communityPins = [], isLoading: _commLoading } = useQuery<CommunityMapPin[]>({
    queryKey: ['map', 'communities', region.latitude, region.longitude, filters.radius],
    queryFn: async () => {
      const { data } = await api.get(
        `/communities/nearby?lat=${region.latitude}&lng=${region.longitude}&radius=${filters.radius}`
      );
      return (data.data ?? []).map((c: any) => {
        const loc = c.location || {};
        return {
          id: c.id,
          name: c.name,
          type: c.type || 'urban',
          latitude: typeof loc.lat === 'number' ? loc.lat : parseFloat(loc.lat) || 0,
          longitude: typeof loc.lng === 'number' ? loc.lng : parseFloat(loc.lng) || 0,
          member_count: c.member_count ?? 0,
          capacity: c.capacity ?? 0,
          rating: c.rating ?? 0,
          cover_url: c.cover_url,
          available_rooms: c.available_rooms ?? 0,
        } as CommunityMapPin;
      });
    },
    staleTime: 60 * 1000,
  });

  const { data: propertyPins = [], isLoading: _propLoading } = useQuery<PropertyMapPin[]>({
    queryKey: ['map', 'properties', region.latitude, region.longitude, filters.radius],
    queryFn: async () => {
      const { data } = await api.get(
        `/properties/map?lat=${region.latitude}&lng=${region.longitude}&radius=${filters.radius}`
      );
      return data.data ?? [];
    },
    staleTime: 60 * 1000,
    enabled: filter === 'all' || filter === 'properties',
  });

  const onRegionChangeComplete = useCallback((r: Region) => {
    setRegion(r);
    setSelectedCommunity(null);
  }, []);

  const goToUserLocation = () => {
    Vibration.vibrate(10);
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const r: Region = {
          latitude,
          longitude,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        };
        setUserRegion(r);
        setRegion(r);
        mapRef.current?.animateToRegion(r, 800);
      },
      (err) => { if (__DEV__) console.warn('[MapScreen] My Location error:', err); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const showCommunities = filter === 'all' || filter === 'communities';
  const showProperties = filter === 'all' || filter === 'properties';
  const totalResults = communityPins.length + propertyPins.length;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={styles.container}>
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          mapType="standard"
          initialRegion={region}
          region={region}
          onRegionChangeComplete={onRegionChangeComplete}
          onPress={() => setSelectedCommunity(null)}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {showCommunities && communityPins.map((pin) => (
            <CommunityPin key={pin.id} pin={pin} onPress={() => setSelectedCommunity(pin)} />
          ))}
          {showProperties && propertyPins.map((pin) => (
            <PropertyPin key={pin.id} pin={pin} onPress={() => navigation.navigate('PropertyDetail', { propertyId: pin.id })} />
          ))}
        </MapView>

        {/* Top bar: menu + search + filter — safe area aware */}
        <View style={layoutStyles.topBar}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('Tabs', { screen: 'Communities' })}>
            <Icon name="menu" size={20} color="#1A1A2E" />
          </TouchableOpacity>
          <TextInput
            style={styles.topBarSearchInput}
            placeholder="Search city or address..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isSearching && (
            <ActivityIndicator size="small" color={colors.primary} style={styles.searchSpinner} />
          )}
          <TouchableOpacity
            style={styles.filterBtnWrap}
            onPress={handleFilterPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.filterBtn}>
              <Icon name="tune" size={20} color={colors.primary} />
            </View>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Geocoding suggestions dropdown */}
        {showSuggestions && (
          <View style={layoutStyles.suggestionsContainer}>
            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={`${result.lat}-${result.lng}-${index}`}
                style={[
                  styles.suggestionItem,
                  index < searchResults.length - 1 && styles.suggestionBorder,
                ]}
                onPress={() => handleSelectResult(result)}
                activeOpacity={0.7}
              >
                <Icon
                  name={
                    result.type === 'city'
                      ? 'city'
                      : result.type === 'region'
                        ? 'map-marker-radius-outline'
                        : 'map-marker'
                  }
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.suggestionText}>
                  <Text
                    style={[styles.suggestionName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {result.name}
                  </Text>
                  <Text
                    style={[styles.suggestionAddress, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {result.displayName}
                  </Text>
                </View>
                <Icon name="chevron-right" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Filter pills — below search bar */}
        <View style={layoutStyles.filterRow}>
          {(['all', 'communities', 'properties'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>
                {f === 'all' ? 'All' : f === 'communities' ? 'Communities' : 'Properties'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FABs: Location (secondary), Add (primary) — above tab bar */}
        <View style={layoutStyles.fabContainer}>
          <TouchableOpacity style={layoutStyles.fabSecondary} onPress={goToUserLocation}>
            <Icon name="crosshairs-gps" size={22} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity style={layoutStyles.fabPrimary} onPress={() => { Vibration.vibrate(10); navigation.navigate('AddProperty'); }}>
            <Icon name="plus" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom status bar — above tab bar, does not overlap FAB */}
        <View style={layoutStyles.statusBar}>
          <View style={styles.statusBarItem}>
            <Icon name="account-group" size={16} color="#2563EB" />
            <Text style={layoutStyles.statusBarText}>{communityPins.length} communities</Text>
          </View>
          {showProperties && (
            <View style={styles.statusBarItem}>
              <Icon name="home" size={16} color="#2563EB" />
              <Text style={layoutStyles.statusBarText}>{propertyPins.length} properties</Text>
            </View>
          )}
        </View>

        {/* Selected community preview */}
        {selectedCommunity && (
          <Animated.View style={styles.previewContainer}>
            <CommunityPreviewCard
              pin={selectedCommunity}
              onTap={() => navigation.navigate('CommunityDetail', { communityId: selectedCommunity.id })}
            />
          </Animated.View>
        )}

        <FilterBottomSheet
          ref={filterSheetRef}
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => filterSheetRef.current?.close()}
          resultCount={totalResults}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    paddingVertical: 4,
  },
  filterBtnWrap: { position: 'relative', padding: 4 },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: { color: 'white', fontSize: 9, fontWeight: '700' },
  searchSpinner: { marginLeft: 4 },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  suggestionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  suggestionText: { flex: 1 },
  suggestionName: { fontSize: 14, fontWeight: '600' },
  suggestionAddress: { fontSize: 12, marginTop: 1 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    backgroundColor: 'transparent',
  },
  filterPillActive: { backgroundColor: '#2563EB' },
  filterPillText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  filterPillTextActive: { color: 'white' },
  statusBarItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  communityPin: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, minWidth: 44 },
  pinText: { color: '#fff', fontSize: 11, fontWeight: FontWeight.bold },
  pinTail: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', alignSelf: 'center' },
  previewContainer: { position: 'absolute', bottom: 140, left: 16, right: 16 },
  previewCard: { height: 160, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  previewImage: { ...StyleSheet.absoluteFillObject },
  previewContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, gap: Spacing.xs },
  previewBadge: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginBottom: 4 },
  previewBadgeText: { fontSize: FontSize.xs },
  previewName: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  previewStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  previewStat: { fontSize: FontSize.xs },
  previewDot: { width: 3, height: 3, borderRadius: 1.5 },
  previewCta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  previewCtaText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
