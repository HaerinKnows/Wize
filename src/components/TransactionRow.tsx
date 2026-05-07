import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { toCategoryLabel } from '@/utils/category';
import { formatCurrency } from '@/utils/currency';

export function TransactionRow({
  category,
  amountMinor,
  timestamp,
  currency,
  notes,
  onDelete
}: {
  category: string;
  amountMinor: number;
  timestamp: string;
  currency?: string;
  notes?: string;
  onDelete?: () => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const noteText = notes?.trim();

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.category}>{toCategoryLabel(category)}</Text>
        {noteText ? <Text style={styles.note}>{noteText}</Text> : null}
        <Text style={styles.time}>{new Date(timestamp).toLocaleString()}</Text>
      </View>
      <View style={styles.rightSide}>
        <Text style={[styles.amount, amountMinor < 0 && styles.expense]}>
          {formatCurrency(amountMinor, currency)}
        </Text>
        {onDelete && (
          <Pressable onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="close-circle" size={20} color={colors.danger} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      minHeight: 56,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      paddingVertical: spacing.sm
    },
    category: { ...typography.body, color: colors.textPrimary },
    note: { ...typography.caption, color: colors.textPrimary, opacity: 0.9 },
    time: { ...typography.caption, color: colors.textSecondary },
    amount: { ...typography.body, color: colors.success },
    expense: { color: colors.danger },
    rightSide: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm
    },
    deleteButton: {
      padding: spacing.xs
    }
  });
