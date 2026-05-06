import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { cacheSmartTips, fallbackSmartTips, getCachedSmartTips, getSmartTips, SmartTip } from '@/services/aiService';
import { useAppStore } from '@/store/useAppStore';
import { getPreferredCurrency } from '@/utils/currency';

export default function SmartTipsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accounts = useAppStore((state) => state.accounts);
  const transactions = useAppStore((state) => state.transactions);
  const budgets = useAppStore((state) => state.budgets);
  const [tips, setTips] = useState<SmartTip[]>(fallbackSmartTips);
  const [source, setSource] = useState<'gemini' | 'cache' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadTips = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await getSmartTips({
        accounts,
        transactions,
        budgets,
        currency: getPreferredCurrency()
      });

      setTips(response.tips.length > 0 ? response.tips : fallbackSmartTips);
      setSource(response.source);
      if (response.source === 'gemini' && response.tips.length > 0) {
        await cacheSmartTips(response.tips);
      }
    } catch {
      const cached = await getCachedSmartTips();
      if (cached) {
        setTips(cached.tips);
        setSource('cache');
        setError('Gemini is offline right now. Showing your last Gemini tips.');
      } else {
        setTips(fallbackSmartTips);
        setSource('fallback');
        setError('Gemini is offline right now. Showing reliable defaults.');
      }
    } finally {
      setLoading(false);
    }
  }, [accounts, budgets, transactions]);

  useEffect(() => {
    void loadTips();
  }, [loadTips]);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Smart Tips</Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
      </View>
      <Text style={styles.subtitle}>
        {source === 'gemini' ? 'Powered by Gemini' : source === 'cache' ? 'Cached Gemini tips' : 'Personal finance defaults'}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {tips.map((tip, idx) => (
        <Card key={`${tip.title}-${idx}`} header={tip.title || `Tip ${idx + 1}`}>
          <Text style={styles.text}>{tip.detail}</Text>
        </Card>
      ))}
      <RoundedButton label={loading ? 'Refreshing...' : 'Refresh Tips'} variant={loading ? 'disabled' : 'primary'} onPress={loadTips} />
      <RoundedButton label="Back" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { ...typography.h2, color: colors.textPrimary },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
      justifyContent: 'space-between'
    },
    subtitle: { ...typography.caption, color: colors.textSecondary },
    error: { ...typography.caption, color: colors.danger },
    text: { ...typography.body, color: colors.textPrimary }
  });
