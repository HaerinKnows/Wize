import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function NumericPinPad({ onTap, onDelete }: { onTap: (n: string) => void; onDelete: () => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <View style={styles.grid}>
      {keys.map((k, idx) => (
        <Pressable
          key={`${k}_${idx}`}
          style={styles.key}
          disabled={!k}
          onPress={() => (k === 'del' ? onDelete() : onTap(k))}
        >
          <Text style={styles.label}>{k === 'del' ? '⌫' : k}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
    key: { width: 76, height: 56, alignItems: 'center', justifyContent: 'center' },
    label: { ...typography.h2, color: colors.textPrimary }
  });
