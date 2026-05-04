import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ThemeColors } from '@/design/tokens';

export type ThemeMode = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const STORAGE_KEY = 'wizenance_theme_mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const toResolvedTheme = (
  mode: ThemeMode,
  systemScheme: 'light' | 'dark' | null | undefined
): ResolvedTheme => {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  return systemScheme === 'dark' ? 'dark' : 'light';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let active = true;

    const loadTheme = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active || !raw) return;
        if (raw === 'light' || raw === 'dark' || raw === 'system') {
          setModeState(raw);
        }
      } catch {
        // Keep default system mode when storage is unavailable.
      }
    };

    loadTheme();

    return () => {
      active = false;
    };
  }, []);

  const resolvedTheme = toResolvedTheme(mode, systemScheme);
  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;

  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // No-op: mode still applies for this session.
    }
  };

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      colors,
      setMode
    }),
    [mode, resolvedTheme, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

