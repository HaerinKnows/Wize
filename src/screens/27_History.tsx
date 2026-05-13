import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { TransactionRow } from '@/components/TransactionRow';
import { Screen } from '@/screens/Screen';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/currency';
import { getPeriodRange, isTimestampInRange, toLocalDateKey, TransactionPeriod } from '@/utils/periods';

type HistoryPeriod = TransactionPeriod | 'all';

const periodLabels: Record<HistoryPeriod, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
  all: 'All'
};

const dateLabel = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
};

export default function HistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const allTransactions = useAppStore((s) => s.transactions);
  const dailyWalletBalances = useAppStore((s) => s.dailyWalletBalances);
  const preferredCurrency = useAppStore((s) => s.preferredCurrency);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);
  const userId = useAuthStore((s) => s.userId);
  const [period, setPeriod] = useState<HistoryPeriod>('all');

  const transactions = useMemo(() => {
    const effectiveUserId = userId ?? 'user_demo';
    const userTransactions = allTransactions.filter((t) => (t.ownerUserId ?? 'user_demo') === effectiveUserId);

    if (period === 'all') return userTransactions;

    const range = getPeriodRange(period);
    return userTransactions.filter((tx) => isTimestampInRange(tx.timestamp, range));
  }, [allTransactions, period, userId]);

  const balanceRows = useMemo(() => {
    const entries = Object.entries(dailyWalletBalances).sort(([a], [b]) => b.localeCompare(a));

    if (period === 'all') return entries;

    const range = getPeriodRange(period);
    return entries.filter(([dateKey]) => {
      const time = new Date(`${dateKey}T00:00:00`).getTime();
      return !Number.isNaN(time) && time >= range.start && time < range.end;
    });
  }, [dailyWalletBalances, period]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, typeof transactions>();

    transactions.forEach((tx) => {
      const key = toLocalDateKey(tx.timestamp);
      groups.set(key, [...(groups.get(key) ?? []), tx]);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.amountMinor < 0) {
          return { ...acc, expense: acc.expense + Math.abs(tx.amountMinor) };
        }
        return { ...acc, income: acc.income + tx.amountMinor };
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>History</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.periodTabs}>
          {(Object.keys(periodLabels) as HistoryPeriod[]).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => setPeriod(item)}
              style={[styles.periodTab, period === item && styles.periodTabSelected]}
            >
              <Text style={[styles.periodTabText, period === item && styles.periodTabTextSelected]}>
                {periodLabels[item]}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={styles.income}>{formatCurrency(totals.income, preferredCurrency)}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.expense}>{formatCurrency(totals.expense, preferredCurrency)}</Text>
          </Card>
        </View>

        <Card header="Daily Wallet Balance">
          {balanceRows.length === 0 ? <Text style={styles.empty}>No daily balance saved for this period.</Text> : null}
          {balanceRows.map(([dateKey, amountMinor]) => (
            <View key={dateKey} style={styles.balanceRow}>
              <Text style={styles.balanceDate}>{dateLabel(dateKey)}</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(amountMinor, preferredCurrency)}</Text>
            </View>
          ))}
        </Card>

        <Card header="Transactions">
          {groupedTransactions.length === 0 ? <Text style={styles.empty}>No transactions for this period.</Text> : null}
          {groupedTransactions.map(([dateKey, items]) => (
            <View key={dateKey} style={styles.transactionGroup}>
              <Text style={styles.groupTitle}>{dateLabel(dateKey)}</Text>
              {items.map((txn) => (
                <TransactionRow
                  key={txn.id}
                  category={txn.category}
                  amountMinor={txn.amountMinor}
                  timestamp={txn.timestamp}
                  currency={txn.currency || preferredCurrency}
                  notes={txn.notes}
                  onDelete={() => deleteTransaction(txn.id)}
                />
              ))}
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      gap: spacing.md,
      paddingBottom: spacing.xl
    },
    header: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary
    },
    backButton: {
      minHeight: 38,
      paddingHorizontal: spacing.md,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center'
    },
    backButtonText: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    headerSpacer: {
      width: 66
    },
    periodTabs: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 8,
      overflow: 'hidden'
    },
    periodTab: {
      flex: 1,
      minHeight: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card
    },
    periodTabSelected: {
      backgroundColor: colors.primary
    },
    periodTabText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '700'
    },
    periodTabTextSelected: {
      color: '#FFFFFF'
    },
    summaryRow: {
      flexDirection: 'row',
      gap: spacing.md
    },
    summaryCard: {
      flex: 1
    },
    summaryLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.xs
    },
    income: {
      ...typography.h3,
      color: colors.success
    },
    expense: {
      ...typography.h3,
      color: colors.danger
    },
    empty: {
      ...typography.caption,
      color: colors.textSecondary
    },
    balanceRow: {
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.line
    },
    balanceDate: {
      ...typography.body,
      color: colors.textPrimary
    },
    balanceAmount: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    transactionGroup: {
      marginBottom: spacing.md
    },
    groupTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '700',
      marginTop: spacing.sm
    }
  });
