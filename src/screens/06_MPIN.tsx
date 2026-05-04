import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { NumericPinPad } from '@/components/NumericPinPad';
import { RoundedButton } from '@/components/RoundedButton';
import { Chip } from '@/components/Chip';
import { Screen } from '@/screens/Screen';
import { securityService } from '@/security/securityService';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type MpinMode = 'loading' | 'setup' | 'verify';

export default function MpinScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [length, setLength] = useState<4 | 6>(4);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<MpinMode>('loading');

  const userId = useAuthStore((s) => s.userId);
  const markMpinConfigured = useAuthStore((s) => s.setMpin);
  const completeAuth = useAuthStore((s) => s.completeAuth);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!userId) {
        if (!active) return;
        setError('Missing user session. Please log in again.');
        setMode('setup');
        return;
      }

      const existingLength = await securityService.getMpinLength(userId);
      if (!active) return;

      if (existingLength) {
        setLength(existingLength);
        setMode('verify');
      } else {
        setMode('setup');
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [userId]);

  const isConfirmStep = mode === 'setup' && pin.length === length;
  const activeValue = mode === 'verify' ? pin : isConfirmStep ? confirm : pin;

  const onTap = (n: string) => {
    setError('');

    if (mode === 'loading') return;

    if (mode === 'verify') {
      if (pin.length < length) {
        setPin((v) => v + n);
      }
      return;
    }

    if (isConfirmStep) {
      if (confirm.length < length) {
        setConfirm((v) => v + n);
      }
      return;
    }

    if (pin.length < length) {
      setPin((v) => v + n);
    }
  };

  const onDelete = () => {
    setError('');

    if (mode === 'loading') return;

    if (mode === 'verify') {
      setPin((v) => v.slice(0, -1));
      return;
    }

    if (isConfirmStep && confirm.length > 0) {
      setConfirm((v) => v.slice(0, -1));
      return;
    }

    if (isConfirmStep && confirm.length === 0) {
      setPin((v) => v.slice(0, -1));
      return;
    }

    setPin((v) => v.slice(0, -1));
  };

  const canSubmit = useMemo(() => {
    if (mode === 'verify') {
      return pin.length === length;
    }
    if (mode === 'setup') {
      return pin.length === length && confirm.length === length;
    }
    return false;
  }, [mode, pin.length, confirm.length, length]);

  const onSubmit = async () => {
    if (!userId) {
      setError('Missing user session. Please log in again.');
      return;
    }

    if (!canSubmit) {
      setError(mode === 'verify' ? `Enter your ${length}-digit MPIN.` : 'Enter and confirm your full MPIN before saving.');
      return;
    }

    if (mode === 'verify') {
      const ok = await securityService.verifyMpin(userId, pin);
      if (!ok) {
        setError('Incorrect MPIN. Try again.');
        setPin('');
        return;
      }

      const biometricRequired = await securityService.isBiometricEnabled(userId);
      if (biometricRequired) {
        Keyboard.dismiss();
        const biometricOk = await securityService.authenticateBiometric();
        if (!biometricOk) {
          setError('Biometric verification failed. MPIN is correct, please try biometric again.');
          return;
        }
      }

      completeAuth();
      router.replace('/dashboard');
      return;
    }

    if (confirm !== pin) {
      setError('MPIN does not match. Please re-confirm.');
      setConfirm('');
      return;
    }

    await securityService.setMpin(userId, pin);
    markMpinConfigured();
    router.push('/biometric-enroll');
  };

  if (mode === 'loading') {
    return (
      <Screen style={styles.center}>
        <View style={styles.panel}>
          <Text style={styles.title}>MPIN</Text>
          <Text style={styles.caption}>Loading MPIN settings...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.center}>
      <View style={styles.panel}>
        <Text style={styles.title}>{mode === 'verify' ? 'Enter MPIN' : 'Create MPIN'}</Text>

        {mode === 'setup' ? (
          <View style={styles.row}>
            <Chip
              label="4 digit"
              selected={length === 4}
              onPress={() => {
                setLength(4);
                setPin('');
                setConfirm('');
                setError('');
              }}
            />
            <Chip
              label="6 digit"
              selected={length === 6}
              onPress={() => {
                setLength(6);
                setPin('');
                setConfirm('');
                setError('');
              }}
            />
          </View>
        ) : null}

        <Text style={styles.pin}>{activeValue.padEnd(length, '*')}</Text>
        <Text style={styles.caption}>
          {mode === 'verify' ? `${length}-digit MPIN required` : isConfirmStep ? 'Confirm MPIN' : 'Enter MPIN'}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <NumericPinPad onTap={onTap} onDelete={onDelete} />
        <RoundedButton
          label={mode === 'verify' ? 'Unlock' : 'Save MPIN'}
          onPress={onSubmit}
          variant={canSubmit ? 'primary' : 'secondary'}
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
      gap: 18
    },
    title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
    row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
    pin: { ...typography.h1, letterSpacing: 8, textAlign: 'center', color: colors.textPrimary },
    caption: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
    error: { ...typography.caption, color: colors.danger, textAlign: 'center' }
  });
