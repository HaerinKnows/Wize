import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/screens/Screen';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { RoundedButton } from '@/components/RoundedButton';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toCategoryKey, toCategoryLabel } from '@/utils/category';
import { formatCurrency, getPreferredCurrency } from '@/utils/currency';

import { Ionicons } from '@expo/vector-icons';
import { getInsights, Insight } from '@/services/aiService';
import { useEffect } from 'react';

type MetricType = 'expense' | 'income';
type PeriodType = 'day' | 'week' | 'month' | 'year';

type AggregatedCategory = {
  key: string;
  label: string;
  amountMinor: number;
  percent: number;
  color: string;
};

const categoryBadgeMap: Record<string, string> = {
  shopping: 'SH',
  beauty: 'BE',
  pet: 'PT',
  entertainment: 'EN',
  other: 'OT',
  home: 'HM',
  groceries: 'GR',
  gambling: 'GB',
  salary: 'SL',
  transport: 'TR',
  food: 'FD',
  bills: 'BL',
  emergency_fund: 'EF'
};

const majorAmountLabel = (minor: number, currency: string) => formatCurrency(minor, currency);
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

const getWeekRange = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start: start.getTime(), end: end.getTime() };
};

const getDayRange = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start: start.getTime(), end: end.getTime() };
};

const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0);
  return { start: start.getTime(), end: end.getTime() };
};

const getYearRange = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 1, 0, 0, 0);
  const end = new Date(date.getFullYear() + 1, 0, 1, 0, 0, 0);
  return { start: start.getTime(), end: end.getTime() };
};

const chartPalette = (colors: ThemeColors) => [
  colors.warning,
  colors.primary,
  colors.success,
  colors.danger,
  '#7C8CF8',
  '#45B8AC'
];

