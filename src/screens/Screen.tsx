import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { spacing, ThemeColors } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

import { AdBanner } from '@/components/AdBanner';
import { BottomNavBar } from '@/components/BottomNavBar';

export function Screen({
  children,
  style,
  bounces = true,
  hideBottomBar = false,
  isScrollable = true
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  bounces?: boolean;
  hideBottomBar?: boolean;
  isScrollable?: boolean;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const content = isScrollable ? (
    <ScrollView
      alwaysBounceVertical={bounces}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      bounces={bounces}
      contentContainerStyle={[
        styles.container,
        style,
        !hideBottomBar && { paddingBottom: spacing.xl * 6 }
      ]}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, { flex: 1 }, style, !hideBottomBar && { paddingBottom: spacing.xl * 6 }]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        style={styles.keyboard} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {content}
      </KeyboardAvoidingView>
      {!hideBottomBar && <AdBanner />}
      {!hideBottomBar && <BottomNavBar />}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    keyboard: { flex: 1 },
    container: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.md }
  });
