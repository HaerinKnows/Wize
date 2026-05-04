import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Input } from '@/components/Input';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { fromMajor, getPreferredCurrency } from '@/utils/currency';
import { toCategoryLabel } from '@/utils/category';
import { TxType } from '@/types/domain';
import { useTheme } from '@/theme/ThemeProvider';

type CategoryTemplate = {
  key: string;
  label: string;
  emoji: string;
};

const expenseTemplates: CategoryTemplate[] = [
  { key: 'food', label: 'Food', emoji: '🍽️' },
  { key: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { key: 'telephone', label: 'Telephone', emoji: '📱' },
  { key: 'shopping', label: 'Shopping', emoji: '🛒' },
  { key: 'education', label: 'Education', emoji: '📚' },
  { key: 'beauty', label: 'Beauty', emoji: '💄' },
  { key: 'sport', label: 'Sport', emoji: '🏊' },
  { key: 'social', label: 'Social', emoji: '👥' },
  { key: 'transportation', label: 'Transportation', emoji: '🚌' },
  { key: 'clothing', label: 'Clothing', emoji: '👕' },
  { key: 'car', label: 'Car', emoji: '🚗' },
  { key: 'wine', label: 'Wine', emoji: '🍷' },
  { key: 'cigarette', label: 'Cigarette', emoji: '🚬' },
  { key: 'electronics', label: 'Electronics', emoji: '🎧' },
  { key: 'travel', label: 'Travel', emoji: '✈️' },
  { key: 'health', label: 'Health', emoji: '🩺' },
  { key: 'pet', label: 'Pet', emoji: '🐶' },
  { key: 'repair', label: 'Repair', emoji: '🛠️' },
  { key: 'housing', label: 'Housing', emoji: '🏘️' },
  { key: 'home', label: 'Home', emoji: '🏠' },
  { key: 'gift', label: 'Gift', emoji: '🎁' },
  { key: 'donate', label: 'Donate', emoji: '💝' },
  { key: 'lottery', label: 'Lottery', emoji: '🎱' },
  { key: 'snacks', label: 'Snacks', emoji: '🧁' },
  { key: 'baby', label: 'Baby', emoji: '👶' },
  { key: 'vegetable', label: 'Vegetable', emoji: '🥕' },
  { key: 'fruit', label: 'Fruit', emoji: '🍇' },
  { key: 'bills', label: 'Bills', emoji: '🧾' }
];

const incomeTemplates: CategoryTemplate[] = [
  { key: 'salary', label: 'Salary', emoji: '💼' },
  { key: 'bonus', label: 'Bonus', emoji: '🎉' },
  { key: 'freelance', label: 'Freelance', emoji: '🧑‍💻' },
  { key: 'business', label: 'Business', emoji: '🏢' },
  { key: 'investment', label: 'Investment', emoji: '📈' },
  { key: 'interest', label: 'Interest', emoji: '🏦' },
  { key: 'gift income', label: 'Gift Income', emoji: '🎁' },
  { key: 'refund', label: 'Refund', emoji: '↩️' },
  { key: 'rental', label: 'Rental', emoji: '🏘️' },
  { key: 'other income', label: 'Other Income', emoji: '💰' }
];

export default function AddTransactionScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accounts = useAppStore((s) => s.accounts);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const markSynced = useAppStore((s) => s.markSynced);
  const userId = useAuthStore((s) => s.userId);

  const [type, setType] = useState<TxType>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [fromAccount, setFromAccount] = useState(accounts[0]?.id ?? '');
  const [toAccount, setToAccount] = useState(accounts[1]?.id ?? accounts[0]?.id ?? '');
  const [error, setError] = useState('');

  const accountName = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a.name])), [accounts]);
  const activeTemplates = type === 'income' ? incomeTemplates : expenseTemplates;
  const selectedCategory = toCategoryLabel(category.trim());

  const onSave = () => {
    setError('');
    const major = Number(amount);

    if (Number.isNaN(major) || major <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }

    if (type === 'transfer' && fromAccount === toAccount) {
      setError('Transfer requires different source and destination accounts.');
      return;
    }

    const minor = fromMajor(major);
    const rawCategory =
      type === 'transfer'
        ? 'transfer'
        : category.trim() || (type === 'income' ? 'income' : 'expense');
    const categoryLabel = toCategoryLabel(rawCategory);
    const txCurrency = accounts.find((account) => account.id === fromAccount)?.currency ?? getPreferredCurrency();

    addTransaction({
      ownerUserId: userId ?? 'user_demo',
      accountId: fromAccount,
      type,
      category: categoryLabel,
      amountMinor: type === 'expense' ? -minor : minor,
      currency: txCurrency,
      notes: type === 'transfer' ? `${notes} -> ${accountName[toAccount] ?? 'destination'}`.trim() : notes,
      metadata: { source: 'manual' }
    });

    markSynced();
    router.replace('/dashboard');
  };

  const setTemplateType = (nextType: 'expense' | 'income') => {
    setType(nextType);
  };

  return (
    <Screen>
      <Text style={styles.title}>Add Transaction</Text>

      <Card header="Start with a template, customize freely">
        <View style={styles.templateShell}>
          <View style={styles.segmentWrap}>
            <Pressable
              style={[styles.segmentButton, type === 'expense' && styles.segmentButtonSelected]}
              onPress={() => setTemplateType('expense')}
            >
              <Text style={[styles.segmentText, type === 'expense' && styles.segmentTextSelected]}>Expenses</Text>
            </Pressable>
            <Pressable
              style={[styles.segmentButton, type === 'income' && styles.segmentButtonSelected]}
              onPress={() => setTemplateType('income')}
            >
              <Text style={[styles.segmentText, type === 'income' && styles.segmentTextSelected]}>Income</Text>
            </Pressable>
          </View>

          <View style={styles.transferChipRow}>
            <Chip label="Transfer" selected={type === 'transfer'} onPress={() => setType('transfer')} />
            {type === 'transfer' ? <Text style={styles.transferHint}>Transfer uses category "Transfer".</Text> : null}
          </View>

          {type !== 'transfer' ? (
            <View style={styles.templateGrid}>
              {activeTemplates.map((item) => {
                const selected = selectedCategory === toCategoryLabel(item.label);
                return (
                  <Pressable
                    key={item.key}
                    style={styles.templateCell}
                    onPress={() => {
                      setCategory(item.label);
                    }}
                  >
                    <View style={[styles.templateIconWrap, selected && styles.templateIconWrapSelected]}>
                      <Text style={styles.templateEmoji}>{item.emoji}</Text>
                    </View>
                    <Text style={[styles.templateLabel, selected && styles.templateLabelSelected]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </Card>

      <Card header="Account">
        <View style={styles.rowWrap}>
          {accounts.map((acc) => (
            <Chip
              key={acc.id}
              label={acc.name}
              selected={fromAccount === acc.id}
              onPress={() => setFromAccount(acc.id)}
            />
          ))}
        </View>
        {type === 'transfer' ? (
          <View style={styles.transferWrap}>
            <Text style={styles.caption}>Transfer To</Text>
            <View style={styles.rowWrap}>
              {accounts.map((acc) => (
                <Chip key={`to_${acc.id}`} label={acc.name} selected={toAccount === acc.id} onPress={() => setToAccount(acc.id)} />
              ))}
            </View>
          </View>
        ) : null}
      </Card>

      <Input
        placeholder={type === 'transfer' ? 'Transfer category is automatic' : 'Category (template or custom)'}
        value={type === 'transfer' ? 'Transfer' : category}
        onChangeText={setCategory}
        editable={type !== 'transfer'}
      />
      <Input placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Input placeholder="Notes (shown in Recent Transactions)" value={notes} onChangeText={setNotes} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <RoundedButton label="Save Transaction" onPress={onSave} />
      <RoundedButton label="Cancel" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { ...typography.h2, color: colors.textPrimary },
    templateShell: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.bg,
      padding: spacing.md,
      gap: spacing.md
    },
    segmentWrap: {
      minHeight: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: 'hidden',
      flexDirection: 'row'
    },
    segmentButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card
    },
    segmentButtonSelected: {
      backgroundColor: colors.primary
    },
    segmentText: {
      ...typography.body,
      color: colors.textPrimary
    },
    segmentTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700'
    },
    transferChipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm
    },
    transferHint: {
      ...typography.caption,
      color: colors.textSecondary,
      flex: 1
    },
    templateGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap'
    },
    templateCell: {
      width: '25%',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      gap: spacing.xs
    },
    templateIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.card
    },
    templateIconWrapSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft
    },
    templateEmoji: {
      fontSize: 21
    },
    templateLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center'
    },
    templateLabelSelected: {
      color: colors.textPrimary,
      fontWeight: '700'
    },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    transferWrap: { marginTop: spacing.md, gap: spacing.sm },
    caption: { ...typography.caption, color: colors.textSecondary },
    error: { ...typography.caption, color: colors.danger }
  });
