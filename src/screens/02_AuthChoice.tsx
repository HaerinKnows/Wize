import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { radius, shadow, spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function AuthChoiceScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Screen style={styles.wrap} bounces={false}>
      <View style={styles.panel}>
        <Text style={styles.title}>Welcome to Wize!</Text>
        <Text style={styles.subtitle}>Choose how to continue</Text>
        {/* LINE */}
        <View style={styles.divider}/>
        <View style={styles.row}>
          <RoundedButton label="Log In" onPress={() => router.push('/login')} />
          <Text style={styles.subtitle}>or</Text>
          <RoundedButton label="Sign Up" variant="secondary" onPress={() => router.push('/signup')} />
        </View>
        {/* LINE */}
        <View style={styles.divider}/>
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { flexGrow: 1, justifyContent: 'center' },
    panel: {
      width: '100%',
      maxWidth: 360,
      alignSelf: 'center',
      gap: spacing.md
    },
    title: { ...typography.h1, color: colors.textPrimary, textAlign: 'center' },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    divider: {
       height: 1,
       backgroundColor: colors.line,
       width: '70%',
       alignSelf: 'center'
    },
    row: {
       gap: 12,
       width: '85%',
       alignSelf: 'center'
    }
  });
