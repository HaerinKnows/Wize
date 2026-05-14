import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { RoundedButton } from '@/components/RoundedButton';
import { Screen } from '@/screens/Screen';
import { spacing, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { chat, ChatMessage, getChatHistory } from '@/services/aiService';
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
  const userId = useAuthStore((state) => state.userId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!userId) {
        setMessages([
          { role: 'assistant', content: "Hello! I'm Wize, your AI finance coach. How can I help you with your money today?" }
        ]);
        return;
      }
      try {
        const { history } = await getChatHistory(userId);
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            { role: 'assistant', content: "Hello! I'm Wize, your AI finance coach. How can I help you with your money today?" }
          ]);
        }
      } catch {
        setMessages([
          { role: 'assistant', content: "Hello! I'm Wize, your AI finance coach. How can I help you with your money today?" }
        ]);
      }
    }
    loadHistory();
  }, [userId]);

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

    const userMessage: ChatMessage = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
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
      }, userId ?? undefined);

      setMessages([...nextMessages, { role: 'assistant', content: response.text, timestamp: new Date().toISOString() }]);
    } catch (error) {
      setMessages([...nextMessages, { role: 'assistant', content: "I'm sorry, I encountered an error. Please check your connection and try again." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, accounts, transactions, budgets, userId]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isNewDay = (msg: ChatMessage, prevMsg?: ChatMessage) => {
    if (!msg.timestamp) return false;
    if (!prevMsg?.timestamp) return true;
    const d1 = new Date(msg.timestamp).toDateString();
    const d2 = new Date(prevMsg.timestamp).toDateString();
    return d1 !== d2;
  };

  return (
    <Screen style={styles.container} isScrollable={false} hideBottomBar>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} style={styles.backButtonInline}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.title}>Wize AI Chat</Text>
            <Text style={styles.subtitle}>Your Personal Finance Coach</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.messageList}
        style={styles.flatList}
        renderItem={({ item, index }) => {
          const prev = messages[index - 1];
          const showDay = isNewDay(item, prev);
          const dayLabel = item.timestamp ? new Date(item.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : '';

          return (
            <View>
              {showDay && item.timestamp && (
                <View style={styles.daySeparator}>
                  <Text style={styles.dayText}>{dayLabel}</Text>
                </View>
              )}
              <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.assistantText]}>
                  {item.content}
                </Text>
                {item.timestamp && (
                  <Text style={[styles.timeText, item.role === 'user' ? styles.userTime : styles.assistantTime]}>
                    {formatTimestamp(item.timestamp)}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
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
      </KeyboardAvoidingView>
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
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm
    },
    backButtonInline: {
      padding: spacing.xs
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
    timeText: {
      ...typography.caption,
      fontSize: 10,
      marginTop: 4,
      textAlign: 'right',
      opacity: 0.7
    },
    userTime: { color: 'rgba(255,255,255,0.7)' },
    assistantTime: { color: colors.textSecondary },
    daySeparator: {
      alignItems: 'center',
      marginVertical: spacing.md
    },
    dayText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '700',
      backgroundColor: colors.bg,
      paddingHorizontal: spacing.sm
    },
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
      marginBottom: spacing.md
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
    }
  });
