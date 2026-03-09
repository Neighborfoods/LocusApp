import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
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

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <View style={styles.menuSection}>
      <Text style={styles.menuSectionTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, i < items.length - 1 && styles.menuItemBorder]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.iconColor ?? Colors.primary}15` }]}>
              <Icon name={item.icon} size={20} color={item.danger ? Colors.danger : (item.iconColor ?? Colors.primary)} />
            </View>
            <Text style={[styles.menuLabel, item.danger && { color: Colors.danger }]}>{item.label}</Text>
            <View style={styles.menuRight}>
              {item.badge && (
                <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View>
              )}
              <Icon name="chevron-right" size={18} color={Colors.textDisabled} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['rgba(91,79,232,0.15)', 'transparent']} style={styles.headerGrad}>
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <LinearGradient colors={Colors.gradPrimary} style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || '?'}</Text>
            </LinearGradient>
            <TouchableOpacity style={styles.avatarEdit} onPress={() => navigation.navigate('EditProfile')}>
              <Icon name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {/* Badges */}
          <View style={styles.badgesRow}>
            {user?.housing_reason && (
              <View style={styles.reasonBadge}>
                <Text style={styles.reasonBadgeText}>
                  {HOUSING_REASON_LABELS[user.housing_reason as keyof typeof HOUSING_REASON_LABELS] ?? user.housing_reason}
                </Text>
              </View>
            )}
            {user?.professional_title && (
              <View style={styles.proBadge}>
                <Icon name="briefcase-check" size={12} color={Colors.info} />
                <Text style={styles.proBadgeText}>{user.professional_title}</Text>
              </View>
            )}
          </View>

          {/* Verification status */}
          <View style={styles.verificationRow}>
            <Icon
              name={user?.kyc_verified ? 'shield-check' : 'shield-alert'}
              size={16}
              color={user?.kyc_verified ? Colors.accent : Colors.gold}
            />
            <Text style={[styles.verificationText, { color: user?.kyc_verified ? Colors.accent : Colors.gold }]}>
              {user?.kyc_verified ? 'Identity verified' : 'KYC verification pending'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Menu sections */}
      <MenuSection
        title="Account"
        items={[
          { icon: 'account-edit', label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile') },
          { icon: 'bell-outline', label: 'Notifications', onPress: () => navigation.navigate('Notifications'), iconColor: Colors.gold },
          { icon: 'shield-lock-outline', label: 'Privacy & Security', onPress: () => navigation.navigate('Settings'), iconColor: Colors.info },
        ]}
      />

      <MenuSection
        title="Community"
        items={[
          { icon: 'home-plus-outline', label: 'Add Property', onPress: () => navigation.navigate('CreateCommunity'), iconColor: Colors.accent },
          { icon: 'swap-horizontal', label: 'Transfer Community', onPress: () => {}, iconColor: Colors.primary },
          { icon: 'map-search-outline', label: 'Discover Communities', onPress: () => navigation.navigate('Communities' as any), iconColor: Colors.info },
        ]}
      />

      <MenuSection
        title="Finance"
        items={[
          { icon: 'home-currency-usd', label: 'My Rentals', onPress: () => navigation.navigate('ItemRentals'), iconColor: Colors.accent },
          { icon: 'receipt', label: 'Transaction History', onPress: () => {}, iconColor: Colors.primary },
        ]}
      />

      <MenuSection
        title="Support"
        items={[
          { icon: 'help-circle-outline', label: 'Help & FAQ', onPress: () => {}, iconColor: Colors.textSecondary },
          { icon: 'message-alert-outline', label: 'Report an Issue', onPress: () => {}, iconColor: Colors.gold },
          { icon: 'information-outline', label: 'About Locus', onPress: () => {}, iconColor: Colors.info },
        ]}
      />

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="logout" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Locus v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 100 },
  headerGrad: { paddingBottom: Spacing.xl },
  header: { alignItems: 'center', paddingTop: Spacing['4xl'], paddingHorizontal: Spacing.xxl, gap: Spacing.md },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.sm },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: '#fff' },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.bg },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  email: { fontSize: FontSize.sm, color: Colors.textSecondary },
  badgesRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  reasonBadge: { backgroundColor: `${Colors.primary}15`, paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: `${Colors.primary}30` },
  reasonBadgeText: { fontSize: FontSize.xs, color: Colors.primary },
  proBadge: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: `${Colors.info}15`, paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: `${Colors.info}30` },
  proBadgeText: { fontSize: FontSize.xs, color: Colors.info },
  verificationRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  verificationText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  menuSection: { paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl },
  menuSectionTitle: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  menuCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', padding: Spacing.lg },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  menuRight: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  badge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold },
  logoutBtn: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', justifyContent: 'center', marginHorizontal: Spacing.xxl, marginTop: Spacing.xxl, backgroundColor: `${Colors.danger}10`, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: `${Colors.danger}30` },
  logoutText: { fontSize: FontSize.md, color: Colors.danger, fontWeight: FontWeight.semibold },
  version: { textAlign: 'center', color: Colors.textDisabled, fontSize: FontSize.xs, marginTop: Spacing.xl },
});
