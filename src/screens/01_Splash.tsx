import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/screens/Screen';
import { ThemeColors, typography } from '@/design/tokens';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function SplashScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      const mpinSet = useAuthStore.getState().mpinSet;
      const isAuthenticated = useAuthStore.getState().isAuthenticated;

      if (isAuthenticated && mpinSet) {
        // Even if authenticated in store, we want to force MPIN unlock on app start
        router.replace('/mpin');
      } else if (isAuthenticated) {
        router.replace('/dashboard');
      } else if (mpinSet) {
        // Has account but not authenticated this session
        router.replace('/mpin');
      } else {
        router.replace('/auth-choice');
      }
    }, 900);

    return () => clearTimeout(t);
  }, [hydrated]);

  return (
    <Screen style={styles.center}>
      <Text style={styles.title}>Wize.</Text>
      <Text style={styles.subtitle}>Be Smart. Be Wize.</Text>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
    title: { ...typography.h1, color: colors.textPrimary },
    subtitle: { ...typography.body, color: colors.textSecondary }
  });
