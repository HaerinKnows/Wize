import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/screens/Screen';
import { Toggle } from '@/components/Toggle';
import { securityService } from '@/security/securityService';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type SecurityTab = 'overview' | 'mpin' | 'biometrics';
type MpinLength = 4 | 6;

export default function SecuritySettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<SecurityTab>('overview');
  const [mpinLength, setMpinLength] = useState<MpinLength | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const userId = useAuthStore((state) => state.userId);
  const setBiometric = useAuthStore((state) => state.setBiometric);

  useEffect(() => {
    let active = true;

    const loadSecurityState = async () => {
      if (!userId) return;

      const [storedMpinLength, storedBiometricEnabled] = await Promise.all([
        securityService.getMpinLength(userId),
        securityService.isBiometricEnabled(userId)
      ]);

      if (!active) return;
      setMpinLength(storedMpinLength);
      setBiometricEnabled(storedBiometricEnabled);
    };

    void loadSecurityState();

    return () => {
      active = false;
    };
  }, [userId]);

  const handleBiometricToggle = async (enabled: boolean) => {
    if (!userId) {
      setMessage('Please log in again before changing biometric settings.');
      return;
    }

    if (enabled) {
      const ok = await securityService.authenticateBiometric();
      if (!ok) {
        setMessage('Biometric unlock is unavailable or was cancelled on this device.');
        return;
      }
    }

    await securityService.setBiometricEnabled(userId, enabled);
    setBiometric(enabled);
    setBiometricEnabled(enabled);
    setMessage(enabled ? 'Biometric unlock enabled.' : 'Biometric unlock disabled.');
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Security & MPIN</Text>
      </View>

      <View style={styles.tabs}>
        <TabButton label="Overview" selected={activeTab === 'overview'} onPress={() => setActiveTab('overview')} colors={colors} />
        <TabButton label="MPIN" selected={activeTab === 'mpin'} onPress={() => setActiveTab('mpin')} colors={colors} />
        <TabButton
          label="Biometrics"
          selected={activeTab === 'biometrics'}
          onPress={() => setActiveTab('biometrics')}
          colors={colors}
        />
      </View>

      {activeTab === 'overview' ? (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Available Security Options</Text>
          <SecurityOption
            icon="keypad-outline"
            title="MPIN"
            subtitle={mpinLength ? `${mpinLength}-digit MPIN is configured` : 'Add a quick PIN for app unlocks'}
            actionLabel={mpinLength ? 'Manage' : 'Set up'}
            onPress={() => setActiveTab('mpin')}
            colors={colors}
          />
          <SecurityOption
            icon="finger-print-outline"
            title="Biometric Unlock"
            subtitle={biometricEnabled ? 'Enabled for this account' : 'Use fingerprint or face unlock when available'}
            actionLabel="Manage"
            onPress={() => setActiveTab('biometrics')}
            colors={colors}
          />
          <SecurityOption
            icon="lock-closed-outline"
            title="Privacy & Vault"
            subtitle="Control private balances and vault protections"
            actionLabel="Open"
            onPress={() => router.push('/privacy')}
            colors={colors}
          />
        </View>
      ) : null}

      {activeTab === 'mpin' ? (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="keypad-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Mobile PIN</Text>
              <Text style={styles.cardSubtitle}>
                {mpinLength ? `Your ${mpinLength}-digit MPIN is active.` : 'No MPIN is configured on this device.'}
              </Text>
            </View>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/mpin?fromSettings=1')}>
            <Text style={styles.primaryButtonText}>{mpinLength ? 'Verify MPIN' : 'Create MPIN'}</Text>
          </Pressable>
        </Card>
      ) : null}

      {activeTab === 'biometrics' ? (
        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="finger-print-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Biometric Unlock</Text>
                <Text style={styles.cardSubtitle}>Require device biometrics after MPIN verification.</Text>
              </View>
            </View>
            <Toggle enabled={biometricEnabled} onChange={handleBiometricToggle} />
          </View>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </Card>
      ) : null}
    </Screen>
  );
}

function TabButton({
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

function SecurityOption({
  icon,
  title,
  subtitle,
  actionLabel,
  onPress,
  colors
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel: string;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const styles = createOptionStyles(colors);

  return (
    <Card tappable onPress={onPress} style={styles.option}>
      <View style={styles.optionRow}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>
      </View>
    </Card>
  );
}

const tabStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tab: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xs
    },
    tabSelected: {
      backgroundColor: colors.primary
    },
    tabText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '700',
      textAlign: 'center'
    },
    tabTextSelected: {
      color: '#FFFFFF'
    }
  });

const createOptionStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    option: {
      padding: spacing.md
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center'
    },
    optionText: {
      flex: 1,
      gap: 2
    },
    optionTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    optionSubtitle: {
      ...typography.caption,
      color: colors.textSecondary
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2
    },
    actionText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '700'
    }
  });

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1
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
    tabs: {
      flexDirection: 'row',
      gap: spacing.xs,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.xs
    },
    content: {
      gap: spacing.md
    },
    sectionTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: spacing.xs
    },
    card: {
      gap: spacing.md
    },
    cardHeader: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center'
    },
    cardText: {
      flex: 1,
      gap: 2
    },
    cardTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    cardSubtitle: {
      ...typography.caption,
      color: colors.textSecondary
    },
    primaryButton: {
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md
    },
    primaryButtonText: {
      ...typography.body,
      color: '#FFFFFF',
      fontWeight: '700'
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm
    },
    message: {
      ...typography.caption,
      color: colors.textSecondary
    }
  });
