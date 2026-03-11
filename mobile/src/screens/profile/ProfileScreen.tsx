import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { HOUSING_REASON_LABELS } from '@utils/formatters';
import { AppStackParams } from '@navigation/AppNavigator';

interface MenuItem {
  icon: string;
  label: string;
  onPress: () => void;
  iconColor?: string;
  danger?: boolean;
  badge?: string;
}

function MenuSection({ title, items, colors }: { title: string; items: MenuItem[]; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={styles.menuSection}>
      <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, i < items.length - 1 && [styles.menuItemBorder, { borderBottomColor: colors.border }]]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.iconColor ?? colors.primary}15` }]}>
              <Icon name={item.icon} size={20} color={item.danger ? colors.danger : (item.iconColor ?? colors.primary)} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }, item.danger && { color: colors.danger }]}>{item.label}</Text>
            <View style={styles.menuRight}>
              {item.badge && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}><Text style={styles.badgeText}>{item.badge}</Text></View>
              )}
              <Icon name="chevron-right" size={18} color={colors.textDisabled} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const { user, logout } = useAuthStore();

  const initials = `${user?.first_name?.charAt(0) ?? ''}${user?.last_name?.charAt(0) ?? ''}`;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['rgba(91,79,232,0.15)', 'transparent']} style={styles.headerGrad}>
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <LinearGradient colors={[...colors.gradPrimary]} style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || '?'}</Text>
            </LinearGradient>
            <TouchableOpacity style={[styles.avatarEdit, { backgroundColor: colors.primary, borderColor: colors.background }]} onPress={() => navigation.navigate('EditProfile')}>
              <Icon name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.first_name} {user?.last_name}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>

          <View style={styles.badgesRow}>
            {user?.housing_reason && (
              <View style={[styles.reasonBadge, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
                <Text style={[styles.reasonBadgeText, { color: colors.primary }]}>
                  {HOUSING_REASON_LABELS[user.housing_reason as keyof typeof HOUSING_REASON_LABELS] ?? user.housing_reason}
                </Text>
              </View>
            )}
            {user?.professional_title && (
              <View style={[styles.proBadge, { backgroundColor: `${colors.info}15`, borderColor: `${colors.info}30` }]}>
                <Icon name="check-circle" size={12} color={colors.info} />
                <Text style={[styles.proBadgeText, { color: colors.info }]}>{user.professional_title}</Text>
              </View>
            )}
          </View>

          <View style={styles.verificationRow}>
            <Icon
              name={user?.kyc_verified ? 'shield-check' : 'shield-alert'}
              size={16}
              color={user?.kyc_verified ? colors.accent : colors.gold}
            />
            <Text style={[styles.verificationText, { color: user?.kyc_verified ? colors.accent : colors.gold }]}>
              {user?.kyc_verified ? 'Identity verified' : 'KYC verification pending'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <MenuSection
        title="Account"
        colors={colors}
        items={[
          { icon: 'account-edit-outline', label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile') },
          { icon: 'bell-outline', label: 'Notifications', onPress: () => navigation.navigate('Notifications'), iconColor: colors.gold },
          { icon: 'shield-check-outline', label: 'Privacy & Security', onPress: () => navigation.navigate('Settings'), iconColor: colors.info },
        ]}
      />

      <MenuSection
        title="Community"
        colors={colors}
        items={[
          { icon: 'home-plus-outline', label: 'Add Property', onPress: () => navigation.navigate('AddProperty'), iconColor: colors.accent },
          { icon: 'swap-horizontal-bold', label: 'Transfer Community', onPress: () => navigation.navigate('TransferCommunity'), iconColor: colors.primary },
          { icon: 'map-search-outline', label: 'Discover Communities', onPress: () => navigation.navigate('Communities' as any), iconColor: colors.info },
        ]}
      />

      <MenuSection
        title="Finance"
        colors={colors}
        items={[
          { icon: 'home', label: 'My Rentals', onPress: () => navigation.navigate('MyRentals'), iconColor: colors.accent },
          { icon: 'receipt', label: 'Transaction History', onPress: () => navigation.navigate('TransactionHistory'), iconColor: colors.primary },
        ]}
      />

      <MenuSection
        title="Support"
        colors={colors}
        items={[
          { icon: 'help-circle-outline', label: 'Help & FAQ', onPress: () => navigation.navigate('HelpFAQ'), iconColor: colors.textSecondary },
          { icon: 'message-alert-outline', label: 'Report an Issue', onPress: () => navigation.navigate('ReportIssue'), iconColor: colors.gold },
          { icon: 'information', label: 'About Locus', onPress: () => navigation.navigate('AboutLocus'), iconColor: colors.info },
        ]}
      />

      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: `${colors.danger}10`, borderColor: `${colors.danger}30` }]} onPress={handleLogout}>
        <Icon name="logout" size={20} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.textDisabled }]}>Locus v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 100 },
  headerGrad: { paddingBottom: Spacing.xl },
  header: { alignItems: 'center', paddingTop: Spacing['4xl'], paddingHorizontal: Spacing.xxl, gap: Spacing.md },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.sm },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: '#fff' },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  email: { fontSize: FontSize.sm },
  badgesRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  reasonBadge: { paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  reasonBadgeText: { fontSize: FontSize.xs },
  proBadge: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  proBadgeText: { fontSize: FontSize.xs },
  verificationRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  verificationText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  menuSection: { paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl },
  menuSectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  menuCard: { borderRadius: BorderRadius.xl, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', padding: Spacing.lg },
  menuItemBorder: { borderBottomWidth: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  menuRight: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold },
  logoutBtn: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', justifyContent: 'center', marginHorizontal: Spacing.xxl, marginTop: Spacing.xxl, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1 },
  logoutText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  version: { textAlign: 'center', fontSize: FontSize.xs, marginTop: Spacing.xl },
});
