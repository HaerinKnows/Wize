import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewProps } from 'react-native';
import { radius, shadow, spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type Props = ViewProps & {
  header?: string;
  footer?: React.ReactNode;
  tappable?: boolean;
  onPress?: () => void;
};

export function Card({ header, footer, tappable, onPress, style, children, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const content = (
    <View style={[styles.card, style]} {...rest}>
      {header ? <Text style={styles.header}>{header}</Text> : null}
      {children}
      {footer}
    </View>
  );

  if (tappable) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: spacing.lg,
      ...shadow.card
    },
    header: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.sm
    }
  });
