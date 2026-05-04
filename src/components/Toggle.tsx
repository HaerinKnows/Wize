import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, ThemeColors } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      onPress={() => onChange(!enabled)}
      style={[styles.track, enabled && styles.on]}
    >
      <View style={[styles.thumb, enabled && styles.thumbOn]} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    track: {
      width: 52,
      height: 32,
      borderRadius: radius.pill,
      backgroundColor: colors.line,
      justifyContent: 'center'
    },
    on: { backgroundColor: colors.primary },
    thumb: { width: 24, height: 24, backgroundColor: '#FFFFFF', borderRadius: radius.pill, marginLeft: 4 },
    thumbOn: { marginLeft: 24 }
  });
