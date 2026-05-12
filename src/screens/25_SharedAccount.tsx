import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { useAppStore } from '@/store/useAppStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const parseMoneyToMinor = (value: string) => {
  const normalized = value.replace(/,/g, '').trim();
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
};

const formatMoney = (amountMinor: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amountMinor / 100);

export default function SharedAccountScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sharedAccounts = useAppStore((state) => state.sharedAccounts);
  const addSharedAccount = useAppStore((state) => state.addSharedAccount);
  const [name, setName] = useState('');
  const [members, setMembers] = useState('');
  const [balance, setBalance] = useState('');
  const [message, setMessage] = useState('');

  const createSharedAccount = () => {
    const memberList = members
      .split(',')
      .map((member) => member.trim())
      .filter(Boolean);

    if (!name.trim() || memberList.length < 2) {
      setMessage('Add an account name and at least two members.');
      return;
    }

    addSharedAccount({
      name: name.trim(),
      members: memberList,
      balanceMinor: parseMoneyToMinor(balance)
    });
    setName('');
    setMembers('');
    setBalance('');
    setMessage('Shared account created.');
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Shared Account</Text>
      </View>

      <Card style={styles.formCard}>
        <Text style={styles.cardTitle}>Create Joint / Shared Account</Text>
        <Input placeholder="Account name, e.g. Family Groceries" value={name} onChangeText={setName} />
        <Input
          placeholder="Members, separated by commas"
          value={members}
          onChangeText={setMembers}
          autoCapitalize="words"
        />
        <Input placeholder="Starting balance" value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />
        <RoundedButton label="Create Shared Account" onPress={createSharedAccount} />
        {message ? <Text style={[styles.message, message.includes('created') && styles.success]}>{message}</Text> : null}
      </Card>

      <Text style={styles.sectionTitle}>Existing Shared Accounts</Text>
      <View style={styles.list}>
        {sharedAccounts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={26} color={colors.primary} />
            <Text style={styles.emptyText}>No shared accounts yet.</Text>
          </Card>
        ) : (
          sharedAccounts.map((account) => (
            <Card key={account.id} style={styles.accountCard}>
              <View style={styles.accountTop}>
                <View>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.members}>{account.members.join(', ')}</Text>
                </View>
                <Text style={styles.balance}>{formatMoney(account.balanceMinor, account.currency)}</Text>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md
    },
    backButton: {
      padding: spacing.xs
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary
    },
    formCard: {
      gap: spacing.md
    },
    cardTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    message: {
      ...typography.caption,
      color: colors.warning,
      textAlign: 'center'
    },
    success: {
      color: colors.success
    },
    sectionTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '700',
      letterSpacing: 1
    },
    list: {
      gap: spacing.md
    },
    emptyCard: {
      alignItems: 'center',
      gap: spacing.sm
    },
    emptyText: {
      ...typography.caption,
      color: colors.textSecondary
    },
    accountCard: {
      padding: spacing.md
    },
    accountTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md
    },
    accountName: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    members: {
      ...typography.caption,
      color: colors.textSecondary
    },
    balance: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '700'
    }
  });
