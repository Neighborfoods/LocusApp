import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@theme/useTheme';
import { Spacing, FontSize, FontWeight } from '@theme/index';
import { ComingSoonView } from '@components/ComingSoonView';
import { AppStackParams } from '@navigation/AppNavigator';

type ComingSoonRouteParams = {
  title?: string;
  subtitle?: string;
  emoji?: string;
  screenTitle?: string;
};

const SCREEN_CONFIG: Record<string, ComingSoonRouteParams> = {
  TransactionHistory: { screenTitle: 'Transaction History', title: 'Transaction History', subtitle: 'View and export your payment history.', emoji: '📜' },
  HelpFAQ: { screenTitle: 'Help & FAQ', title: 'Help & FAQ', subtitle: 'Find answers and get support.', emoji: '❓' },
  ReportIssue: { screenTitle: 'Report an Issue', title: 'Report an Issue', subtitle: 'Send feedback or report a problem.', emoji: '📩' },
  AboutLocus: { screenTitle: 'About Locus', title: 'About Locus', subtitle: 'Learn more about Locus and our mission.', emoji: '🏠' },
  TransferCommunity: { screenTitle: 'Transfer Community', title: 'Transfer Community', subtitle: 'Move your membership to another community.', emoji: '🔄' },
  MyRentals: { screenTitle: 'My Rentals', title: 'My Rentals', subtitle: 'Manage your rental listings and agreements.', emoji: '🏠' },
  PrivacyAndSecurity: { screenTitle: 'Privacy & Security', title: 'Privacy & Security', subtitle: 'Manage your privacy and security settings.', emoji: '🔒' },
};

export type ComingSoonScreenName = keyof typeof SCREEN_CONFIG & keyof AppStackParams;

export default function ComingSoonScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const route = useRoute();
  const name = route.name as ComingSoonScreenName;
  const config = SCREEN_CONFIG[name];
  const screenTitle = config?.screenTitle ?? 'Coming Soon';
  const title = config?.title ?? 'Feature Coming Soon';
  const subtitle = config?.subtitle ?? "We're building this for you.";
  const emoji = config?.emoji ?? '✨';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{screenTitle}</Text>
        <View style={styles.backBtn} />
      </View>
      <ComingSoonView title={title} subtitle={subtitle} emoji={emoji} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
});
