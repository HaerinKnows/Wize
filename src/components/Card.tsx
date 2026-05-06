import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewProps } from 'react-native';
import { radius, shadow, spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type Props = ViewProps & {
  header?: string;
  rightAccessory?: React.ReactNode;
  footer?: React.ReactNode;
  tappable?: boolean;
  onPress?: () => void;
};

export function Card({ header, rightAccessory, footer, tappable, onPress, style, children, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const content = (
    <View style={[styles.card, style]} {...rest}>
      {header || rightAccessory ? (
        <View style={styles.headerContainer}>
          {header ? <Text style={styles.header}>{header}</Text> : <View />}
          {rightAccessory}
        </View>
      ) : null}
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
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm
    },
    header: {
      ...typography.caption,
      color: colors.textSecondary
    }
  });
