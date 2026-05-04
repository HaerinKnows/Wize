export type ScreenRoute =
  | '01_Splash'
  | '02_AuthChoice'
  | '03_LoginEmail'
  | '04_SignUp'
  | '05_2FA'
  | '06_MPIN'
  | '07_BiometricEnroll'
  | '08_Dashboard_Main'
  | '09_Accounts_List'
  | '10_AddTransaction'
  | '11_CalendarAgenda'
  | '12_FiltersExport'
  | '13_Budgets'
  | '14_Analytics'
  | '15_RewardsGoals'
  | '16_Integrations'
  | '17_SettingsExportHistory';

export type TxType = 'income' | 'expense' | 'transfer';

export type Account = {
  id: string;
  name: string;
  type: string;
  balanceMinor: number;
  currency: string;
  provider: string;
};

export type Transaction = {
  id: string;
  ownerUserId: string;
  accountId: string;
  type: TxType;
  category: string;
  amountMinor: number;
  currency: string;
  timestamp: string;
  notes?: string;
  metadata?: { source?: 'manual' | 'sms' | 'integration'; sourceId?: string };
};

export type Budget = {
  id: string;
  ownerUserId: string;
  category: string;
  limitAmountMinor: number;
  period: 'monthly';
  spentAmountMinor: number;
};

export type IntegrationState = 'not_connected' | 'connecting' | 'connected';
