import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/screens/Screen';
import { Card } from '@/components/Card';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { ThemeMode, useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';

type ThemeOption = {
  id: ThemeMode;
  label: string;
  isPremium: boolean;
  colors: { bg: string; primary: string };
};

export default function AppearanceScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isPremium = useAuthStore((state) => state.isPremium);

  const options: ThemeOption[] = [
    { id: 'system', label: 'System Default', isPremium: false, colors: { bg: '#f1f5f9', primary: '#136281' } },
    { id: 'light', label: 'Classic Light', isPremium: false, colors: { bg: '#ffffff', primary: '#136281' } },
    { id: 'dark', label: 'Classic Dark', isPremium: false, colors: { bg: '#050428', primary: '#5DA7FF' } },
    { id: 'gold', label: 'Wize Gold', isPremium: true, colors: { bg: '#0F0F0F', primary: '#D4AF37' } },
    { id: 'midnight', label: 'Midnight Black', isPremium: true, colors: { bg: '#000000', primary: '#FFFFFF' } },
    { id: 'glassmorphism', label: 'Glassmorphism', isPremium: true, colors: { bg: '#0F0C29', primary: '#7BB6FF' } },
  ];

  const handleSelect = (option: ThemeOption) => {
    if (option.isPremium && !isPremium) {
      alert("Upgrade to Wize Premium to unlock this theme!");
      router.push('/account');
      return;
    }
    setMode(option.id);
  };

  return (
    <Screen style={styles.container} isScrollable={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Appearance</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Themes</Text>
        <View style={styles.grid}>
          {options.map((option) => (
            <Pressable 
              key={option.id} 
              onPress={() => handleSelect(option)}
              style={[
                styles.optionCard, 
                mode === option.id && styles.optionSelected,
                option.isPremium && !isPremium && styles.optionLocked
              ]}
            >
              <View style={[styles.preview, { backgroundColor: option.colors.bg }]}>
                <View style={[styles.previewCircle, { backgroundColor: option.colors.primary }]} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                {option.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={10} color="#FFD700" />
                    <Text style={styles.premiumText}>PRO</Text>
                  </View>
                )}
              </View>
              {mode === option.id && (
                <View style={styles.check}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    backButton: {
      padding: spacing.xs,
    },
    title: { ...typography.h2, color: colors.textPrimary },
    scroll: { paddingBottom: spacing.xl },
    sectionTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: spacing.md,
    },
    grid: {
      gap: spacing.md,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.line,
    },
    optionSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    optionLocked: {
      opacity: 0.8,
    },
    preview: {
      width: 48,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    optionInfo: {
      marginLeft: spacing.md,
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: 'rgba(255,215,0,0.15)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    premiumText: {
      fontSize: 10,
      fontWeight: '900',
      color: '#B8860B',
    },
    check: {
      marginLeft: spacing.sm,
    }
  });
