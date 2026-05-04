import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/currency';

export function BudgetCard({ category, spent, limit }: { category: string; spent: number; limit: number }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const ratio = Math.min(1, spent / limit);

  return (
    <Card>
      <Text style={styles.title}>{category}</Text>
      <Text style={styles.value}>{`${formatCurrency(spent)} / ${formatCurrency(limit)}`}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { ...typography.body, color: colors.textPrimary },
    value: { ...typography.caption, color: colors.textSecondary, marginTop: 8, marginBottom: 10 },
    track: { height: 8, borderRadius: 99, backgroundColor: colors.primarySoft },
    fill: { height: 8, borderRadius: 99, backgroundColor: colors.primary }
  });
