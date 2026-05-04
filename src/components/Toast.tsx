import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function Toast({ message }: { message: string }) {
  const { colors, resolvedTheme } = useTheme();
  const styles = createStyles(colors, resolvedTheme === 'dark');

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, darkMode: boolean) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      bottom: 24,
      alignSelf: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: darkMode ? '#1E293B' : colors.textPrimary,
      borderRadius: radius.pill
    },
    text: { ...typography.caption, color: '#FFFFFF' }
  });
