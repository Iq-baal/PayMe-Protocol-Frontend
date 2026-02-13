/**
 * Supabase Passwordless Auth Context
 * Magic Link Flow: Email → Code → Username → Transaction PIN → Dashboard
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateKeypair, encryptPrivateKey, getUSDCBalance } from '../lib/wallet';
import { hashPIN } from '../lib/crypto';
import { UserProfile } from '../types';
import { logger } from '../utils/logger';

interface AuthContextType {
  session: boolean;
  user: UserProfile | null;
  loading: boolean;
  sendOTPCode: (email: string) => Promise<{ error: string | null }>;
  verifyOTP: (email: string, token: string) => Promise<{ error: string | null }>;
  claimUsername: (username: string) => Promise<{ error: string | null }>;
  setTransactionPIN: (pin: string) => Promise<{ error: string | null }>;
  changeTransactionPIN: (oldPin: string, newPin: string) => Promise<{ error: string | null }>;
  verifyTransactionPIN: (pin: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    } catch (err) {
      logger.error('Auth check failed', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        // Get balance from blockchain if wallet exists
        let balance = 0;
        if (data.wallet_address) {
          balance = await getUSDCBalance(data.wallet_address);
        }

        const userProfile: UserProfile = {
          userId: data.id,
          email: data.email,
          username: data.username || '',
          fullName: data.full_name || undefined,
          occupation: data.occupation || undefined,
          avatarUrl: data.avatar_url || undefined,
          phoneNumber: data.phone_number || undefined,
          walletAddress: data.wallet_address || '',
          balance,
          createdAt: new Date(data.created_at).getTime(),
        };

        setUser(userProfile);
      }
    } catch (err) {
      logger.error('Failed to load user profile', err);
    }
  };

  /**
   * Send 6-digit OTP code to email via custom Edge Function
   */
  const sendOTPCode = async (email: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      logger.log('Calling send-otp function...', { supabaseUrl });
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({ email }),
        }
      );

      logger.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Function error:', errorText);
        return { error: `Failed to send code: ${response.status}` };
      }

      const data = await response.json();
      logger.log('Function response:', data);

      if (data.error) {
        return { error: data.error };
      }

      // Store OTP temporarily for verification
      sessionStorage.setItem('pending_otp', data.otp);
      sessionStorage.setItem('pending_email', email);
      sessionStorage.setItem('otp_expires', (Date.now() + 5 * 60 * 1000).toString());

      return { error: null };
    } catch (err: any) {
      logger.error('Send OTP code error', err);
      return { error: err.message || 'Failed to send code' };
    }
  };

  /**
   * Verify OTP code
   */
  const verifyOTP = async (email: string, token: string) => {
    try {
      // Get stored OTP from session
      const storedOTP = sessionStorage.getItem('pending_otp');
      const storedEmail = sessionStorage.getItem('pending_email');
      const expiresAt = sessionStorage.getItem('otp_expires');

      if (!storedOTP || !storedEmail || !expiresAt) {
        return { error: 'No pending verification. Please request a new code.' };
      }

      if (storedEmail !== email) {
        return { error: 'Email mismatch. Please try again.' };
      }

      if (Date.now() > parseInt(expiresAt)) {
        sessionStorage.removeItem('pending_otp');
        sessionStorage.removeItem('pending_email');
        sessionStorage.removeItem('otp_expires');
        return { error: 'Code expired. Please request a new one.' };
      }

      if (token !== storedOTP) {
        return { error: 'Invalid code. Please try again.' };
      }

      // Clear OTP from session
      sessionStorage.removeItem('pending_otp');
      sessionStorage.removeItem('pending_email');
      sessionStorage.removeItem('otp_expires');

      // Create new user account
      const randomPassword = crypto.randomUUID();
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: randomPassword,
        options: {
          emailRedirectTo: undefined,
          data: {
            email_confirmed: true,
          },
        },
      });

      // If user already exists, show helpful error
      if (signUpError?.message?.includes('already registered') || signUpError?.message?.includes('User already registered')) {
        logger.log('User already exists');
        return { error: 'This email is already registered. Please use a different email or contact support.' };
      }

      if (signUpError) {
        logger.error('Sign up error:', signUpError);
        return { error: signUpError.message || 'Failed to create account' };
      }

      const userId = signUpData?.user?.id;

      if (!userId) {
        return { error: 'Failed to create session' };
      }

      // Wait for database trigger to create user profile
      logger.log('Waiting for user profile creation...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Load user profile (created by database trigger)
      await loadUserProfile(userId);

      return { error: null };
    } catch (err: any) {
      logger.error('Verify OTP error', err);
      return { error: err.message || 'Verification failed' };
    }
  };

  /**
   * Claim username (creates wallet automatically)
   */
  const claimUsername = async (username: string) => {
    try {
      if (!user) {
        return { error: 'Not authenticated' };
      }

      // Validate username format
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return { error: 'Username must be 3-20 characters (letters, numbers, underscore)' };
      }

      // Check username availability
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existing) {
        return { error: 'Username already taken' };
      }

      // Generate wallet (client-side)
      const { publicKey, privateKey } = generateKeypair();

      // Store wallet address and username (private key will be encrypted with PIN later)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username,
          wallet_address: publicKey,
        })
        .eq('id', user.userId);

      if (updateError) {
        logger.error('Failed to claim username', updateError);
        return { error: 'Failed to claim username' };
      }

      // Store private key temporarily in memory (will be encrypted with PIN)
      sessionStorage.setItem('temp_private_key', privateKey);

      // Refresh profile
      await refreshProfile();

      return { error: null };
    } catch (err: any) {
      logger.error('Claim username error', err);
      return { error: err.message || 'Failed to claim username' };
    }
  };

  /**
   * Set transaction PIN (first time setup)
   */
  const setTransactionPIN = async (pin: string) => {
    try {
      if (!user) {
        return { error: 'Not authenticated' };
      }

      // Validate PIN format
      if (!/^\d{4}$/.test(pin)) {
        return { error: 'PIN must be 4 digits' };
      }

      // Get temporary private key from session
      const privateKey = sessionStorage.getItem('temp_private_key');
      if (!privateKey) {
        return { error: 'Wallet not found. Please claim username again.' };
      }

      // Encrypt private key with PIN
      const { encrypted, iv, salt } = await encryptPrivateKey(privateKey, pin);

      // Hash PIN for storage
      const pinHash = await hashPIN(pin);

      // Update user with encrypted wallet and PIN
      const { error: updateError } = await supabase
        .from('users')
        .update({
          encrypted_private_key: encrypted,
          encryption_iv: iv,
          encryption_salt: salt,
          pin_hash: pinHash,
        })
        .eq('id', user.userId);

      if (updateError) {
        logger.error('Failed to set PIN', updateError);
        return { error: 'Failed to set PIN' };
      }

      // Clear temporary private key
      sessionStorage.removeItem('temp_private_key');

      // Trigger welcome bonus via Edge Function (if available)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-bonus`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.userId,
              walletAddress: user.walletAddress,
            }),
          });
        }
      } catch (bonusError) {
        logger.error('Failed to send bonus', bonusError);
        // Don't fail PIN setup if bonus fails
      }

      // Refresh profile
      await refreshProfile();

      return { error: null };
    } catch (err: any) {
      logger.error('Set PIN error', err);
      return { error: err.message || 'Failed to set PIN' };
    }
  };

  /**
   * Change transaction PIN
   */
  const changeTransactionPIN = async (oldPin: string, newPin: string) => {
    try {
      if (!user) {
        return { error: 'Not authenticated' };
      }

      // Validate new PIN format
      if (!/^\d{4}$/.test(newPin)) {
        return { error: 'PIN must be 4 digits' };
      }

      // Get user's encrypted wallet data
      const { data, error } = await supabase
        .from('users')
        .select('encrypted_private_key, encryption_iv, encryption_salt, pin_hash')
        .eq('id', user.userId)
        .single();

      if (error || !data.encrypted_private_key) {
        return { error: 'Wallet not found' };
      }

      // Verify old PIN
      const { verifyPIN } = await import('../lib/crypto');
      const pinValid = await verifyPIN(oldPin, data.pin_hash);
      if (!pinValid) {
        return { error: 'Incorrect current PIN' };
      }

      // Decrypt with old PIN
      const { decryptData } = await import('../lib/crypto');
      const privateKey = await decryptData(
        data.encrypted_private_key,
        oldPin,
        data.encryption_iv,
        data.encryption_salt
      );

      // Re-encrypt with new PIN
      const { encrypted, iv, salt } = await encryptPrivateKey(privateKey, newPin);

      // Hash new PIN
      const pinHash = await hashPIN(newPin);

      // Update database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          encrypted_private_key: encrypted,
          encryption_iv: iv,
          encryption_salt: salt,
          pin_hash: pinHash,
        })
        .eq('id', user.userId);

      if (updateError) {
        return { error: 'Failed to change PIN' };
      }

      return { error: null };
    } catch (err: any) {
      logger.error('Change PIN error', err);
      return { error: err.message || 'Failed to change PIN' };
    }
  };

  /**
   * Verify transaction PIN (for sending money)
   */
  const verifyTransactionPIN = async (pin: string): Promise<boolean> => {
    try {
      if (!user) return false;

      const { data, error } = await supabase
        .from('users')
        .select('pin_hash')
        .eq('id', user.userId)
        .single();

      if (error || !data.pin_hash) return false;

      const { verifyPIN } = await import('../lib/crypto');
      return await verifyPIN(pin, data.pin_hash);
    } catch (err) {
      logger.error('Verify PIN error', err);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem('temp_private_key');
      setUser(null);
      logger.log('User signed out');
    } catch (err) {
      logger.error('Sign out error', err);
    }
  };

  const refreshProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadUserProfile(session.user.id);
      }
    } catch (err) {
      logger.error('Profile refresh failed', err);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const dbUpdates: any = {};
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.occupation !== undefined) dbUpdates.occupation = updates.occupation;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;

      const { error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', user.userId);

      if (error) {
        logger.error('Failed to update profile', error);
        return { error: 'Update failed' };
      }

      await refreshProfile();
      return { error: null };
    } catch (err: any) {
      logger.error('Profile update error', err);
      return { error: err.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session: !!user,
        user,
        loading,
        sendOTPCode,
        verifyOTP,
        claimUsername,
        setTransactionPIN,
        changeTransactionPIN,
        verifyTransactionPIN,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Legacy exports for compatibility
export const signIn = () => {
  throw new Error('Use sendOTPCode instead');
};

export const signUp = () => {
  throw new Error('Use sendOTPCode instead');
};
