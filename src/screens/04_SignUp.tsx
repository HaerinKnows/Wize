import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const startAuth = useAuthStore((s) => s.startAuth);

  const onRegister = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    try {
      // Phone is now empty string as we are removing it.
      const res = await authService.register(name, email, password, '');
      startAuth(res.userId, true, { email, name });
      router.push('/two-factor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen style={styles.center} hideBottomBar={true}>
      <Card style={styles.card}>
        <Text style={styles.title}>Create account</Text>
        <Input placeholder="Full name" value={name} onChangeText={setName} />
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
        <Input
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          rightAccessory={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
            >
              <Text style={styles.accessoryText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          }
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <RoundedButton
          label={submitting ? 'Creating + OTP...' : 'Register'}
          onPress={onRegister}
          variant={submitting ? 'disabled' : 'primary'}
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account?</Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.link}>Log in</Text>
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
      maxWidth: 520,
      alignSelf: 'center',
      gap: spacing.md
    },
    title: { ...typography.h2, color: colors.textPrimary },
    accessoryText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    error: { ...typography.caption, color: colors.danger },
    switchRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      alignItems: 'center'
    },
    switchText: { ...typography.caption, color: colors.textSecondary },
    link: { ...typography.caption, color: colors.primary, fontWeight: '700' }
  });
