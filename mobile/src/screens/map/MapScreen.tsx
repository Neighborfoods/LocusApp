import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { CommunityMapPin, PropertyMapPin } from '@types/models';
import api from '@api/client';
import { formatCents, COMMUNITY_TYPE_LABELS } from '@utils/formatters';
import { AppStackParams } from '@navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

const INITIAL_REGION: Region = {
  latitude: 34.0522,
  longitude: -118.2437,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d0d1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7a7a8c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#08080f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#161626' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a14' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

type FilterType = 'all' | 'communities' | 'properties';

// ── Pin components ─────────────────────────────────────────────────────────────

function CommunityPin({ pin, onPress }: { pin: CommunityMapPin; onPress: () => void }) {
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
        <LinearGradient colors={Colors.gradPrimary} style={styles.communityPin} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Icon name="account-group" size={14} color="#fff" />
          <Text style={styles.pinText}>{pin.member_count}</Text>
        </LinearGradient>
        <View style={styles.pinTail} />
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
          <Text style={styles.previewBadgeText}>{COMMUNITY_TYPE_LABELS[pin.type]}</Text>
        </View>
        <Text style={styles.previewName}>{pin.name}</Text>
        <View style={styles.previewStats}>
          <Icon name="account-group" size={14} color={Colors.textSecondary} />
          <Text style={styles.previewStat}>{pin.member_count} members</Text>
          <View style={styles.previewDot} />
          <Icon name="star" size={14} color={Colors.gold} />
          <Text style={styles.previewStat}>{pin.rating.toFixed(1)}</Text>
        </View>
        <View style={styles.previewCta}>
          <Text style={styles.previewCtaText}>View Community</Text>
          <Icon name="chevron-right" size={16} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityMapPin | null>(null);
  const [region, setRegion] = useState(INITIAL_REGION);
  const mapRef = useRef<MapView>(null);

  const { data: communityPins = [], isLoading: commLoading } = useQuery<CommunityMapPin[]>({
    queryKey: ['map', 'communities', region.latitude, region.longitude],
    queryFn: async () => {
      const { data } = await api.get(
        `/communities/nearby?lat=${region.latitude}&lng=${region.longitude}&radius=50`
      );
      return (data.data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        latitude: c.latitude,
        longitude: c.longitude,
        member_count: c.member_count,
        capacity: c.capacity,
        rating: c.rating,
        cover_url: c.cover_url,
        available_rooms: c.available_rooms,
      }));
    },
    staleTime: 60 * 1000,
  });

  const { data: propertyPins = [], isLoading: propLoading } = useQuery<PropertyMapPin[]>({
    queryKey: ['map', 'properties', region.latitude, region.longitude],
    queryFn: async () => {
      const { data } = await api.get(
        `/properties/map?lat=${region.latitude}&lng=${region.longitude}&radius=50`
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
    // In real app: use Geolocation.getCurrentPosition
    mapRef.current?.animateToRegion(INITIAL_REGION, 800);
  };

  const showCommunities = filter === 'all' || filter === 'communities';
  const showProperties = filter === 'all' || filter === 'properties';
  const isLoading = commLoading || propLoading;

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          customMapStyle={MAP_STYLE}
          initialRegion={INITIAL_REGION}
          onRegionChangeComplete={onRegionChangeComplete}
          onPress={() => setSelectedCommunity(null)}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {showCommunities && communityPins.map((pin) => (
            <CommunityPin key={pin.id} pin={pin} onPress={() => setSelectedCommunity(pin)} />
          ))}
          {showProperties && propertyPins.map((pin) => (
            <PropertyPin key={pin.id} pin={pin} onPress={() => navigation.navigate('CommunityDetail' as any, {})} />
          ))}
        </MapView>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          {isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>

        {/* Filter pills */}
        <View style={styles.filterRow}>
          {(['all', 'communities', 'properties'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'All' : f === 'communities' ? 'Communities' : 'Properties'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={goToUserLocation}>
            <Icon name="crosshairs-gps" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => navigation.navigate('Communities' as any)}>
            <Icon name="format-list-bulleted" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stats overlay */}
        <View style={styles.statsOverlay}>
          <View style={styles.statChip}>
            <Icon name="account-group" size={12} color={Colors.primary} />
            <Text style={styles.statChipText}>{communityPins.length} communities</Text>
          </View>
          {showProperties && (
            <View style={styles.statChip}>
              <Icon name="home" size={12} color={Colors.accent} />
              <Text style={styles.statChipText}>{propertyPins.length} properties</Text>
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
      </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    position: 'absolute',
    top: Spacing['4xl'],
    left: Spacing.xxl,
    right: Spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  filterRow: {
    position: 'absolute',
    top: Spacing['4xl'] + 40,
    left: Spacing.xxl,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: 'rgba(15,15,28,0.85)', borderWidth: 1, borderColor: Colors.border },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  filterTextActive: { color: '#fff' },
  controls: {
    position: 'absolute',
    right: Spacing.xxl,
    top: '45%',
    gap: Spacing.sm,
  },
  controlBtn: { width: 44, height: 44, borderRadius: BorderRadius.full, backgroundColor: 'rgba(15,15,28,0.9)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  statsOverlay: {
    position: 'absolute',
    bottom: 120,
    left: Spacing.xxl,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statChip: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: 'rgba(15,15,28,0.9)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  statChipText: { fontSize: FontSize.xs, color: Colors.text, fontWeight: FontWeight.medium },
  communityPin: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, minWidth: 44 },
  pinText: { color: '#fff', fontSize: 11, fontWeight: FontWeight.bold },
  pinTail: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: Colors.primary, alignSelf: 'center' },
  previewContainer: { position: 'absolute', bottom: 24, left: Spacing.xxl, right: Spacing.xxl },
  previewCard: { height: 160, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  previewImage: { ...StyleSheet.absoluteFillObject },
  previewContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, gap: Spacing.xs },
  previewBadge: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginBottom: 4 },
  previewBadgeText: { color: Colors.textSecondary, fontSize: FontSize.xs },
  previewName: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  previewStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  previewStat: { color: Colors.textSecondary, fontSize: FontSize.xs },
  previewDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.border },
  previewCta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  previewCtaText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
