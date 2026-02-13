/**
 * Supabase Client Configuration
 * Enterprise-grade security with Row Level Security
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with security options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'payme-auth-token',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'PayMe Protocol',
    },
  },
});

// Database Types (auto-generated from schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          full_name: string | null;
          occupation: string | null;
          avatar_url: string | null;
          phone_number: string | null;
          wallet_address: string | null;
          encrypted_private_key: string | null;
          encryption_salt: string | null;
          encryption_iv: string | null;
          pin_hash: string | null;
          is_2fa_enabled: boolean;
          is_discoverable: boolean;
          is_deleted: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          signature: string;
          sender_id: string | null;
          recipient_id: string | null;
          sender_username: string | null;
          recipient_username: string | null;
          amount: number;
          currency: string;
          memo: string | null;
          status: string;
          transaction_type: string;
          created_at: string;
          confirmed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          read_at: string | null;
          related_transaction_id: string | null;
          metadata: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
