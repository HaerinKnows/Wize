import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  title: string;
  subtitle: string;
  progressPercent: number;
  onPress?: () => void;
};

export function AchievementBadge({ title, subtitle, progressPercent, onPress }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const safe = Math.max(0, Math.min(100, progressPercent));

  return (
    <Pressable style={styles.badge} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${safe}%` }]} />
      </View>
      <Text style={styles.state}>{`${safe}% complete`}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    badge: {
      width: '48%',
      minHeight: 136,
      borderRadius: radius.card,
      backgroundColor: colors.chipAmber,
      padding: spacing.md,
      gap: spacing.sm
    },
    title: { ...typography.body, color: colors.textPrimary },
    subtitle: { ...typography.caption, color: colors.textSecondary },
    track: {
      height: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
      overflow: 'hidden'
    },
    fill: {
      height: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.primary
    },
    state: { ...typography.caption, color: colors.textPrimary }
  });
