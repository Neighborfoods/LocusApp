import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/useTheme';
import { MapFilters, DEFAULT_FILTERS } from '../../types/filters';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

export interface FilterBottomSheetRef {
  expand: () => void;
  close: () => void;
}

interface Props {
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  onClose: () => void;
  resultCount: number;
}

const FilterBottomSheet = forwardRef<FilterBottomSheetRef, Props>(
  ({ filters, onFiltersChange, onClose, resultCount }, ref) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    const open = () => {
      setVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    };

    const close = () => {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        onClose();
      });
    };

    useImperativeHandle(ref, () => ({ expand: open, close }));

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 120 || g.vy > 0.5) {
            close();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      })
    ).current;

    const update = (key: keyof MapFilters, value: MapFilters[keyof MapFilters]) =>
      onFiltersChange({ ...filters, [key]: value });

    const resetFilters = () => onFiltersChange(DEFAULT_FILTERS);
    const hasActiveFilters =
      JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

    const RADII = [5, 10, 25, 50, 100];
    const PROPERTY_TYPES = [
      { value: 'all' as const, label: 'All' },
      { value: 'house' as const, label: 'House' },
      { value: 'apartment' as const, label: 'Apt' },
      { value: 'studio' as const, label: 'Studio' },
    ];
    const COMMUNITY_TYPES = [
      { value: 'all' as const, label: 'All' },
      { value: 'equity' as const, label: 'Equity' },
      { value: 'cooperative' as const, label: 'Co-op' },
      { value: 'rental' as const, label: 'Rental' },
    ];
    const SORT_OPTIONS = [
      { value: 'distance' as const, label: 'Nearest' },
      { value: 'price_asc' as const, label: 'Price ↑' },
      { value: 'price_desc' as const, label: 'Price ↓' },
      { value: 'newest' as const, label: 'Newest' },
    ];

    const Chip = ({
      label,
      active,
      onPress,
    }: {
      value: number | string;
      label: string;
      active: boolean;
      onPress: () => void;
    }) => (
      <TouchableOpacity
        style={[
          styles.chip,
          { borderColor: colors.primary },
          active && { backgroundColor: colors.primary },
        ]}
        onPress={onPress}
      >
        <Text style={[styles.chipText, { color: active ? 'white' : colors.primary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );

    const Section = ({
      title,
      children,
    }: {
      title: string;
      children: React.ReactNode;
    }) => (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
        <View style={styles.chipRow}>{children}</View>
      </View>
    );

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close} />

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              height: SHEET_HEIGHT,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag handle */}
          <View {...panResponder.panHandlers} style={styles.handleArea}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Filters</Text>
            <View style={styles.headerRight}>
              {hasActiveFilters && (
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={[styles.reset, { color: colors.primary }]}>Reset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={close}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <Section title="SEARCH RADIUS">
              {RADII.map((r) => (
                <Chip
                  key={r}
                  value={r}
                  label={`${r} km`}
                  active={filters.radius === r}
                  onPress={() => update('radius', r)}
                />
              ))}
            </Section>

            <Section title="PROPERTY TYPE">
              {PROPERTY_TYPES.map((pt) => (
                <Chip
                  key={pt.value}
                  value={pt.value}
                  label={pt.label}
                  active={filters.propertyType === pt.value}
                  onPress={() => update('propertyType', pt.value)}
                />
              ))}
            </Section>

            <Section title="COMMUNITY TYPE">
              {COMMUNITY_TYPES.map((ct) => (
                <Chip
                  key={ct.value}
                  value={ct.value}
                  label={ct.label}
                  active={filters.communityType === ct.value}
                  onPress={() => update('communityType', ct.value)}
                />
              ))}
            </Section>

            <Section title="MIN. BEDROOMS">
              {[0, 1, 2, 3, 4].map((b) => (
                <Chip
                  key={b}
                  value={b}
                  label={b === 0 ? 'Any' : `${b}+`}
                  active={filters.bedroomsMin === b}
                  onPress={() => update('bedroomsMin', b)}
                />
              ))}
            </Section>

            <Section title="SORT BY">
              {SORT_OPTIONS.map((s) => (
                <Chip
                  key={s.value}
                  value={s.value}
                  label={s.label}
                  active={filters.sortBy === s.value}
                  onPress={() => update('sortBy', s.value)}
                />
              ))}
            </Section>
          </ScrollView>

          {/* Apply button */}
          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
            onPress={close}
            activeOpacity={0.85}
          >
            <Text style={styles.applyText}>Show {resultCount} Results</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  reset: { fontSize: 14, fontWeight: '500' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  applyBtn: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

FilterBottomSheet.displayName = 'FilterBottomSheet';

export default FilterBottomSheet;
