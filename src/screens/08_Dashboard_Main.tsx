import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { RoundedButton } from '@/components/RoundedButton';
import { Toast } from '@/components/Toast';
import { TransactionRow } from '@/components/TransactionRow';
import { Screen } from '@/screens/Screen';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { radius, spacing, ThemeColors, typography } from '@/design/tokens';
import { ThemeMode, useTheme } from '@/theme/ThemeProvider';
import { fromMajor, formatCurrency } from '@/utils/currency';
import { getPeriodRange, isTimestampInRange, TransactionPeriod, toLocalDateKey } from '@/utils/periods';
import { InlineAd } from '@/components/InlineAd';

type MenuItem = {
  label: string;
  route?: string;
  danger?: boolean;
};

const menuItems: MenuItem[] = [
  { label: 'Wize AI Chat', route: '/ai-chat' },
  { label: 'Smart Tips', route: '/smart-tips' },
  { label: 'Achievements', route: '/achievements' },
  { label: 'Analytics', route: '/analytics' },
  { label: 'History', route: '/history' },
  { label: 'Goal Setter', route: '/goal-setter' },
  { label: 'Budgets', route: '/budgets' },
  { label: 'Add Transaction', route: '/add-transaction' },
  { label: 'Log Out', danger: true }
];

const periodLabels: Record<TransactionPeriod, string> = {
  day: 'Recent Transactions',
  week: 'Past Week',
  month: 'Past Month',
  year: 'Past Year'
};

function HamburgerIcon({ color }: { color: string }) {
  return (
    <View style={stylesStatic.hamburgerWrap}>
      <View style={[stylesStatic.hamburgerLine, { backgroundColor: color }]} />
      <View style={[stylesStatic.hamburgerLine, { backgroundColor: color }]} />
      <View style={[stylesStatic.hamburgerLine, { backgroundColor: color }]} />
    </View>
  );
}

export default function DashboardMainScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [menuOpen, setMenuOpen] = useState(false);
  const allTransactions = useAppStore((s) => s.transactions);
  const lastSync = useAppStore((s) => s.lastSyncAt);
  const refreshSync = useAppStore((s) => s.refreshSync);
  const syncInProgress = useAppStore((s) => s.syncInProgress);
  const syncMessage = useAppStore((s) => s.syncMessage);
  const clearSyncMessage = useAppStore((s) => s.clearSyncMessage);
  const logout = useAuthStore((s) => s.logout);
  const userId = useAuthStore((s) => s.userId);
  const preferredCurrency = useAppStore((s) => s.preferredCurrency);

  const walletBalanceMinor = useAppStore((s) => s.walletBalanceMinor);
  const walletBalanceDate = useAppStore((s) => s.walletBalanceDate);
  const getDailyWalletBalance = useAppStore((s) => s.getDailyWalletBalance);
  const setWalletBalance = useAppStore((s) => s.setWalletBalance);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);
  const getRemainingBalance = useAppStore((s) => s.getRemainingBalance);
  
  const remainingBalance = getRemainingBalance(userId ?? 'user_demo');
  
  const [balanceInput, setBalanceInput] = useState('');
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [transactionPeriod, setTransactionPeriod] = useState<TransactionPeriod>('day');

  const { setPremium, checkSubscription } = useAuthStore();

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    // Forcing premium to false for ad testing ONLY for my account
    if (userId === 'user_79807800d0a114c1b1df6e8e') {
      setPremium(false);
    }
  }, [setPremium, userId]);

  useEffect(() => {
    const todayKey = toLocalDateKey();
    setShowBalanceModal(getDailyWalletBalance(todayKey) === undefined);
  }, [getDailyWalletBalance, walletBalanceDate, walletBalanceMinor]);

  const handleSetBalance = () => {
    const val = parseFloat(balanceInput);
    if (!isNaN(val) && val >= 0) {
      setWalletBalance(fromMajor(val));
      setShowBalanceModal(false);
    }
  };

  const recentTransactions = useMemo(() => {
    const effectiveUserId = userId ?? 'user_demo';
    const range = getPeriodRange(transactionPeriod);
    return allTransactions
      .filter(
        (t) =>
          (t.ownerUserId ?? 'user_demo') === effectiveUserId &&
          isTimestampInRange(t.timestamp, range)
      )
      .slice(0, 6);
  }, [allTransactions, transactionPeriod, userId]);

  const onMenuPress = (item: MenuItem) => {
    setMenuOpen(false);

    if (item.danger) {
      logout();
      router.replace('/auth-choice');
      return;
    }

    if (item.route) {
      router.push(item.route as never);
    }
  };

  const onRefreshSync = async () => {
    await refreshSync(userId ?? 'user_demo');
  };

  const onSetTheme = async (nextMode: ThemeMode) => {
    await setMode(nextMode);
  };

  useEffect(() => {
    if (!syncMessage) return;
    const timer = setTimeout(() => clearSyncMessage(), 2600);
    return () => clearTimeout(timer);
  }, [clearSyncMessage, syncMessage]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.title}>Wize</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Card style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
        <Text style={styles.empty}>Remaining Balance</Text>
        <Text style={{ ...typography.h1, color: remainingBalance >= 0 ? colors.success : colors.danger, marginTop: spacing.xs }}>
          {formatCurrency(remainingBalance, preferredCurrency)}
        </Text>
      </Card>

      <Card
        header={periodLabels[transactionPeriod]}
        rightAccessory={
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Transaction history"
              accessibilityRole="button"
              onPress={() => router.push('/history')}
              style={styles.historyButton}
            >
              <Text style={styles.historyButtonText}>History</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Add transaction"
              accessibilityRole="button"
              onPress={() => router.push('/add-transaction')}
              style={styles.addInlineButton}
            >
              <Text style={styles.addInlineButtonText}>+</Text>
            </Pressable>
          </View>
        }
      >
        <View style={styles.periodTabs}>
          {(Object.keys(periodLabels) as TransactionPeriod[]).map((period) => (
            <Pressable
              key={period}
              accessibilityRole="button"
              onPress={() => setTransactionPeriod(period)}
              style={[styles.periodTab, transactionPeriod === period && styles.periodTabSelected]}
            >
              <Text style={[styles.periodTabText, transactionPeriod === period && styles.periodTabTextSelected]}>
                {period === 'day' ? 'Day' : periodLabels[period].replace('Past ', '')}
              </Text>
            </Pressable>
          ))}
        </View>

        {recentTransactions.length === 0 ? <Text style={styles.empty}>No transactions for this period yet.</Text> : null}
        {(() => {
          const groups = new Map<string, typeof recentTransactions>();
          recentTransactions.forEach((t) => {
            const key = toLocalDateKey(t.timestamp);
            groups.set(key, [...(groups.get(key) ?? []), t]);
          });

          const today = toLocalDateKey();
          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterday = toLocalDateKey(yesterdayDate);

          return Array.from(groups.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([dateKey, items], index) => {
              let groupTitle = dateKey;
              if (dateKey === today) groupTitle = 'Recent Transactions';
              else if (dateKey === yesterday) groupTitle = 'Past Day';
              else {
                const d = new Date(dateKey);
                groupTitle = d.toLocaleDateString(undefined, { dateStyle: 'medium' });
              }

              return (
                <View key={dateKey}>
                  {transactionPeriod !== 'day' && (
                    <Text style={styles.groupTitle}>{groupTitle}</Text>
                  )}
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
                  {index === 0 && <InlineAd />}
                </View>
              );
            });
        })()}
      </Card>

      <Text style={styles.sync}>Sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Pending'}</Text>

      <Pressable style={styles.aiChatBanner} onPress={() => router.push('/ai-chat')}>
        <View style={styles.aiIconWrap}>
          <Text style={styles.aiLogoText}>W</Text>
        </View>
        <View>
          <Text style={styles.aiChatTitle}>Chat with Wize AI</Text>
          <Text style={styles.aiChatSubtitle}>Get personalized finance advice</Text>
        </View>
      </Pressable>

      {syncMessage ? <Toast message={syncMessage} /> : null}

      <Modal visible={showBalanceModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.balanceCard} header="Setup Wallet Balance">
            <Text style={styles.balanceLabel}>How much money do you have today? Wize will ask once per day and keep old days separate.</Text>
            <Input 
              placeholder="e.g. 5000" 
              value={balanceInput} 
              onChangeText={setBalanceInput} 
              keyboardType="decimal-pad" 
            />
            <View style={{ height: spacing.md }} />
            <RoundedButton label="Set Initial Balance" onPress={handleSetBalance} />
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}

