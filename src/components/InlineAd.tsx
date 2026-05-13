import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { spacing, ThemeColors, typography, radius } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export function InlineAd() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const isPremium = useAuthStore((state) => state.isPremium);

  if (isPremium) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.adBadge}>
          <Text style={styles.adText}>Ad</Text>
        </View>
        <Text style={styles.sponsor}>Sponsored by Wize Partners</Text>
        <Ionicons name="ellipsis-horizontal" size={16} color={colors.textSecondary} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="card-outline" size={32} color={colors.primary} />
        </View>
        <View style={styles.main}>
          <Text style={styles.title}>Unlock your credit potential</Text>
          <Text style={styles.desc}>Compare the best cards tailored for your spending habits. See results in 30 seconds.</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.cta}>Check Offers</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bg,
      borderRadius: 16,
      padding: spacing.md,
      marginVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.line,
      borderStyle: 'dashed'
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      gap: spacing.xs
    },
    adBadge: {
      backgroundColor: colors.line,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4
    },
    adText: {
      fontSize: 9,
      fontWeight: '900',
      color: colors.textSecondary
    },
    sponsor: {
      ...typography.caption,
      color: colors.textSecondary,
      flex: 1,
      fontSize: 11
    },
    content: {
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'center'
    },
    imagePlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center'
    },
    main: {
      flex: 1
    },
    title: {
      ...typography.body,
      fontWeight: '700',
      color: colors.textPrimary
    },
    desc: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2
    },
    footer: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-end'
    },
    cta: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '800'
    }
  });
