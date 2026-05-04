import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Transaction } from '@/types/domain';
import { useTheme } from '@/theme/ThemeProvider';

export type AnalyticsRange = '7D' | '30D' | '90D';

type Props = {
  range: AnalyticsRange;
  onRangeChange: (next: AnalyticsRange) => void;
  transactions: Transaction[];
};

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  '7D': 7,
  '30D': 30,
  '90D': 90
};

const RANGE_BARS: Record<AnalyticsRange, number> = {
  '7D': 7,
  '30D': 10,
  '90D': 15
};

export function ChartCard({ range, onRangeChange, transactions }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const points = useMemo(() => {
    const days = RANGE_DAYS[range];
    const bars = RANGE_BARS[range];
    const bucketSize = Math.ceil(days / bars);
    const now = Date.now();
    const msDay = 24 * 60 * 60 * 1000;

    const buckets = Array.from({ length: bars }, (_, index) => ({
      label: `${index + 1}`,
      inflow: 0,
      outflow: 0
    }));

    transactions.forEach((txn) => {
      if (txn.type === 'transfer') return;

      const ts = new Date(txn.timestamp).getTime();
      if (Number.isNaN(ts)) return;

      const diffDays = Math.floor((now - ts) / msDay);
      if (diffDays < 0 || diffDays >= days) return;

      const rawIndex = bars - 1 - Math.floor(diffDays / bucketSize);
      const idx = Math.max(0, Math.min(bars - 1, rawIndex));
      if (txn.amountMinor >= 0) {
        buckets[idx].inflow += txn.amountMinor;
      } else {
        buckets[idx].outflow += Math.abs(txn.amountMinor);
      }
    });

    return buckets.map((bucket) => ({
      label: bucket.label,
      inflow: bucket.inflow,
      outflow: bucket.outflow,
      magnitude: bucket.inflow + bucket.outflow
    }));
  }, [range, transactions]);

  const maxMagnitude = useMemo(() => {
    const values = points.map((p) => p.magnitude);
    return Math.max(1, ...values);
  }, [points]);

  return (
    <Card header="Cashflow">
      <View style={styles.row}>
        <Chip label="7D" selected={range === '7D'} onPress={() => onRangeChange('7D')} />
        <Chip label="30D" selected={range === '30D'} onPress={() => onRangeChange('30D')} />
        <Chip label="90D" selected={range === '90D'} onPress={() => onRangeChange('90D')} />
      </View>

      <View style={styles.chartWrap}>
        {points.map((point, idx) => {
          const ratio = point.magnitude / maxMagnitude;
          const height = Math.max(14, Math.round(ratio * 150));
          const inflowHeight = point.magnitude > 0 ? Math.round((point.inflow / point.magnitude) * height) : 0;
          const outflowHeight = Math.max(0, height - inflowHeight);

          return (
            <View key={`${point.label}_${idx}`} style={styles.barCol}>
              <View style={[styles.bar, { height }]}>
                {outflowHeight > 0 ? (
                  <View
                    style={[
                      styles.segment,
                      {
                        height: outflowHeight,
                        backgroundColor: colors.danger
                      }
                    ]}
                  />
                ) : null}
                {inflowHeight > 0 ? (
                  <View
                    style={[
                      styles.segment,
                      {
                        height: inflowHeight,
                        backgroundColor: colors.primary
                      }
                    ]}
                  />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.caption}>
        {range} window with {points.length} buckets. Blue = income, red = expense. A bucket can show both.
      </Text>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    chartWrap: {
      height: 170,
      borderRadius: 14,
      backgroundColor: colors.primarySoft,
      padding: spacing.sm,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
      marginBottom: spacing.sm
    },
    barCol: {
      flex: 1,
      height: '100%',
      justifyContent: 'flex-end'
    },
    bar: {
      width: '100%',
      borderRadius: 999,
      overflow: 'hidden',
      justifyContent: 'flex-end'
    },
    segment: {
      width: '100%'
    },
    caption: { ...typography.caption, color: colors.textSecondary }
  });
