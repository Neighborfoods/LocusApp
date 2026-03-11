import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@theme/useTheme';
import { Spacing, FontSize, FontWeight } from '@theme/index';
import api from '@api/client';
import { AppStackParams } from '@navigation/AppNavigator';
import { formatDistanceToNow } from 'date-fns';

type NotificationItem = {
  id: string;
  title: string | null;
  body: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams, 'Notifications'>>();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications?page=1&limit=50');
      return (res?.data?.data ?? []) as NotificationItem[];
    },
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: NotificationItem[] = data ?? [];

  const onMarkAllRead = useCallback(() => {
    Vibration.vibrate(10);
    readAllMutation.mutate();
  }, [readAllMutation]);

  const onPressItem = useCallback((item: NotificationItem) => {
    if (!item.read) {
      Vibration.vibrate(10);
      readMutation.mutate(item.id);
    }
  }, [readMutation]);

  const getIcon = (title: string | null) => {
    const t = (title ?? '').toLowerCase();
    if (t.includes('community')) return 'account-group';
    if (t.includes('vote')) return 'vote';
    if (t.includes('property')) return 'home';
    return 'bell';
  };

  const iconColor = (title: string | null) => {
    const t = (title ?? '').toLowerCase();
    if (t.includes('community')) return colors.primary;
    if (t.includes('vote')) return colors.gold;
    if (t.includes('property')) return colors.accent;
    return colors.textSecondary;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <TouchableOpacity onPress={onMarkAllRead} style={styles.markAllBtn}>
          <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, notifications.length === 0 && styles.emptyList]}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={6}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.surface }]}>
              <Icon name="bell-outline" size={80} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>You're all caught up!</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              New notifications will appear here
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.row,
              { backgroundColor: item.read ? colors.background : colors.surfaceSecondary, borderBottomColor: colors.divider },
            ]}
            onPress={() => onPressItem(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${iconColor(item.title)}20` }]}>
              <Icon name={getIcon(item.title)} size={22} color={iconColor(item.title)} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.text }, !item.read && styles.rowTitleBold]} numberOfLines={1}>
                {item.title || 'Notification'}
              </Text>
              <Text style={[styles.rowBody, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.body || ''}
              </Text>
              <Text style={[styles.rowTime, { color: colors.textTertiary }]}>
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </Text>
            </View>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  title: { flex: 1, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  markAllBtn: { padding: Spacing.sm },
  markAllText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  listContent: { paddingBottom: 100 },
  emptyList: { flexGrow: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.lg, borderBottomWidth: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: FontSize.base },
  rowTitleBold: { fontWeight: FontWeight.bold },
  rowBody: { fontSize: FontSize.sm, marginTop: 2 },
  rowTime: { fontSize: FontSize.xs, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: Spacing.sm, marginTop: 6 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  emptySubtitle: { fontSize: FontSize.sm, marginTop: Spacing.sm },
});
