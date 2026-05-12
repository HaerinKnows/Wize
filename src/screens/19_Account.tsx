import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { Screen } from '@/screens/Screen';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useAppStore } from '@/store/useAppStore';

export default function AccountScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isAuthenticated, logout, userId, isPremium } = useAuthStore();
  const { preferredCurrency, setPreferredCurrency, userProfile, sharedAccounts } = useAppStore();
  const displayName = userProfile.displayName.trim() || userId || 'User';

  const toggleCurrency = () => {
    setPreferredCurrency(preferredCurrency === 'PHP' ? 'USD' : 'PHP');
  };

  const handleLogout = () => {
    logout();
    router.replace('/dashboard');
  };

  if (!isAuthenticated) {
    return (
      <Screen style={styles.container}>
        <View style={styles.guestHeader}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color={colors.textSecondary} />
          </View>
          <Text style={styles.guestTitle}>Guest Mode</Text>
          <Text style={styles.guestSubtitle}>Sign in to sync your data across devices</Text>
        </View>

        <Card style={styles.authCard}>
          <Pressable style={styles.authButton} onPress={() => router.push('/login')}>
            <Text style={styles.authButtonText}>Log In</Text>
          </Pressable>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.divider} />
          </View>
          <Pressable style={[styles.authButton, styles.signupButton]} onPress={() => router.push('/signup')}>
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </Pressable>
        </Card>

        <View style={styles.menuList}>
           <MenuItem icon="settings-outline" label="Settings" onPress={() => alert('Settings coming soon!')} colors={colors} />
           <MenuItem 
             icon="cash-outline" 
             label={`Currency (${preferredCurrency})`} 
             onPress={toggleCurrency} 
             colors={colors} 
           />
           <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => alert('Support available at support@wize.com')} colors={colors} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
           <View style={styles.avatar}>
             <Text style={styles.avatarInitial}>{userId?.charAt(0).toUpperCase() || 'U'}</Text>
           </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={isPremium ? styles.userStatusPremium : styles.userStatusStandard}>
            {isPremium ? 'Premium Member' : 'Standard Member'}
          </Text>
        </View>
      </View>

      <Pressable onPress={() => router.push('/premium')}>
        <Card style={[styles.premiumCard, !isPremium && styles.standardCard]}>
        <View style={styles.premiumRow}>
          <Ionicons name="star" size={24} color={isPremium ? "#FFD700" : colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>{isPremium ? 'Wize Premium' : 'Upgrade to Pro'}</Text>
            <Text style={styles.premiumSubtitle}>
              {isPremium ? 'Unlocked all features' : 'Get AI insights & Voice finance'}
            </Text>
          </View>
          {!isPremium && (
            <View style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </View>
          )}
        </View>
        </Card>
      </Pressable>

      <View style={styles.menuList}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/profile')} colors={colors} />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} colors={colors} />
        <MenuItem icon="shield-checkmark-outline" label="Security & MPIN" onPress={() => router.push('/security')} colors={colors} />
        <MenuItem
          icon="people-outline"
          label={sharedAccounts.length ? `Shared Accounts (${sharedAccounts.length})` : 'Joint / Shared Account'}
          onPress={() => router.push('/shared-account')}
          colors={colors}
        />
        
        <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>App Settings</Text>
        <MenuItem icon="color-palette-outline" label="Appearance" onPress={() => router.push('/appearance')} colors={colors} />
        <MenuItem icon="lock-closed-outline" label="Privacy & Vault" onPress={() => router.push('/privacy')} colors={colors} />
        <MenuItem icon="language-outline" label="Language" onPress={() => alert('Language settings coming soon!')} colors={colors} />
        <MenuItem 
          icon="cash-outline" 
          label={`Currency (${preferredCurrency})`} 
          onPress={toggleCurrency} 
          colors={colors} 
        />
        
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function MenuItem({ icon, label, onPress, colors }: { icon: any, label: string, onPress: () => void, colors: ThemeColors }) {
  return (
    <Pressable style={stylesItem(colors).item} onPress={onPress}>
      <View style={stylesItem(colors).left}>
        <Ionicons name={icon} size={22} color={colors.textPrimary} />
        <Text style={stylesItem(colors).label}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const stylesItem = (colors: ThemeColors) => StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
  }
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingBottom: spacing.xl * 6,
    },
    guestHeader: {
      alignItems: 'center',
      marginTop: spacing.xl,
      marginBottom: spacing.lg,
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    guestTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    guestSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    authCard: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    authButton: {
      height: 52,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authButtonText: {
      ...typography.body,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    signupButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.line,
    },
    signupButtonText: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.line,
    },
    orText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    avatarContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      ...typography.h2,
      color: colors.primary,
    },
    profileInfo: {
      flex: 1,
    },
    userName: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    userStatusPremium: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '700',
    },
    userStatusStandard: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    standardCard: {
      backgroundColor: colors.card,
      borderColor: colors.line,
    },
    upgradeButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 20,
    },
    upgradeButtonText: {
      ...typography.caption,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    premiumCard: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      marginBottom: spacing.lg,
    },
    premiumRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    premiumTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    premiumSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    menuList: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: spacing.xs,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.xl,
      padding: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    logoutText: {
      ...typography.body,
      color: colors.danger,
      fontWeight: '700',
    }
  });
