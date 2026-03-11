import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/useTheme';
import { Spacing, FontSize, FontWeight } from '@theme/index';

type Props = {
  title?: string;
  subtitle?: string;
  emoji?: string;
};

const DEFAULT_TITLE = 'Feature Coming Soon';
const DEFAULT_SUBTITLE = 'We\'re building this for you.';

export function ComingSoonView({ title = DEFAULT_TITLE, subtitle = DEFAULT_SUBTITLE, emoji = '✨' }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  emoji: { fontSize: 60, marginBottom: Spacing.lg },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.base, textAlign: 'center' },
});
