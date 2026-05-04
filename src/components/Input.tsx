import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { radius, spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type InputProps = TextInputProps & {
  rightAccessory?: React.ReactNode;
};

export function Input({ rightAccessory, style, ...props }: InputProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrap}>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, style]}
        {...props}
      />
      {rightAccessory ? <View style={styles.rightAccessory}>{rightAccessory}</View> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.input,
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      backgroundColor: colors.card
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      backgroundColor: 'transparent',
      borderWidth: 0,
      minHeight: 32,
      paddingVertical: 0
    },
    rightAccessory: {
      marginLeft: spacing.sm
    }
  });
