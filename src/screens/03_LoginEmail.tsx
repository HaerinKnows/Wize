import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function LoginEmailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const startAuth = useAuthStore((s) => s.startAuth);
  const showLocalDemo = Platform.OS === 'web';

  const onLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await authService.login(email, password);
      const userId = res.userId ?? '';
      startAuth(userId);
      router.push('/two-factor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen style={styles.center}>
      <Card style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          rightAccessory={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              <Text style={styles.accessoryText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          }
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <RoundedButton
          label={submitting ? 'Sending OTP...' : 'Continue'}
          onPress={onLogin}
          variant={submitting ? 'disabled' : 'primary'}
        />
        {showLocalDemo ? <Text style={styles.helper}>Demo: demo@wizenance.app / Wizenance123!</Text> : null}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>No account yet?</Text>
          <Pressable onPress={() => router.push('/signup')}>
            <Text style={styles.link}>Sign up</Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: {
      flexGrow: 1,
      justifyContent: 'center'
    },
    card: {
      width: '100%',
      maxWidth: 460,
      alignSelf: 'center',
      gap: spacing.md
    },
    title: { ...typography.h2, color: colors.textPrimary },
    error: { ...typography.caption, color: colors.danger },
    helper: { ...typography.caption, color: colors.textSecondary },
    accessoryText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    switchRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      alignItems: 'center'
    },
    switchText: { ...typography.caption, color: colors.textSecondary },
    link: { ...typography.caption, color: colors.primary, fontWeight: '700' }
  });
