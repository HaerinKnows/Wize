import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { Card } from '@/components/Card';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/currency';

export function AccountTile({ name, balanceMinor, provider }: { name: string; balanceMinor: number; provider: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Card>
      <View style={styles.row}>
        <View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.provider}>{provider}</Text>
        </View>
        <Text style={styles.balance}>{formatCurrency(balanceMinor)}</Text>
      </View>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
    name: { ...typography.body, color: colors.textPrimary },
    provider: { ...typography.caption, color: colors.textSecondary },
    balance: { ...typography.h2, color: colors.textPrimary }
  });
