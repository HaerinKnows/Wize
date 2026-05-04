import React from 'react';
import { Text } from 'react-native';

const glyphs: Record<string, string> = {
  wallet: '👛',
  chart: '📈',
  gift: '🏆',
  sms: '✉️',
  lock: '🔒'
};

export function Icon({ name, size = 18 }: { name: keyof typeof glyphs; size?: number }) {
  return <Text style={{ fontSize: size }}>{glyphs[name]}</Text>;
}
