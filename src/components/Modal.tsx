import React from 'react';
import { Modal as RNModal, Pressable, StyleSheet } from 'react-native';
import { radius, spacing, ThemeColors } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function Modal({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <RNModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>{children}</Pressable>
      </Pressable>
    </RNModal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.modalBackdrop,
      justifyContent: 'center',
      padding: spacing.lg
    },
    sheet: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: spacing.lg
    }
  });
