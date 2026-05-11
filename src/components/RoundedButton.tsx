import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { radius, spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'disabled';

export function RoundedButton({
  label,
  onPress,
  variant = 'primary',
  accessibilityLabel,
  style
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  accessibilityLabel?: string;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={variant === 'disabled'}
      onPress={onPress}
      style={[styles.base, variant === 'secondary' && styles.secondary, variant === 'disabled' && styles.disabled, style]}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      minHeight: 48,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg
    },
    secondary: {
      backgroundColor: colors.primarySoft
    },
    disabled: {
      opacity: 0.5
    },
    text: {
      ...typography.body,
      color: '#FFFFFF'
    },
    secondaryText: {
      color: colors.primary
    }
  });
