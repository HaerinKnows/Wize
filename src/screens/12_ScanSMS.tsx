import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { parseSmsSample } from '@/sms/parser';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { toCategoryLabel } from '@/utils/category';
import { formatCurrency, getPreferredCurrency } from '@/utils/currency';
import { useTheme } from '@/theme/ThemeProvider';

export default function ScanSmsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const markSynced = useAppStore((s) => s.markSynced);
  const primaryAccount = useAppStore((s) => s.accounts[0]?.id ?? 'acc_01');
  const primaryCurrency = useAppStore((s) => s.accounts[0]?.currency ?? getPreferredCurrency());
  const userId = useAuthStore((s) => s.userId);

  const [consentOpen, setConsentOpen] = useState(true);
  const [consented, setConsented] = useState(false);
  const [smsText, setSmsText] = useState('Your card was charged USD 12.60 at Fresh Market.');
  const [parsed, setParsed] = useState<ReturnType<typeof parseSmsSample> | null>(null);
  const [error, setError] = useState('');

  const onParse = () => {
    if (!consented) {
      setError('Please grant SMS parsing consent first.');
      return;
    }

    const result = parseSmsSample(smsText);
    if (!result) {
      setError('Could not parse SMS. Try editing the message format.');
      setParsed(null);
      return;
    }

    setError('');
    setParsed(result);
  };

  const onImport = () => {
    if (!parsed) return;

    addTransaction({
      ownerUserId: userId ?? 'user_demo',
      accountId: primaryAccount,
      type: 'expense',
      category: toCategoryLabel(parsed.merchant),
      amountMinor: -Math.abs(parsed.amountMinor),
      currency: primaryCurrency,
      notes: 'Imported from SMS',
      metadata: { source: 'sms', sourceId: parsed.sourceId }
    });
    markSynced();
    router.replace('/dashboard');
  };

  return (
    <Screen>
      <Text style={styles.title}>Scan SMS</Text>
      <Text style={styles.caption}>Only parsed metadata is stored. You can opt out anytime in settings.</Text>

      <Card header="SMS input">
        <Input value={smsText} onChangeText={setSmsText} multiline />
        <View style={styles.buttons}>
          <RoundedButton label="Parse message" onPress={onParse} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>

      {parsed ? (
        <Card header="Parsed Result">
          <Text style={styles.result}>Merchant: {parsed.merchant}</Text>
          <Text style={styles.result}>Amount: {formatCurrency(parsed.amountMinor)}</Text>
          <Text style={styles.result}>Source ID: {parsed.sourceId}</Text>
          <View style={styles.buttons}>
            <RoundedButton label="Import as transaction" onPress={onImport} />
          </View>
        </Card>
      ) : null}

      <RoundedButton label="Back" variant="secondary" onPress={() => router.back()} />

      <Modal visible={consentOpen} onClose={() => setConsentOpen(false)}>
        <View style={styles.modalWrap}>
          <Text style={styles.modalTitle}>SMS Consent</Text>
          <Text style={styles.modalText}>
            Wizenance reads SMS receipts only with your permission. Full message bodies are not uploaded without consent.
          </Text>
          <RoundedButton
            label="I Consent"
            onPress={() => {
              setConsented(true);
              setConsentOpen(false);
            }}
          />
          <RoundedButton label="Not now" variant="secondary" onPress={() => setConsentOpen(false)} />
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { ...typography.h2, color: colors.textPrimary },
    caption: { ...typography.caption, color: colors.textSecondary },
    buttons: { marginTop: spacing.md },
    error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
    result: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
    modalWrap: { gap: spacing.md },
    modalTitle: { ...typography.h2, color: colors.textPrimary },
    modalText: { ...typography.body, color: colors.textSecondary }
  });
