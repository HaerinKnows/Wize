import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProfileSettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const profile = useAppStore((state) => state.userProfile);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const userId = useAuthStore((state) => state.userId);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [saved, setSaved] = useState(false);

  const saveProfile = () => {
    updateUserProfile({
      displayName: displayName.trim(),
      email: email.trim(),
      phone: phone.trim()
    });
    setSaved(true);
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <Card style={styles.avatarCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{(displayName || userId || 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.userId}>{userId || 'Guest user'}</Text>
      </Card>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
        <Input placeholder="Display name" value={displayName} onChangeText={setDisplayName} />
        <Input placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Input placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <RoundedButton label="Save Profile" onPress={saveProfile} />
        {saved ? <Text style={styles.savedText}>Profile updated.</Text> : null}
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
    avatarCard: {
      alignItems: 'center',
      gap: spacing.sm
    },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: colors.primarySoft,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center'
    },
    avatarInitial: {
      ...typography.h1,
      color: colors.primary
    },
    userId: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center'
    },
    form: {
      gap: spacing.md
    },
    sectionTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '700',
      letterSpacing: 1
    },
    savedText: {
      ...typography.caption,
      color: colors.success,
      textAlign: 'center'
    }
  });
