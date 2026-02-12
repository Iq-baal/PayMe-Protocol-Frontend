
export interface UserProfile {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    email?: string;
    occupation?: string | null;
    is_2fa_enabled?: boolean;
    is_discoverable?: boolean;
    transaction_pin?: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: number; // Stored in USDC because I'm tired of conversion logic
  currency: string; // Just for looks, the real money is in USDC
  counterparty: string;
  counterpartyHandle: string; // e.g. @alice
  date: string;
  status: 'completed' | 'pending' | 'failed';
  icon?: string;
  narration?: string;
  gasFee: number;
  senderHandle: string; // The user's handle if type=send, else the sender
  receiverHandle: string; // The user's handle if type=receive, else the receiver
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp?: number; // Added for sorting
  read: boolean;
  type: 'alert' | 'info' | 'success';
}

export enum AppTab {
  HOME = 'home',
  NOTIFICATIONS = 'notifications',
  NETWORK = 'network',
  MERCHANT = 'merchant', // Because everyone wants to be a merchant these days
  SETTINGS = 'settings'
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Exchange rate relative to 1 USDC
  flag: string; // Emoji flag
}

export type Theme = 'light' | 'dark' | 'system';