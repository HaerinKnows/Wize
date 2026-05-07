import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware.js';
import { Account, Budget, IntegrationState, Transaction, TxType } from '@/types/domain';
import { seedAccounts, seedBudgets, seedTransactions } from '@/mocks/seed';
import { syncService } from '@/services/syncService';
import { getPreferredCurrency } from '@/utils/currency';

type SyncResult = {
  ok: boolean;
  message: string;
};

const toTime = (timestamp: string) => {
  const parsed = new Date(timestamp).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortTransactionsNewestFirst = (a: Transaction, b: Transaction) => toTime(b.timestamp) - toTime(a.timestamp);

const mergeTransactions = (local: Transaction[], remote: Transaction[], ownerUserId: string) => {
  const byId = new Map<string, Transaction>();

  [...local, ...remote].forEach((tx) => {
    const normalizedTx: Transaction = {
      ...tx,
      ownerUserId: tx.ownerUserId ?? ownerUserId
    };

    const existing = byId.get(normalizedTx.id);
    if (!existing || toTime(normalizedTx.timestamp) >= toTime(existing.timestamp)) {
      byId.set(normalizedTx.id, normalizedTx);
    }
  });

  return Array.from(byId.values()).sort(sortTransactionsNewestFirst);
};

const mergeBudgets = (local: Budget[], remote: Budget[], ownerUserId: string) => {
  const byId = new Map<string, Budget>();

  local.forEach((budget) => byId.set(budget.id, budget));
  remote.forEach((budget) =>
    byId.set(budget.id, {
      ...budget,
      ownerUserId: budget.ownerUserId ?? ownerUserId
    })
  );

  return Array.from(byId.values());
};

const mergeAccounts = (local: Account[], remote: Account[]) => {
  const byId = new Map<string, Account>();
  local.forEach((account) => byId.set(account.id, account));
  remote.forEach((account) => byId.set(account.id, account));
  return Array.from(byId.values());
};

const normalizeCurrencyCode = (currency: string | undefined, preferredCurrency: string) => {
  if (!currency) return preferredCurrency;
  if (currency === 'USD' && preferredCurrency !== 'USD') return preferredCurrency;
  return currency;
};

type AppState = {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  integrationStatus: Record<string, IntegrationState>;
  lastSyncAt?: string;
  syncInProgress: boolean;
  syncMessage?: string;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => string;
  updateBudgetSpent: (budgetId: string, deltaMinor: number) => void;
  setIntegrationStatus: (provider: string, status: IntegrationState) => void;
  markSynced: () => void;
  refreshSync: (userId?: string) => Promise<SyncResult>;
  clearSyncMessage: () => void;
  totals: () => { income: number; expense: number; total: number };
  byType: (type: TxType) => Transaction[];
  preferredCurrency: string;
  setPreferredCurrency: (currency: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      accounts: seedAccounts,
      transactions: seedTransactions,
      budgets: seedBudgets,
      integrationStatus: {
        GCash: 'connected',
        Paytm: 'not_connected',
        Ovo: 'not_connected'
      },
      syncInProgress: false,
      preferredCurrency: 'PHP',
      setPreferredCurrency: (currency) => set({ preferredCurrency: currency }),
      addTransaction: (tx) =>
        set((state) => {
          const preferredCurrency = getPreferredCurrency();

          return {
            transactions: [
              {
                ...tx,
                currency: normalizeCurrencyCode(tx.currency, preferredCurrency),
                id: `txn_${Date.now()}`,
                timestamp: new Date().toISOString()
              },
              ...state.transactions
            ]
          };
        }),
      addBudget: (budget) => {
        const id = `bud_${Date.now()}`;
        set((state) => ({
          budgets: [{ ...budget, id }, ...state.budgets]
        }));
        return id;
      },
      updateBudgetSpent: (budgetId, deltaMinor) =>
        set((state) => ({
          budgets: state.budgets.map((budget) =>
            budget.id === budgetId
              ? { ...budget, spentAmountMinor: Math.max(0, budget.spentAmountMinor + Math.max(0, deltaMinor)) }
              : budget
          )
        })),
      setIntegrationStatus: (provider, status) =>
        set((state) => ({ integrationStatus: { ...state.integrationStatus, [provider]: status } })),
      markSynced: () => set({ lastSyncAt: new Date().toISOString(), syncMessage: undefined }),
      refreshSync: async (userId) => {
        const ownerUserId = userId ?? 'user_demo';
        set({ syncInProgress: true, syncMessage: undefined });
        const preferredCurrency = getPreferredCurrency();

        const currentState = get();
        const currentAccounts = currentState.accounts;
        const localUserTransactions = currentState.transactions.filter(
          (tx) => (tx.ownerUserId ?? 'user_demo') === ownerUserId
        );
        const localUserBudgets = currentState.budgets.filter(
          (budget) => (budget.ownerUserId ?? 'user_demo') === ownerUserId
        );

        let mergedUserTransactions = [...localUserTransactions].sort(sortTransactionsNewestFirst);
        let mergedUserBudgets = [...localUserBudgets];
        let mergedAccounts = [...currentAccounts];

        const cloudConfigured = syncService.canUseCloudSync();
        const pulled = cloudConfigured ? await syncService.pull(ownerUserId) : null;
        if (pulled) {
          const pulledTransactions = Array.isArray(pulled.transactions) ? pulled.transactions : [];
          const pulledBudgets = Array.isArray(pulled.budgets) ? pulled.budgets : [];
          const pulledAccounts = Array.isArray(pulled.accounts) ? pulled.accounts : [];

          mergedUserTransactions = mergeTransactions(localUserTransactions, pulledTransactions, ownerUserId);
          mergedUserBudgets = mergeBudgets(localUserBudgets, pulledBudgets, ownerUserId);
          mergedAccounts = mergeAccounts(currentAccounts, pulledAccounts);
        }

        mergedAccounts = mergedAccounts.map((account) => ({
          ...account,
          currency: normalizeCurrencyCode(account.currency, preferredCurrency)
        }));
        mergedUserTransactions = mergedUserTransactions.map((transaction) => ({
          ...transaction,
          currency: normalizeCurrencyCode(transaction.currency, preferredCurrency)
        }));

        const syncedAt = new Date().toISOString();
        const pushed = cloudConfigured
          ? await syncService.push({
              userId: ownerUserId,
              accounts: mergedAccounts,
              transactions: mergedUserTransactions,
              budgets: mergedUserBudgets,
              lastSyncAt: syncedAt
            })
          : false;

        const otherTransactions = currentState.transactions.filter(
          (tx) => (tx.ownerUserId ?? 'user_demo') !== ownerUserId
        );
        const otherBudgets = currentState.budgets.filter(
          (budget) => (budget.ownerUserId ?? 'user_demo') !== ownerUserId
        );

        const message = !cloudConfigured
          ? 'Local sync complete. Cloud sync is not configured.'
          : pulled || pushed
          ? pushed
            ? 'Cloud sync complete.'
            : 'Cloud data loaded. Cloud save is unavailable, local copy updated.'
          : 'Cloud sync endpoint not reachable. Local data refreshed.';

        set({
          accounts: mergedAccounts,
          transactions: [...mergedUserTransactions, ...otherTransactions].sort(sortTransactionsNewestFirst),
          budgets: [...mergedUserBudgets, ...otherBudgets],
          lastSyncAt: syncedAt,
          syncInProgress: false,
          syncMessage: message
        });

        return {
          ok: !cloudConfigured || Boolean(pulled || pushed),
          message
        };
      },
      clearSyncMessage: () => set({ syncMessage: undefined }),
      totals: () => {
        const income = get()
          .transactions.filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amountMinor, 0);
        const expense = get()
          .transactions.filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + Math.abs(t.amountMinor), 0);
        return { income, expense, total: income - expense };
      },
      byType: (type) => get().transactions.filter((t) => t.type === type)
    }),
    {
      name: 'wizenance-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        transactions: state.transactions,
        budgets: state.budgets,
        integrationStatus: state.integrationStatus,
        lastSyncAt: state.lastSyncAt,
        preferredCurrency: state.preferredCurrency
      })
    }
  )
);
