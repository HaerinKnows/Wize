import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AchievementBadge } from '@/components/AchievementBadge';
import { Card } from '@/components/Card';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type AchievementTemplate = {
  id: string;
  title: string;
  goalText: string;
};

const templates: AchievementTemplate[] = [
  { id: 'ach_1', title: '7-day streak', goalText: 'Track expenses 7 days straight' },
  { id: 'ach_2', title: 'Budget keeper', goalText: 'Stay under monthly budget' },
  { id: 'ach_3', title: 'Saver rank', goalText: 'Save first before spending' },
  { id: 'ach_4', title: 'Debt crusher', goalText: 'Reduce debt consistently' },
  { id: 'ach_5', title: 'No-spend day', goalText: '1 full day zero spending' },
  { id: 'ach_6', title: 'Bill on-time', goalText: 'Pay bills before due date' },
  { id: 'ach_7', title: 'Emergency fund', goalText: 'Grow backup savings' },
  { id: 'ach_8', title: 'Cashflow watcher', goalText: 'Review analytics weekly' }
];

const hashText = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const userId = useAuthStore((s) => s.userId ?? 'guest');

  const items = useMemo(() => {
    return templates.map((template, index) => {
      const seed = hashText(`${userId}:${template.id}:${index}`);
      // Static per-account preview progress for now; no live progression logic yet.
      const progressPercent = 8 + (seed % 73);
      return { ...template, progressPercent };
    });
  }, [userId]);

  return (
    <Screen>
      <Text style={styles.title}>Achievements</Text>
      <Card>
        <Text style={styles.caption}>Progress is account-specific. Bars are static previews for now.</Text>
      </Card>
      <View style={styles.grid}>
        {items.map((item) => (
          <AchievementBadge
            key={item.id}
            title={item.title}
            subtitle={item.goalText}
            progressPercent={item.progressPercent}
          />
        ))}
      </View>
      <RoundedButton label="Back" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { ...typography.h2, color: colors.textPrimary },
    caption: { ...typography.caption, color: colors.textSecondary },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      justifyContent: 'space-between'
    }
  });
