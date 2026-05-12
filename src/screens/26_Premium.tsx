import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type BillingPeriod = 'monthly' | 'yearly';

const features = [
  'AI-powered Smart Tips',
  'Voice finance coaching',
  'Premium themes and privacy vault',
  'Automatic e-wallet transaction syncing',
  'Data exporter',
  'Ad-free experience'
];

export default function PremiumScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const setPremium = useAuthStore((state) => state.setPremium);

  const plan = period === 'monthly'
    ? { label: 'Monthly', price: 'PHP 59.99', detail: 'Billed every month' }
    : { label: 'Yearly', price: 'PHP 599.99', detail: 'Billed once per year' };

  const activatePremium = () => {
    setPremium(true);
    router.replace('/account');
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Wize Premium</Text>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.starCircle}>
          <Ionicons name="star" size={28} color="#FFD700" />
        </View>
        <Text style={styles.heroTitle}>Unlock every premium feature</Text>
        <Text style={styles.heroText}>Choose a duration, review the price, then activate Premium for this account.</Text>
      </Card>

      <View style={styles.tabs}>
        <PlanTab label="Monthly" selected={period === 'monthly'} onPress={() => setPeriod('monthly')} colors={colors} />
        <PlanTab label="Yearly" selected={period === 'yearly'} onPress={() => setPeriod('yearly')} colors={colors} />
      </View>

      <Card style={styles.planCard}>
        <Text style={styles.planLabel}>{plan.label} Premium</Text>
        <Text style={styles.price}>{plan.price}</Text>
        <Text style={styles.planDetail}>{plan.detail}</Text>
        <View style={styles.trialRow}>
          <Ionicons name="gift-outline" size={18} color={colors.success} />
          <Text style={styles.trialText}>Includes a 30-day free trial</Text>
        </View>
        <RoundedButton label={`Choose ${plan.label}`} onPress={activatePremium} />
      </Card>

      <View style={styles.featureList}>
        <Text style={styles.sectionTitle}>Included</Text>
        {features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function PlanTab({
  label,
  selected,
  onPress,
  colors
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const styles = tabStyles(colors);

  return (
    <Pressable onPress={onPress} style={[styles.tab, selected && styles.tabSelected]}>
      <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const tabStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tab: {
      flex: 1,
      minHeight: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center'
    },
    tabSelected: {
      backgroundColor: colors.primary
    },
    tabText: {
      ...typography.body,
      color: colors.textSecondary,
      fontWeight: '700'
    },
    tabTextSelected: {
      color: '#FFFFFF'
    }
  });

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingBottom: spacing.xl * 5
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md
    },
    backButton: {
      padding: spacing.xs
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary
    },
    heroCard: {
      alignItems: 'center',
      gap: spacing.sm
    },
    starCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center'
    },
    heroTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      textAlign: 'center'
    },
    heroText: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center'
    },
    tabs: {
      flexDirection: 'row',
      gap: spacing.xs,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.xs
    },
    planCard: {
      gap: spacing.sm
    },
    planLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '700',
      letterSpacing: 1
    },
    price: {
      ...typography.h1,
      color: colors.textPrimary
    },
    planDetail: {
      ...typography.body,
      color: colors.textSecondary
    },
    trialRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.sm
    },
    trialText: {
      ...typography.caption,
      color: colors.success,
      fontWeight: '700'
    },
    sectionTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '700',
      letterSpacing: 1
    },
    featureList: {
      gap: spacing.sm
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm
    },
    featureText: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1
    }
  });
