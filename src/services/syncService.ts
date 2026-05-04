import { Account, Budget, Transaction } from '@/types/domain';

type SyncSnapshot = {
  userId: string;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  lastSyncAt?: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

const isCloudUrl = (url: string) => {
  if (!url) return false;
  return !/localhost|127\.0\.0\.1/i.test(url);
};

const baseUrl = API_URL.replace(/\/$/, '');

const buildSyncUrl = (userId: string) => `${baseUrl}/sync/${encodeURIComponent(userId)}`;

const readJsonSafe = async <T>(res: Response): Promise<T | null> => {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

export const syncService = {
  canUseCloudSync() {
    return isCloudUrl(baseUrl);
  },

  async pull(userId: string): Promise<Partial<SyncSnapshot> | null> {
    if (!this.canUseCloudSync()) return null;

    try {
      const res = await fetch(buildSyncUrl(userId), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) return null;

      return await readJsonSafe<Partial<SyncSnapshot>>(res);
    } catch {
      return null;
    }
  },

  async push(snapshot: SyncSnapshot): Promise<boolean> {
    if (!this.canUseCloudSync()) return false;

    try {
      const res = await fetch(buildSyncUrl(snapshot.userId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot)
      });

      return res.ok;
    } catch {
      return false;
    }
  }
};

