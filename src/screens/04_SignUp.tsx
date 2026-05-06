import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CountryCode, getCountries, getCountryCallingCode } from 'libphonenumber-js';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type CountryOption = {
  code: CountryCode;
  name: string;
  dialCode: string;
  searchKey: string;
};

const fallbackCountryLabel = (code: string) => code;

const getCountryName = (code: string) => {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(code) ?? fallbackCountryLabel(code);
  } catch {
    return fallbackCountryLabel(code);
  }
};

export default function SignUpScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const countryOptions = useMemo<CountryOption[]>(() => {
    return getCountries()
      .map((code) => {
        const name = getCountryName(code);
        const dialCode = getCountryCallingCode(code);
        return {
          code,
          name,
          dialCode,
          searchKey: `${name.toLowerCase()} ${code.toLowerCase()} +${dialCode}`
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>('PH');
  const [countryQuery, setCountryQuery] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const startAuth = useAuthStore((s) => s.startAuth);

  const selectedCountry =
    countryOptions.find((item) => item.code === selectedCountryCode) ?? countryOptions[0];
  const filteredCountries = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();
    if (!query) return countryOptions;
    return countryOptions.filter((item) => item.searchKey.includes(query));
  }, [countryOptions, countryQuery]);

  const onRegister = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    const rawPhone = phone.trim();
    const digitsOnly = rawPhone.replace(/\D/g, '');
    const withCountryCode = rawPhone.startsWith('+')
      ? rawPhone
      : `+${selectedCountry?.dialCode ?? '63'}${digitsOnly.replace(/^0+/, '')}`;

    setSubmitting(true);
    try {
      const res = await authService.register(name, email, password, withCountryCode);
      startAuth(res.userId, true);
      router.push('/two-factor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen style={styles.center}>
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
        <View style={styles.phoneField}>
          <Pressable
            style={styles.countryPrefix}
            onPress={() => setCountryModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Select country calling code"
          >
            <Text style={styles.countryPrefixText}>
              {selectedCountry?.code ?? 'PH'} +{selectedCountry?.dialCode ?? '63'} v
            </Text>
          </Pressable>
          <TextInput
            placeholder="Phone number"
            placeholderTextColor={colors.textSecondary}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.phoneInput}
          />
        </View>
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

      <Modal
        transparent
        animationType="slide"
        visible={countryModalVisible}
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select country code</Text>
              <Pressable onPress={() => setCountryModalVisible(false)} accessibilityRole="button" accessibilityLabel="Close country picker">
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>
            <Input
              placeholder="Search country, code, or +number"
              value={countryQuery}
              onChangeText={setCountryQuery}
              autoCapitalize="none"
            />

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.countryListContent}
              style={styles.countryList}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.countryRow, item.code === selectedCountryCode && styles.countryRowSelected]}
                  onPress={() => {
                    setSelectedCountryCode(item.code);
                    setCountryModalVisible(false);
                    setCountryQuery('');
                  }}
                >
                  <Text style={styles.countryRowName}>{item.name} ({item.code})</Text>
                  <Text style={styles.countryRowDial}>+{item.dialCode}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
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
    phoneField: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      backgroundColor: colors.card,
      minHeight: 56,
      paddingHorizontal: spacing.md,
      gap: spacing.sm
    },
    countryPrefix: {
      minHeight: 36,
      justifyContent: 'center',
      paddingRight: spacing.sm,
      borderRightWidth: 1,
      borderRightColor: colors.line
    },
    countryPrefixText: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
    phoneInput: {
      flex: 1,
      minHeight: 40,
      ...typography.body,
      color: colors.textPrimary,
      backgroundColor: 'transparent',
      borderWidth: 0,
      paddingVertical: 0
    },
    accessoryText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    error: { ...typography.caption, color: colors.danger },
    switchRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      alignItems: 'center'
    },
    switchText: { ...typography.caption, color: colors.textSecondary },
    link: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.modalBackdrop,
      justifyContent: 'flex-end',
      padding: spacing.lg
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
      maxHeight: '58%',
      gap: spacing.sm
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
    modalClose: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    countryList: {
      minHeight: 220
    },
    countryListContent: {
      gap: spacing.xs
    },
    countryRow: {
      minHeight: 44,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.bg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    countryRowSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft
    },
    countryRowName: { ...typography.caption, color: colors.textPrimary },
    countryRowDial: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' }
  });
