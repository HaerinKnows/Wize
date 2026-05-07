import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BudgetCard } from '@/components/BudgetCard';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Input } from '@/components/Input';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { fromMajor } from '@/utils/currency';
import { useTheme } from '@/theme/ThemeProvider';

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const allBudgets = useAppStore((s) => s.budgets);
  const addBudget = useAppStore((s) => s.addBudget);
  const updateBudgetSpent = useAppStore((s) => s.updateBudgetSpent);
  const markSynced = useAppStore((s) => s.markSynced);
  const userId = useAuthStore((s) => s.userId ?? 'user_demo');

  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [progressAmount, setProgressAmount] = useState('');
  const [error, setError] = useState('');

  const budgets = useMemo(
    () => allBudgets.filter((budget) => (budget.ownerUserId ?? 'user_demo') === userId),
    [allBudgets, userId]
  );

  useEffect(() => {
    if (budgets.length === 0) {
      setSelectedBudgetId('');
      return;
    }

    const exists = budgets.some((budget) => budget.id === selectedBudgetId);
    if (!exists) {
      setSelectedBudgetId(budgets[0].id);
    }
  }, [budgets, selectedBudgetId]);

  const onAddBudgetBar = () => {
    setError('');
    const parsedLimit = Number(newLimit);

    if (!newCategory.trim()) {
      setError('Enter a category name for the budget bar.');
      return;
    }

    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Enter a valid limit amount greater than 0.');
      return;
    }

    const id = addBudget({
      ownerUserId: userId,
      category: newCategory.trim(),
      limitAmountMinor: fromMajor(parsedLimit),
      period: 'monthly',
      spentAmountMinor: 0
    });

    setNewCategory('');
    setNewLimit('');
    setSelectedBudgetId(id);
    markSynced();
  };

  const onUpdateProgress = () => {
    setError('');

    if (!selectedBudgetId) {
      setError('Create or select a budget first.');
      return;
    }

    const parsedAmount = Number(progressAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid progress amount greater than 0.');
      return;
    }

    updateBudgetSpent(selectedBudgetId, fromMajor(parsedAmount));
    setProgressAmount('');
    markSynced();
  };

  return (
    <Screen>
      <Text style={styles.title}>Budgets</Text>

      {budgets.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No budgets yet for this account. Add a budget bar to start tracking.</Text>
        </Card>
      ) : null}

      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          category={budget.category}
          spent={budget.spentAmountMinor}
          limit={budget.limitAmountMinor}
        />
      ))}

      <Card header="Add Budget Bar">
        <Input placeholder="Category (e.g. Emergency Fund)" value={newCategory} onChangeText={setNewCategory} />
        <View style={styles.spacer} />
        <Input placeholder="Limit amount" value={newLimit} onChangeText={setNewLimit} keyboardType="decimal-pad" />
        <View style={styles.spacer} />
        <RoundedButton label="Add budget bar" onPress={onAddBudgetBar} />
      </Card>

      <Card header="Update Budget Progress">
        <View style={styles.chipsWrap}>
          {budgets.map((budget) => (
            <Chip
              key={budget.id}
              label={budget.category}
              selected={selectedBudgetId === budget.id}
              onPress={() => setSelectedBudgetId(budget.id)}
            />
          ))}
        </View>
        <View style={styles.spacer} />
        <Input
          placeholder="Amount to add to progress"
          value={progressAmount}
          onChangeText={setProgressAmount}
          keyboardType="decimal-pad"
        />
        <View style={styles.spacer} />
        <RoundedButton label="Update budget progress" onPress={onUpdateProgress} variant={budgets.length ? 'primary' : 'disabled'} />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { ...typography.h2, color: colors.textPrimary },
    empty: { ...typography.caption, color: colors.textSecondary },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    spacer: { height: spacing.sm },
    error: { ...typography.caption, color: colors.danger }
  });
