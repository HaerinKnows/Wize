import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { radius, spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const inputRef = useRef<TextInput>(null);
  const boxes = Array.from({ length: 6 }).map((_, i) => value[i] ?? '');

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <Pressable style={styles.wrap} onPress={() => inputRef.current?.focus()}>
      <View style={styles.row}>
        {boxes.map((digit, idx) => (
          <View key={idx} style={styles.box}>
            <Text style={styles.digit}>{digit}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        accessibilityLabel="One Time Password"
        textContentType="oneTimeCode"
        keyboardType="number-pad"
        maxLength={6}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
        style={styles.overlayInput}
      />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      position: 'relative'
    },
    overlayInput: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.02
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
    box: {
      width: 44,
      height: 52,
      borderRadius: radius.input,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card
    },
    digit: { ...typography.h2, color: colors.textPrimary }
  });
