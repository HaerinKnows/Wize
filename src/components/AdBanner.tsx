import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';

export function AdBanner() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isPremium = useAuthStore((state) => state.isPremium);

  if (isPremium) return null;

  return (
    <Pressable style={styles.banner} onPress={() => router.push('/premium')}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>Sponsored</Text>
        <Text style={styles.text}>Go ad-free with Wize Premium</Text>
      </View>
      <Text style={styles.cta}>Upgrade</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    banner: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      bottom: 86,
      minHeight: 58,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center'
    },
    copy: {
      flex: 1
    },
    label: {
      ...typography.caption,
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 14
    },
    text: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    cta: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '800'
    }
  });
