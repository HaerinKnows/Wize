import { Account, Budget, Transaction } from '@/types/domain';
import { getPreferredCurrency } from '@/utils/currency';

const DEVICE_CURRENCY = getPreferredCurrency();

export const seedAccounts: Account[] = [
  {
    id: 'acc_01',
    name: 'Main Wallet',
    type: 'e-wallet',
    balanceMinor: 2450200,
    currency: DEVICE_CURRENCY,
    provider: 'GCash'
  },
  {
    id: 'acc_02',
    name: 'Savings',
    type: 'bank',
    balanceMinor: 9320000,
    currency: DEVICE_CURRENCY,
    provider: 'BPI'
  }
];

export const seedTransactions: Transaction[] = [
  {
    id: 'txn_001',
    ownerUserId: 'user_demo',
    accountId: 'acc_01',
    type: 'expense',
    category: 'groceries',
    amountMinor: -4550,
    currency: DEVICE_CURRENCY,
    timestamp: '2026-02-01T12:34:56Z',
    notes: 'Bought groceries',
    metadata: { source: 'sms', sourceId: 'sms_123' }
  },
  {
    id: 'txn_002',
    ownerUserId: 'user_demo',
    accountId: 'acc_01',
    type: 'income',
    category: 'salary',
    amountMinor: 280000,
    currency: DEVICE_CURRENCY,
    timestamp: '2026-02-03T12:34:56Z',
    notes: 'Salary payout',
    metadata: { source: 'integration', sourceId: 'int_23' }
  }
];

export const seedBudgets: Budget[] = [
  {
    id: 'bud_01',
    ownerUserId: 'user_demo',
    category: 'Food',
    limitAmountMinor: 60000,
    period: 'monthly',
    spentAmountMinor: 42100
  },
  {
    id: 'bud_02',
    ownerUserId: 'user_demo',
    category: 'Transport',
    limitAmountMinor: 20000,
    period: 'monthly',
    spentAmountMinor: 10200
  }
];
