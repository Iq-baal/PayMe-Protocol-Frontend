/**
 * Mock data for local development
 * This will be replaced with real AWS API calls once backend is deployed
 */

import { UserProfile, Transaction, Notification } from '../types';

// Mock users database
export const mockUsers: UserProfile[] = [
  {
    id: 'user-1',
    username: 'alice',
    full_name: 'Alice Johnson',
    email: 'alice@example.com',
    avatar_url: null,
    occupation: 'Designer',
    is_2fa_enabled: false,
    is_discoverable: true,
    transaction_pin: '1234',
  },
  {
    id: 'user-2',
    username: 'bob',
    full_name: 'Bob Smith',
    email: 'bob@example.com',
    avatar_url: null,
    occupation: 'Developer',
    is_2fa_enabled: false,
    is_discoverable: true,
    transaction_pin: '5678',
  },
];

// Mock transactions
export const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'receive',
    amount: 50.00,
    currency: 'USDC',
    counterparty: 'user-2',
    counterpartyHandle: '@bob',
    date: new Date(Date.now() - 3600000).toISOString(),
    status: 'completed',
    narration: 'Coffee money',
    gasFee: 0.01,
    senderHandle: '@bob',
    receiverHandle: '@alice',
  },
];

// Mock notifications
export const mockNotifications: Notification[] = [];

// Mock balances (userId -> balance in USDC)
export const mockBalances: Record<string, number> = {
  'user-1': 100.00,
  'user-2': 250.00,
};

// Helper to find user by email
export const findUserByEmail = (email: string) => {
  return mockUsers.find(u => u.email === email);
};

// Helper to find user by username
export const findUserByUsername = (username: string) => {
  return mockUsers.find(u => u.username === username.replace('@', '').toLowerCase());
};

// Helper to get user transactions
export const getUserTransactions = (userId: string) => {
  return mockTransactions.filter(
    tx => tx.counterparty === userId || 
    (tx.type === 'send' && tx.senderHandle.includes(userId)) ||
    (tx.type === 'receive' && tx.receiverHandle.includes(userId))
  );
};
