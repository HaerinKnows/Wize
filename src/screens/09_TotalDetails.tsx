import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { RoundedButton } from '@/components/RoundedButton';
import { TransactionRow } from '@/components/TransactionRow';
import { Screen } from '@/screens/Screen';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { formatCurrency } from '@/utils/currency';
import { useTheme } from '@/theme/ThemeProvider';

export default function TotalDetailsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const allTransactions = useAppStore((s) => s.transactions);
  const userId = useAuthStore((s) => s.userId);
  const transactions = useMemo(
    () => allTransactions.filter((t) => (t.ownerUserId ?? 'user_demo') === userId),
    [allTransactions, userId]
  );

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amountMinor, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amountMinor), 0);
    return { income, expense, total: income - expense };
  }, [transactions]);

  const lastFive = useMemo(() => transactions.slice(0, 5), [transactions]);

  return (
    <Screen>
      <Text style={styles.title}>Total Breakdown</Text>
      <Card>
        <Text style={styles.total}>{formatCurrency(totals.total)}</Text>
        <View style={styles.row}>
          <Chip label={`Income ${formatCurrency(totals.income)}`} />
          <Chip label={`Expense ${formatCurrency(-totals.expense)}`} />
        </View>
      </Card>

      <Card header="Latest Activity">
        {lastFive.map((txn) => (
          <TransactionRow
            key={txn.id}
            category={txn.category}
            amountMinor={txn.amountMinor}
            timestamp={txn.timestamp}
            currency={txn.currency}
            notes={txn.notes}
          />
        ))}
      </Card>

      <RoundedButton label="Open Analytics" onPress={() => router.push('/analytics')} />
      <RoundedButton label="Back to Dashboard" variant="secondary" onPress={() => router.replace('/dashboard')} />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { ...typography.h2, color: colors.textPrimary },
    total: { ...typography.h1, color: colors.textPrimary },
    row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }
  });
