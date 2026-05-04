import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { spacing, ThemeColors } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function Screen({
  children,
  style,
  bounces = true
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  bounces?: boolean;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          alwaysBounceVertical={bounces}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          bounces={bounces}
          contentContainerStyle={[styles.container, style]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    keyboard: { flex: 1 },
    container: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.md }
  });
