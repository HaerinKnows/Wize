import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { radius, spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { chat, ChatMessage } from '@/services/aiService';
import { useAppStore } from '@/store/useAppStore';
import { getPreferredCurrency } from '@/utils/currency';

export default function AIChatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accounts = useAppStore((state) => state.accounts);
  const transactions = useAppStore((state) => state.transactions);
  const budgets = useAppStore((state) => state.budgets);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm Wize, your AI finance coach. How can I help you with your money today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const onSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await chat(nextMessages, {
        accounts,
        transactions,
        budgets,
        currency: getPreferredCurrency()
      });

      setMessages([...nextMessages, { role: 'assistant', content: response.text }]);
    } catch (error) {
      setMessages([...nextMessages, { role: 'assistant', content: "I'm sorry, I encountered an error. Please check your connection and try again." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, accounts, transactions, budgets]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wize AI Chat</Text>
        <Text style={styles.subtitle}>Your Personal Finance Coach</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.assistantText]}>
              {item.content}
            </Text>
          </View>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
        <View style={styles.inputArea}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask Wize anything..."
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <View style={styles.sendButtonWrap}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <RoundedButton label="Send" onPress={onSend} variant={input.trim() ? 'primary' : 'disabled'} />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <RoundedButton label="Back" variant="secondary" onPress={() => router.back()} style={styles.backButton} />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingBottom: spacing.lg
    },
    header: {
      marginBottom: spacing.md
    },
    title: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.caption, color: colors.textSecondary },
    messageList: {
      paddingVertical: spacing.md,
      gap: spacing.sm
    },
    messageBubble: {
      padding: spacing.md,
      borderRadius: 18,
      maxWidth: '85%'
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary
    },
    assistantBubble: {
      alignSelf: 'flex-start',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.line
    },
    messageText: { ...typography.body },
    userText: { color: '#FFFFFF' },
    assistantText: { color: colors.textPrimary },
    inputArea: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: 24,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.line,
      marginBottom: spacing.sm
    },
    textInput: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      maxHeight: 100,
      paddingVertical: spacing.sm
    },
    sendButtonWrap: {
      minWidth: 80
    },
    backButton: {
      marginTop: spacing.sm
    }
  });
