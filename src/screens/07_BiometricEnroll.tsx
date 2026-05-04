import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { securityService } from '@/security/securityService';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function BiometricEnrollScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [message, setMessage] = useState('Use biometric unlock for faster secure access.');
  const setBiometric = useAuthStore((s) => s.setBiometric);
  const completeAuth = useAuthStore((s) => s.completeAuth);
  const userId = useAuthStore((s) => s.userId);

  const onEnroll = async () => {
    const ok = await securityService.authenticateBiometric();
    if (ok) {
      if (userId) {
        await securityService.setBiometricEnabled(userId, true);
      }
      setBiometric(true);
      completeAuth();
      router.replace('/dashboard');
    } else {
      setMessage('Biometric unavailable. You can continue with MPIN or password fallback.');
    }
  };

  return (
    <Screen style={styles.center}>
      <View style={styles.panel}>
        <Text style={styles.title}>Enroll Biometric</Text>
        <Text style={styles.body}>{message}</Text>
        <RoundedButton label="Enroll now" onPress={onEnroll} />
        <RoundedButton
          label="Skip for now"
          variant="secondary"
          onPress={async () => {
            if (userId) {
              await securityService.setBiometricEnabled(userId, false);
            }
            setBiometric(false);
            completeAuth();
            router.replace('/dashboard');
          }}
        />
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: { flexGrow: 1, justifyContent: 'center' },
    panel: {
      width: '100%',
      maxWidth: 460,
      alignSelf: 'center',
      gap: 16
    },
    title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
    body: { ...typography.body, color: colors.textSecondary, textAlign: 'center' }
  });
