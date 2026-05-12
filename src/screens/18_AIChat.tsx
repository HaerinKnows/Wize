import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { chat, ChatMessage } from '@/services/aiService';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getPreferredCurrency } from '@/utils/currency';

export default function AIChatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accounts = useAppStore((state) => state.accounts);
  const transactions = useAppStore((state) => state.transactions);
  const budgets = useAppStore((state) => state.budgets);
  const isPremium = useAuthStore((state) => state.isPremium);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm Wize, your AI finance coach. How can I help you with your money today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const startVoice = () => {
    if (!isPremium) {
      alert("Upgrade to Wize Premium to use Voice Finance!");
      router.push('/premium');
      return;
    }
    setIsVoiceActive(true);
    // Simulate voice detection
    setTimeout(() => {
      const demoCmd = "I just spent $50 on groceries";
      setInput(demoCmd);
      setIsVoiceActive(false);
    }, 1500);
  };

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
    <Screen style={styles.container} isScrollable={false} hideBottomBar>
      <View style={styles.header}>
        <Text style={styles.title}>Wize AI Chat</Text>
        <Text style={styles.subtitle}>Your Personal Finance Coach</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.messageList}
        style={styles.flatList}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.assistantText]}>
              {item.content}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputArea}>
        <Pressable 
          style={[styles.voiceButton, isVoiceActive && styles.voiceButtonActive]} 
          onPress={startVoice}
        >
          <Ionicons 
            name={isVoiceActive ? "mic" : "mic-outline"} 
            size={22} 
            color={isVoiceActive ? colors.primary : (isPremium ? colors.textPrimary : colors.textSecondary)} 
          />
        </Pressable>
        <TextInput
          style={styles.textInput}
          placeholder={isVoiceActive ? "Listening..." : "Ask Wize anything..."}
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

      <RoundedButton label="Back" variant="secondary" onPress={() => router.back()} style={styles.backButton} />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    flatList: {
      flex: 1,
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
    voiceButton: {
      padding: spacing.xs,
      borderRadius: 20,
      backgroundColor: colors.bg,
      marginRight: spacing.xs,
    },
    voiceButtonActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      borderWidth: 1,
    },
    backButton: {
      marginTop: spacing.sm
    }
  });
