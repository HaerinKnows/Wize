import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/screens/Screen';
import { Card } from '@/components/Card';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isPremium = useAuthStore((state) => state.isPremium);
  
  const [vaultEnabled, setVaultEnabled] = useState(false);
  const [hideAnalytics, setHideAnalytics] = useState(false);

  const handleToggleVault = (value: boolean) => {
    if (!isPremium) {
      alert("Upgrade to Wize Premium to unlock the Biometric Vault!");
      router.push('/account');
      return;
    }
    setVaultEnabled(value);
  };

  return (
    <Screen style={styles.container} isScrollable={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Privacy & Vault</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Security Features</Text>
        
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <View style={styles.iconCircle}>
                <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Biometric Vault</Text>
                <Text style={styles.rowSubtitle}>Lock sensitive wallets behind FaceID</Text>
              </View>
            </View>
            <Switch 
              value={vaultEnabled} 
              onValueChange={handleToggleVault}
              trackColor={{ false: colors.line, true: colors.primary }}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <View style={styles.iconCircle}>
                <Ionicons name="eye-off-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Hide Sensitive Analytics</Text>
                <Text style={styles.rowSubtitle}>Blur balances on the dashboard</Text>
              </View>
            </View>
            <Switch 
              value={hideAnalytics} 
              onValueChange={setHideAnalytics}
              trackColor={{ false: colors.line, true: colors.primary }}
            />
          </View>
        </Card>

        {!isPremium && (
          <Card style={styles.premiumCard}>
            <Ionicons name="sparkles" size={24} color="#FFD700" />
            <Text style={styles.premiumTitle}>Premium Privacy</Text>
            <Text style={styles.premiumText}>
              Get military-grade protection for your financial data with biometric locks.
            </Text>
            <Pressable style={styles.upgradeBtn} onPress={() => router.push('/account')}>
              <Text style={styles.upgradeBtnText}>Learn More</Text>
            </Pressable>
          </Card>
        )}
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    backButton: { padding: spacing.xs },
    title: { ...typography.h2, color: colors.textPrimary },
    content: { gap: spacing.md },
    sectionTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: spacing.xs,
    },
    card: { padding: spacing.md, marginBottom: spacing.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    rowSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    premiumCard: {
      marginTop: spacing.lg,
      padding: spacing.lg,
      backgroundColor: colors.bg,
      borderStyle: 'dashed',
      borderColor: colors.primary,
      borderWidth: 1,
      alignItems: 'center',
      textAlign: 'center',
      gap: spacing.sm,
    },
    premiumTitle: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    premiumText: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    upgradeBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 12,
      marginTop: spacing.xs,
    },
    upgradeBtnText: {
      ...typography.body,
      color: '#FFFFFF',
      fontWeight: '700',
    }
  });