function SegmentPill({
  label,
  selected,
  onPress,
  styles
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, selected && styles.segmentButtonSelected]}>
      <Text style={[styles.segmentButtonText, selected && styles.segmentButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function DonutChart({
  categories,
  styles,
  ringTrackColor,
  currency
}: {
  categories: AggregatedCategory[];
  styles: ReturnType<typeof createStyles>;
  ringTrackColor: string;
  currency: string;
}) {
  const radius = 74;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  const center = 86;
  const totalMinor = categories.reduce((sum, item) => sum + item.amountMinor, 0);
  let offset = 0;

  return (
    <View style={styles.donutWrap}>
      <Svg width={center * 2} height={center * 2}>
        <Circle cx={center} cy={center} r={radius} stroke={ringTrackColor} strokeWidth={strokeWidth} fill="transparent" />
        {categories.map((item) => {
          const ratio = totalMinor > 0 ? item.amountMinor / totalMinor : 0;
          const arc = circumference * ratio;
          const circle = (
            <Circle
              key={item.key}
              cx={center}
              cy={center}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              fill="transparent"
              strokeDasharray={`${arc} ${circumference - arc}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
          offset += arc;
          return circle;
        })}
      </Svg>
      <View style={styles.donutCenter}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.donutCenterValue}>
          {majorAmountLabel(totalMinor, currency)}
        </Text>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const allTransactions = useAppStore((state) => state.transactions);
  const preferredCurrency = useAppStore((state) => state.preferredCurrency);
  const userId = useAuthStore((state) => state.userId);
  const transactions = useMemo(() => {
    const effectiveUserId = userId ?? 'user_demo';
    return allTransactions.filter((t) => (t.ownerUserId ?? 'user_demo') === effectiveUserId);
  }, [allTransactions, userId]);

  const [metricType, setMetricType] = useState<MetricType>('expense');
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [baseDate, setBaseDate] = useState(new Date());
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const isPremium = useAuthStore((state) => state.isPremium);
  const accounts = useAppStore((state) => state.accounts);
  const budgets = useAppStore((state) => state.budgets);

  useEffect(() => {
    if (isPremium) {
      const fetchInsights = async () => {
        setLoadingInsights(true);
        try {
          const res = await getInsights({
            accounts,
            transactions,
            budgets,
            currency: preferredCurrency || getPreferredCurrency()
          });
          setInsights(res.insights);
        } catch (err) {
          console.error('Failed to fetch insights:', err);
        } finally {
          setLoadingInsights(false);
        }
      };
      fetchInsights();
    }
  }, [isPremium, accounts, transactions, budgets, preferredCurrency]);

  const onPrev = () => {
    const next = new Date(baseDate);
    if (periodType === 'day') next.setDate(next.getDate() - 1);
    else if (periodType === 'week') next.setDate(next.getDate() - 7);
    else if (periodType === 'month') next.setMonth(next.getMonth() - 1);
    else next.setFullYear(next.getFullYear() - 1);
    setBaseDate(next);
  };

  const onNext = () => {
    const next = new Date(baseDate);
    if (periodType === 'day') next.setDate(next.getDate() + 1);
    else if (periodType === 'week') next.setDate(next.getDate() + 7);
    else if (periodType === 'month') next.setMonth(next.getMonth() + 1);
    else next.setFullYear(next.getFullYear() + 1);
    setBaseDate(next);
  };

  const { range, formattedDateRange } = useMemo(() => {
    if (periodType === 'day') {
      return { range: getDayRange(baseDate), formattedDateRange: dateFormatter.format(baseDate) };
    }
    if (periodType === 'week') {
      const r = getWeekRange(baseDate);
      return {
        range: r,
        formattedDateRange: `${dateFormatter.format(new Date(r.start))} - ${dateFormatter.format(new Date(r.end - 1))}`
      };
    }
    if (periodType === 'month') {
      return { range: getMonthRange(baseDate), formattedDateRange: monthFormatter.format(baseDate) };
    }
    return { range: getYearRange(baseDate), formattedDateRange: baseDate.getFullYear().toString() };
  }, [periodType, baseDate]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type === 'transfer') return false;
      const ts = new Date(t.timestamp).getTime();
      if (Number.isNaN(ts) || ts < range.start || ts >= range.end) return false;

      if (metricType === 'expense') {
        return t.type === 'expense' || t.amountMinor < 0;
      }

      return t.type === 'income' || t.amountMinor > 0;
    });
  }, [metricType, range, transactions]);

  const categories = useMemo(() => {
    const totals = new Map<string, { label: string; amountMinor: number }>();

    filtered.forEach((t) => {
      const key = toCategoryKey(t.category);
      const current = totals.get(key);
      const absAmount = Math.abs(t.amountMinor);

      if (current) {
        totals.set(key, { ...current, amountMinor: current.amountMinor + absAmount });
        return;
      }

      totals.set(key, {
        label: toCategoryLabel(t.category),
        amountMinor: absAmount
      });
    });

    const list = Array.from(totals.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.amountMinor - a.amountMinor);
    const totalMinor = list.reduce((sum, item) => sum + item.amountMinor, 0);
    const palette = chartPalette(colors);

    return list.map((item, idx) => ({
      key: item.key,
      label: item.label,
      amountMinor: item.amountMinor,
      percent: totalMinor > 0 ? (item.amountMinor / totalMinor) * 100 : 0,
      color: palette[idx % palette.length]
    }));
  }, [filtered, colors]);

  const displayCurrency = useMemo(() => {
    return (preferredCurrency || filtered[0]?.currency) ?? transactions[0]?.currency ?? getPreferredCurrency();
  }, [filtered, transactions, preferredCurrency]);

  const topList = categories.slice(0, 6);

  return (
    <Screen style={styles.container}>
      <Text style={styles.pageTitle}>Get personalized insights</Text>

      <View style={styles.card}>
        <Pressable
          style={styles.metricTypeButton}
          onPress={() => setMetricType((prev) => (prev === 'expense' ? 'income' : 'expense'))}
        >
          <Text style={styles.metricTypeText}>{metricType === 'expense' ? 'Expenses ▼' : 'Income ▼'}</Text>
        </Pressable>

        <View style={styles.periodSwitch}>
          <SegmentPill label="Day" selected={periodType === 'day'} onPress={() => setPeriodType('day')} styles={styles} />
          <SegmentPill label="Week" selected={periodType === 'week'} onPress={() => setPeriodType('week')} styles={styles} />
          <SegmentPill label="Month" selected={periodType === 'month'} onPress={() => setPeriodType('month')} styles={styles} />
          <SegmentPill label="Year" selected={periodType === 'year'} onPress={() => setPeriodType('year')} styles={styles} />
        </View>

        <View style={styles.dateNavigator}>
          <Pressable onPress={onPrev} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.dateLabel}>{formattedDateRange}</Text>
          <Pressable onPress={onNext} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.chartSection}>
          <DonutChart
            categories={topList}
            styles={styles}
            ringTrackColor={colors.line}
            currency={displayCurrency}
          />
          <View style={styles.legendWrap}>
            {topList.length === 0 ? <Text style={styles.emptyText}>No data for this period yet.</Text> : null}
            {topList.map((item) => (
              <View key={item.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { borderColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={styles.legendPercent}>{item.percent.toFixed(2)}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.topListTitle}>Top lists</Text>
        {topList.length === 0 ? <Text style={styles.topListEmpty}>No category entries in this period yet.</Text> : null}

        {topList.map((item) => (
          <View key={`top_${item.key}`} style={styles.topItem}>
            <View style={[styles.topIconWrap, { backgroundColor: `${item.color}33` }]}>
              <Text style={styles.topIcon}>{categoryBadgeMap[item.key] ?? 'TX'}</Text>
            </View>

            <View style={styles.topMain}>
              <View style={styles.topMainHeader}>
                <Text style={styles.topLabel}>{item.label}</Text>
                <Text style={styles.topPercent}>{item.percent.toFixed(2)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.max(8, item.percent)}%` }]} />
              </View>
            </View>

            <Text style={styles.topAmount}>{formatCurrency(item.amountMinor, displayCurrency)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.insightsHeader}>
        <Text style={styles.insightsTitle}>Predictive Insights</Text>
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>PREMIUM</Text>
        </View>
      </View>

      {!isPremium ? (
        <Pressable style={styles.upgradeCard} onPress={() => router.push('/premium')}>
          <View style={styles.upgradeContent}>
            <Ionicons name="sparkles" size={24} color="#FFD700" />
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeTitle}>Unlock AI Coaching</Text>
              <Text style={styles.upgradeSubtitle}>Get proactive alerts and goal optimization</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </Pressable>
      ) : (
        <View style={styles.insightsList}>
          {loadingInsights && <Text style={styles.loadingText}>Analyzing your spending patterns...</Text>}
          {!loadingInsights && insights.length === 0 && (
            <Text style={styles.emptyText}>No insights available for this period yet.</Text>
          )}
          {insights.map((insight, idx) => (
            <View key={`insight_${idx}`} style={[styles.insightCard, insight.type === 'alert' ? styles.insightAlert : styles.insightOptimization]}>
              <View style={styles.insightIconWrap}>
                <Ionicons
                  name={insight.type === 'alert' ? 'warning-outline' : 'trending-up-outline'}
                  size={20}
                  color={insight.type === 'alert' ? colors.danger : colors.success}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightCardTitle}>{insight.title}</Text>
                <Text style={styles.insightCardDetail}>{insight.detail}</Text>
                {insight.impact && <Text style={styles.insightCardImpact}>{insight.impact}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg
    },
    container: {
      padding: spacing.lg,
      gap: spacing.md
    },
    pageTitle: {
      ...typography.h2,
      color: colors.textPrimary
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 28,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.line
    },
    metricTypeButton: {
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md
    },
    metricTypeText: {
      ...typography.h2,
      color: colors.textPrimary
    },
    periodSwitch: {
      flexDirection: 'row',
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 8,
      overflow: 'hidden'
    },
    segmentButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      backgroundColor: colors.bg
    },
    segmentButtonSelected: {
      backgroundColor: colors.primary
    },
    segmentButtonText: {
      ...typography.body,
      color: colors.textSecondary
    },
    segmentButtonTextSelected: {
      color: '#FFFFFF'
    },
    periodRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      marginBottom: spacing.sm
    },
    periodLabelWrap: {
      flex: 1
    },
    periodLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center'
    },
    periodLabelActive: {
      color: colors.textPrimary,
      fontWeight: '700'
    },
    dateNavigator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.bg,
      borderRadius: 12,
      padding: spacing.xs
    },
    navButton: {
      padding: spacing.sm,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.line
    },
    dateLabel: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    divider: {
      height: 1,
      backgroundColor: colors.line
    },
    chartSection: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md
    },
    donutWrap: {
      width: 172,
      height: 172,
      alignItems: 'center',
      justifyContent: 'center'
    },
    donutCenter: {
      position: 'absolute',
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card
    },
    donutCenterValue: {
      ...typography.h2,
      color: colors.textPrimary
    },
    legendWrap: {
      flex: 1,
      gap: spacing.xs
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs
    },
    legendDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 3
    },
    legendLabel: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1
    },
    legendPercent: {
      ...typography.caption,
      color: colors.textSecondary,
      minWidth: 56,
      textAlign: 'right'
    },
    topListTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md
    },
    topListEmpty: {
      ...typography.caption,
      color: colors.textSecondary,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md
    },
    topItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md
    },
    topIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center'
    },
    topIcon: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    topMain: {
      flex: 1
    },
    topMainHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs
    },
    topLabel: {
      ...typography.body,
      color: colors.textPrimary
    },
    topPercent: {
      ...typography.caption,
      color: colors.textSecondary
    },
    progressTrack: {
      marginTop: spacing.xs,
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.line,
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: colors.warning
    },
    topAmount: {
      ...typography.body,
      color: colors.textSecondary,
      minWidth: 96,
      textAlign: 'right'
    },
    emptyText: {
      ...typography.caption,
      color: colors.textSecondary
    },
    insightsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md
    },
    insightsTitle: {
      ...typography.h2,
      color: colors.textPrimary
    },
    premiumBadge: {
      backgroundColor: '#FFD700',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4
    },
    premiumBadgeText: {
      fontSize: 10,
      fontWeight: '900',
      color: '#000000'
    },
    upgradeCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.line,
      borderStyle: 'dashed'
    },
    upgradeContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md
    },
    upgradeTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    upgradeSubtitle: {
      ...typography.caption,
      color: colors.textSecondary
    },
    insightsList: {
      gap: spacing.sm
    },
    loadingText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontStyle: 'italic'
    },
    insightCard: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.line
    },
    insightAlert: {
      borderLeftWidth: 4,
      borderLeftColor: colors.danger
    },
    insightOptimization: {
      borderLeftWidth: 4,
      borderLeftColor: colors.success
    },
    insightIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center'
    },
    insightCardTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    insightCardDetail: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2
    },
    insightCardImpact: {
      ...typography.caption,
      color: colors.success,
      fontWeight: '700',
      marginTop: 4
    }
  });
