import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Toggle } from '@/components/Toggle';
import { Screen } from '@/screens/Screen';
import { NotificationSettings, useAppStore } from '@/store/useAppStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type NotificationKey = keyof NotificationSettings;

const notificationRows: Array<{
  key: NotificationKey;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}> = [
  {
    key: 'budgetAlerts',
    icon: 'wallet-outline',
    title: 'Budget Alerts',
    subtitle: 'Notify me when spending approaches my limits.'
  },
  {
    key: 'billReminders',
    icon: 'calendar-outline',
    title: 'Bill Reminders',
    subtitle: 'Remind me before recurring payments are due.'
  },
  {
    key: 'aiInsights',
    icon: 'sparkles-outline',
    title: 'AI Insights',
    subtitle: 'Send useful tips from Wize AI.'
  },
  {
    key: 'sharedAccountActivity',
    icon: 'people-outline',
    title: 'Shared Account Activity',
    subtitle: 'Alert me when members add shared expenses.'
  }
];

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const settings = useAppStore((state) => state.notificationSettings);
  const updateNotificationSettings = useAppStore((state) => state.updateNotificationSettings);

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <Text style={styles.sectionTitle}>Notification Preferences</Text>
      <View style={styles.list}>
        {notificationRows.map((row) => (
          <Card key={row.key} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconCircle}>
                <Ionicons name={row.icon} size={21} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
              </View>
              <Toggle
                enabled={settings[row.key]}
                onChange={(enabled) => updateNotificationSettings({ [row.key]: enabled })}
              />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1
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
    sectionTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '700',
      letterSpacing: 1
    },
    list: {
      gap: spacing.md
    },
    card: {
      padding: spacing.md
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center'
    },
    rowText: {
      flex: 1,
      gap: 2
    },
    rowTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700'
    },
    rowSubtitle: {
      ...typography.caption,
      color: colors.textSecondary
    }
  });
