import React, { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { ThemeColors, typography } from '@/design/tokens';
import { fromMajor } from '@/utils/currency';
import { useTheme } from '@/theme/ThemeProvider';

export default function GoalSetterScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [title, setTitle] = useState('Emergency Fund');
  const [target, setTarget] = useState('10000');
  const [saved, setSaved] = useState('2500');

  const progress = useMemo(() => {
    const targetMinor = fromMajor(Number(target) || 0);
    const savedMinor = fromMajor(Number(saved) || 0);

    if (targetMinor <= 0) return 0;
    return Math.min(1, savedMinor / targetMinor);
  }, [saved, target]);

  return (
    <Screen>
      <Text style={styles.title}>Goal Setter</Text>
      <Input placeholder="Goal title" value={title} onChangeText={setTitle} />
      <Input placeholder="Target amount" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
      <Input placeholder="Saved amount" value={saved} onChangeText={setSaved} keyboardType="decimal-pad" />

      <Card header={title || 'Goal'}>
        <Text style={styles.caption}>{`Progress ${(progress * 100).toFixed(0)}%`}</Text>
        <Text style={styles.value}>{`Saved ${saved} of ${target}`}</Text>
      </Card>

      <RoundedButton label="Back" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { ...typography.h2, color: colors.textPrimary },
    caption: { ...typography.caption, color: colors.textSecondary },
    value: { ...typography.body, color: colors.textPrimary }
  });
