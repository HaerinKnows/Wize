import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { OTPInput } from '@/components/OTPInput';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function TwoFactorScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(60);
  const [status, setStatus] = useState('Sending OTP...');
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const pendingUserId = useAuthStore((s) => s.pendingUserId);
  const verify2fa = useAuthStore((s) => s.verify2fa);

  useEffect(() => {
    const timer = setInterval(() => setCooldown((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!pendingUserId) return;
      await sendOtp();
    };

    run();
    // We only need to auto-send on first screen entry / user change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUserId]);

  const sendOtp = async () => {
    if (!pendingUserId) {
      setError('Missing auth session. Please log in again.');
      return;
    }
    setError('');
    setSending(true);
    try {
      const otp = await authService.requestOtp(pendingUserId, 'email');
      if (otp.channel === 'gateway') {
        setStatus('OTP sent by backend email gateway.');
      } else {
        setStatus('No email gateway configured. Using dev OTP preview.');
      }
      setDevCode(otp.debugCode);
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send OTP.');
      setStatus('OTP send failed.');
    } finally {
      setSending(false);
    }
  };

  const onVerify = async () => {
    if (!pendingUserId) {
      setError('Missing auth session. Please log in again.');
      return;
    }

    if (code.trim().length !== 6) {
      setError('Enter the 6-digit OTP first.');
      return;
    }

    setError('');
    try {
      await authService.verifyOtp(pendingUserId, code.trim());
      verify2fa();
      router.push('/mpin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    }
  };

  return (
    <Screen style={styles.center}>
      <View style={styles.panel}>
        <Text style={styles.title}>2FA Verification</Text>
        <OTPInput value={code} onChange={setCode} />
        <View style={styles.row}>
          <Text style={styles.caption}>{cooldown > 0 ? `Resend in ${cooldown}s` : 'You can resend now'}</Text>
        </View>

        <Text style={styles.status}>{status}</Text>
        {devCode ? <Text style={styles.devCode}>Dev OTP: {devCode}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <RoundedButton label="Verify OTP" onPress={onVerify} />
        <RoundedButton
          label={sending ? 'Sending...' : cooldown > 0 ? 'Resend OTP' : 'Send OTP again'}
          onPress={sendOtp}
          variant={cooldown > 0 || sending ? 'disabled' : 'secondary'}
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
      maxWidth: 520,
      alignSelf: 'center',
      gap: spacing.md
    },
    title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
    row: { flexDirection: 'row', justifyContent: 'center' },
    caption: { ...typography.caption, color: colors.textSecondary },
    status: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
    devCode: { ...typography.caption, color: colors.primary, textAlign: 'center' },
    error: { ...typography.caption, color: colors.danger, textAlign: 'center' }
  });
