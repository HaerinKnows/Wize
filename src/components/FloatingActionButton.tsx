import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { radius, shadow, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function FloatingActionButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable accessibilityLabel="Add transaction" onPress={onPress} style={styles.fab}>
      <Text style={styles.text}>+</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 28,
      width: 58,
      height: 58,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      ...shadow.card
    },
    text: { ...typography.h1, color: '#FFFFFF' }
  });
