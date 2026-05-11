import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, Budget, Transaction } from '@/types/domain';
import { apiRequest } from '@/services/apiClient';

export type SmartTip = {
  title: string;
  detail: string;
};

type SmartTipsResponse = {
  tips: SmartTip[];
  source: 'gemini' | 'fallback';
  model?: string;
};

const SMART_TIPS_CACHE_KEY = 'wizenance-smart-tips-cache';

export const fallbackSmartTips: SmartTip[] = [
  {
    title: 'Cap Your Top Categories',
    detail: 'Set weekly spending caps for your top two expense categories.'
  },
  {
    title: 'Smooth Fixed Bills',
    detail: 'Split fixed bills into daily allocations to avoid month-end spikes.'
  },
  {
    title: 'Review Subscriptions',
    detail: 'Review recurring subscriptions every 30 days and cancel inactive ones.'
  },
  {
    title: 'Save On Payday',
    detail: 'Auto-transfer a small savings amount right after salary deposits.'
  }
];

export async function getSmartTips(input: {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  currency: string;
}) {
  return apiRequest<SmartTipsResponse>('/ai/smart-tips', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function cacheSmartTips(tips: SmartTip[]) {
  await AsyncStorage.setItem(
    SMART_TIPS_CACHE_KEY,
    JSON.stringify({
      tips,
      cachedAt: new Date().toISOString()
    })
  );
}

export async function getCachedSmartTips() {
  const raw = await AsyncStorage.getItem(SMART_TIPS_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { tips?: SmartTip[]; cachedAt?: string };
    const tips = Array.isArray(parsed.tips)
      ? parsed.tips.filter((tip) => typeof tip.title === 'string' && typeof tip.detail === 'string')
      : [];

    return tips.length > 0 ? { tips, cachedAt: parsed.cachedAt } : null;
  } catch {
    return null;
  }
}
export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatResponse = {
  text: string;
  source: 'gemini' | 'fallback';
  model?: string;
};

export type Insight = {
  type: 'alert' | 'optimization';
  title: string;
  detail: string;
  impact?: string;
};

export async function getInsights(input: {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  currency: string;
}) {
  return apiRequest<{ insights: Insight[] }>('/ai/insights', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function chat(
  history: ChatMessage[],
  snapshot: {
    accounts: Account[];
    transactions: Transaction[];
    budgets: Budget[];
    currency: string;
  }
) {
  return apiRequest<ChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ history, snapshot })
  });
}
