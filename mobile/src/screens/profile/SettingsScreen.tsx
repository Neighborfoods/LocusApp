import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSize } from '@theme/index';
import { AppStackParams } from '@navigation/AppNavigator';

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams, 'Settings'>>();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Coming soon.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  back: { padding: Spacing.md, alignSelf: 'flex-start' },
  title: { fontSize: FontSize['2xl'], color: Colors.text, marginHorizontal: Spacing.lg, marginTop: Spacing.sm },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, marginHorizontal: Spacing.lg, marginTop: Spacing.xs },
});
