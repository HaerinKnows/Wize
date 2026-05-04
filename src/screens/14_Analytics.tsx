import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { RoundedButton } from '@/components/RoundedButton';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toCategoryKey, toCategoryLabel } from '@/utils/category';
import { formatCurrency, getPreferredCurrency } from '@/utils/currency';

type MetricType = 'expense' | 'income';
type PeriodType = 'month' | 'year';

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

const majorAmountLabel = (minor: number) => (minor / 100).toFixed(2);
const monthNameFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' });
const formatMonthLabel = (d: Date) => monthNameFormatter.format(d);
const monthStart = (base: Date) => new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0).getTime();
const monthEnd = (base: Date) => new Date(base.getFullYear(), base.getMonth() + 1, 1, 0, 0, 0, 0).getTime();
const yearStart = (base: Date) => new Date(base.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
const yearEnd = (base: Date) => new Date(base.getFullYear() + 1, 0, 1, 0, 0, 0, 0).getTime();

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
  ringTrackColor
}: {
  categories: AggregatedCategory[];
  styles: ReturnType<typeof createStyles>;
  ringTrackColor: string;
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
        <Text style={styles.donutCenterValue}>{majorAmountLabel(totalMinor)}</Text>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const allTransactions = useAppStore((s) => s.transactions);
  const userId = useAuthStore((s) => s.userId);
  const transactions = useMemo(
    () => allTransactions.filter((t) => (t.ownerUserId ?? 'user_demo') === userId),
    [allTransactions, userId]
  );

  const [metricType, setMetricType] = useState<MetricType>('expense');
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [periodIndex, setPeriodIndex] = useState(3);
  const [yearIndex, setYearIndex] = useState(3);

  const periodOptions = useMemo(() => {
    const now = new Date();
    const monthOptions = [3, 2, 1, 0].map((offset, idx, arr) => {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const monthLabel = formatMonthLabel(date);
      return {
        key: `${date.getFullYear()}_${date.getMonth()}`,
        label: idx === arr.length - 1 ? `This Month (${monthLabel})` : monthLabel,
        date
      };
    });

    const yearOptions = [3, 2, 1, 0].map((offset, idx, arr) => {
      const year = now.getFullYear() - offset;
      return {
        key: `${year}`,
        label: idx === arr.length - 1 ? 'This Year' : `${year}`,
        date: new Date(year, 0, 1)
      };
    });

    return { month: monthOptions, year: yearOptions };
  }, []);

  const selectedDate = periodType === 'month' ? periodOptions.month[periodIndex].date : periodOptions.year[yearIndex].date;

  const filtered = useMemo(() => {
    const lower = periodType === 'month' ? monthStart(selectedDate) : yearStart(selectedDate);
    const upper = periodType === 'month' ? monthEnd(selectedDate) : yearEnd(selectedDate);

    return transactions.filter((t) => {
      if (t.type === 'transfer') return false;
      const ts = new Date(t.timestamp).getTime();
      if (Number.isNaN(ts) || ts < lower || ts >= upper) return false;

      if (metricType === 'expense') {
        return t.type === 'expense' || t.amountMinor < 0;
      }

      return t.type === 'income' || t.amountMinor > 0;
    });
  }, [metricType, periodType, selectedDate, transactions]);

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
    return filtered[0]?.currency ?? transactions[0]?.currency ?? getPreferredCurrency();
  }, [filtered, transactions]);

  const topList = categories.slice(0, 6);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Get personalized insights</Text>

        <View style={styles.card}>
          <Pressable
            style={styles.metricTypeButton}
            onPress={() => setMetricType((prev) => (prev === 'expense' ? 'income' : 'expense'))}
          >
            <Text style={styles.metricTypeText}>{metricType === 'expense' ? 'Expenses ▼' : 'Income ▼'}</Text>
          </Pressable>

          <View style={styles.periodSwitch}>
            <SegmentPill label="Month" selected={periodType === 'month'} onPress={() => setPeriodType('month')} styles={styles} />
            <SegmentPill label="Year" selected={periodType === 'year'} onPress={() => setPeriodType('year')} styles={styles} />
          </View>

          <View style={styles.periodRow}>
            {(periodType === 'month' ? periodOptions.month : periodOptions.year).map((option, index) => (
              <Pressable
                key={option.key}
                onPress={() => (periodType === 'month' ? setPeriodIndex(index) : setYearIndex(index))}
                style={styles.periodLabelWrap}
              >
                <Text
                  style={[
                    styles.periodLabel,
                    (periodType === 'month' ? periodIndex === index : yearIndex === index) && styles.periodLabelActive
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.chartSection}>
            <DonutChart categories={topList} styles={styles} ringTrackColor={colors.line} />
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

        <RoundedButton label="Back" variant="secondary" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
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
    }
  });
