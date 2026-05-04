import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const tips = [
  'Set weekly spending caps for your top two expense categories.',
  'Split fixed bills into daily allocations to avoid month-end spikes.',
  'Review recurring subscriptions every 30 days and cancel inactive ones.',
  'Auto-transfer a small savings amount right after salary deposits.'
];

export default function SmartTipsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Screen>
      <Text style={styles.title}>Smart Tips</Text>
      {tips.map((tip, idx) => (
        <Card key={tip} header={`Tip ${idx + 1}`}>
          <Text style={styles.text}>{tip}</Text>
        </Card>
      ))}
      <RoundedButton label="Back" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { ...typography.h2, color: colors.textPrimary },
    text: { ...typography.body, color: colors.textPrimary }
  });