const stylesStatic = StyleSheet.create({
  hamburgerWrap: {
    gap: 4
  },
  hamburgerLine: {
    width: 18,
    height: 2,
    borderRadius: 99
  }
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: colors.card
    },
    headerSpacer: {
      width: 44,
      height: 44
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary
    },
    empty: {
      ...typography.caption,
      color: colors.textSecondary
    },
    sync: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.xl
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      padding: spacing.lg
    },
    balanceCard: {
      backgroundColor: colors.card
    },
    balanceLabel: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.md
    },
    backdrop: {
      flex: 1,
      backgroundColor: colors.modalBackdrop,
      justifyContent: 'flex-start'
    },
    drawer: {
      width: '78%',
      minHeight: '100%',
      paddingTop: 52,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.card
    },
    drawerTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.sm
    },
    sectionTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.xs
    },
    themeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md
    },
    syncButton: {
      minHeight: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md
    },
    syncButtonText: {
      ...typography.caption,
      color: colors.textPrimary
    },
    menuList: {
      gap: spacing.xs
    },
    menuRow: {
      minHeight: 48,
      justifyContent: 'center',
      borderRadius: 12,
      paddingHorizontal: spacing.md
    },
    menuText: {
      ...typography.body,
      color: colors.textPrimary
    },
    danger: {
      color: colors.danger
    },
    aiChatBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.primary,
      padding: spacing.md,
      borderRadius: 18,
      marginTop: spacing.md
    },
    aiIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center'
    },
    aiEmoji: {
      fontSize: 22
    },
    aiLogoText: {
      ...typography.h3,
      color: '#FFFFFF',
      fontWeight: '900'
    },
    aiChatTitle: {
      ...typography.body,
      color: '#FFFFFF',
      fontWeight: '700'
    },
    aiChatSubtitle: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.8)'
    },
    addInlineButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center'
    },
    addInlineButtonText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 22
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs
    },
    historyButton: {
      minHeight: 32,
      paddingHorizontal: spacing.sm,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center'
    },
    historyButtonText: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    periodTabs: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: spacing.sm
    },
    periodTab: {
      flex: 1,
      minHeight: 34,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg
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
    groupTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '700',
      marginTop: spacing.sm,
      marginBottom: spacing.xs
    }
  });
