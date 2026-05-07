import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { radius, spacing, ThemeColors, typography } from '@/design/tokens';
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
  { key: 'bills', label: 'Bills', emoji: '🧾' },
  { key: 'other', label: 'Other', emoji: '❓' }
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
  { key: 'other income', label: 'Other Income', emoji: '💰' },
  { key: 'other', label: 'Other', emoji: '❓' }
];

export default function AddTransactionScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accounts = useAppStore((s) => s.accounts);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const markSynced = useAppStore((s) => s.markSynced);
  const userId = useAuthStore((s) => s.userId);
  const walletBalanceMinor = useAppStore((s) => s.walletBalanceMinor);

  const [type, setType] = useState<TxType>('expense');
  const [category, setCategory] = useState('');
  const [isOther, setIsOther] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [fromAccount] = useState(accounts[0]?.id ?? '');
  const [error, setError] = useState('');

  const [categoryModal, setCategoryModal] = useState(false);

  const accountName = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a.name])), [accounts]);
  const activeTemplates = type === 'income' ? incomeTemplates : expenseTemplates;

  const onSave = () => {
    setError('');
    const major = Number(amount);

    if (Number.isNaN(major) || major <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }

    const minor = fromMajor(major);

    if (type === 'expense' && minor > walletBalanceMinor) {
      setError(`Amount exceeds your wallet limit of ${major > 0 ? (walletBalanceMinor / 100).toFixed(2) : '0.00'}.`);
      return;
    }

    const categoryLabel = toCategoryLabel(category.trim() || (type === 'income' ? 'income' : 'expense'));
    const txCurrency = accounts.find((account) => account.id === fromAccount)?.currency ?? getPreferredCurrency();

    addTransaction({
      ownerUserId: userId ?? 'user_demo',
      accountId: fromAccount,
      type,
      category: categoryLabel,
      amountMinor: type === 'expense' ? -minor : minor,
      currency: txCurrency,
      notes: notes,
      metadata: { source: 'manual' }
    });

    markSynced();
    router.replace('/dashboard');
  };

  const handleCategorySelect = (item: CategoryTemplate) => {
    if (item.key === 'other') {
      setIsOther(true);
      setCategory('');
    } else {
      setIsOther(false);
      setCategory(item.label);
    }
    setCategoryModal(false);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Add Transaction</Text>

        <View style={styles.segmentWrap}>
          <Pressable
            style={[styles.segmentButton, type === 'expense' && styles.segmentButtonSelected]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.segmentText, type === 'expense' && styles.segmentTextSelected]}>Expenses</Text>
          </Pressable>
          <Pressable
            style={[styles.segmentButton, type === 'income' && styles.segmentButtonSelected]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.segmentText, type === 'income' && styles.segmentTextSelected]}>Income</Text>
          </Pressable>
        </View>

        {/* Account selection hidden as per request */}
        {/*
        <Card header="Account">
          <Pressable style={styles.dropdown} onPress={() => setFromAccountModal(true)}>
            <Text style={styles.dropdownText}>{accountName[fromAccount] || 'Select Account'}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </Pressable>
        </Card>
        */}

        <Card header="Category">
          <Pressable style={styles.dropdown} onPress={() => setCategoryModal(true)}>
            <Text style={styles.dropdownText}>{category || (isOther ? 'Other (type below)' : 'Select Category')}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </Pressable>
          {isOther && (
            <Input
              placeholder="Type custom category..."
              value={category}
              onChangeText={setCategory}
              autoFocus
              style={styles.customCategoryInput}
            />
          )}
        </Card>

        <Card header="Details">
          <Input placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          <Input placeholder="Notes (optional)" value={notes} onChangeText={setNotes} />
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <RoundedButton label="Save Transaction" onPress={onSave} />
        <RoundedButton label="Cancel" variant="secondary" onPress={() => router.back()} />
      </ScrollView>

      {/* Modals for Dropdowns */}
      <SelectionModal
        visible={categoryModal}
        title="Select Category"
        data={activeTemplates}
        onSelect={handleCategorySelect}
        onClose={() => setCategoryModal(false)}
        renderItem={(item) => (
          <View style={styles.modalRow}>
            <Text style={styles.modalEmoji}>{item.emoji}</Text>
            <Text style={styles.modalLabel}>{item.label}</Text>
          </View>
        )}
      />



    </Screen>
  );
}

function SelectionModal<T>({
  visible,
  title,
  data,
  onSelect,
  onClose,
  renderItem
}: {
  visible: boolean;
  title: string;
  data: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={data}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <Pressable style={styles.modalItem} onPress={() => onSelect(item)}>
                {renderItem(item)}
              </Pressable>
            )}
            style={styles.modalList}
          />
          <RoundedButton label="Close" variant="secondary" onPress={onClose} />
        </View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      gap: spacing.md,
      paddingBottom: spacing.xl
    },
    title: { ...typography.h2, color: colors.textPrimary },
    segmentWrap: {
      flexDirection: 'row',
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: 'hidden'
    },
    segmentButton: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center'
    },
    segmentButtonSelected: {
      backgroundColor: colors.primary
    },
    segmentText: { ...typography.body, color: colors.textSecondary },
    segmentTextSelected: { color: '#FFFFFF', fontWeight: '700' },
    dropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      padding: spacing.md,
      minHeight: 52
    },
    dropdownText: { ...typography.body, color: colors.textPrimary },
    dropdownArrow: { fontSize: 12, color: colors.textSecondary },
    transferTarget: { marginTop: spacing.md, gap: spacing.sm },
    caption: { ...typography.caption, color: colors.textSecondary },
    customCategoryInput: { marginTop: spacing.sm },
    error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.modalBackdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: spacing.lg,
      gap: spacing.md,
      maxHeight: '80%'
    },
    modalTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    modalList: { flexGrow: 0 },
    modalItem: {
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line
    },
    modalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    modalEmoji: { fontSize: 20 },
    modalLabel: { ...typography.body, color: colors.textPrimary }
  });
