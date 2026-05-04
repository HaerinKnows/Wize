import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { radius, spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.chipBlue,
      minHeight: 44,
      justifyContent: 'center'
    },
    selected: { backgroundColor: colors.primary },
    text: { ...typography.caption, color: colors.textPrimary },
    selectedText: { color: '#FFFFFF' }
  });
