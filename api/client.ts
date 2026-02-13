/**
 * Supabase API Client
 * Replaces AWS API Gateway with Supabase client
 */

import { supabase } from '../lib/supabase';
import { sendUSDC, getUSDCBalance, getKeypairFromEncrypted } from '../lib/wallet';
import { verifyPIN } from '../lib/crypto';
import { logger } from '../utils/logger';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Get balance from blockchain
      let balance = 0;
      if (data.wallet_address) {
        balance = await getUSDCBalance(data.wallet_address);
      }

      return {
        success: true,
        data: {
          userId: data.id,
          email: data.email,
          username: data.username,
          fullName: data.full_name,
          occupation: data.occupation,
          avatarUrl: data.avatar_url,
          phoneNumber: data.phone_number,
          walletAddress: data.wallet_address,
          balance,
          createdAt: new Date(data.created_at).getTime(),
        },
      };
    } catch (error) {
      logger.error('Get profile failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get profile',
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: any): Promise<ApiResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      // Map fields to database columns
      const dbUpdates: any = {};
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.occupation !== undefined) dbUpdates.occupation = updates.occupation;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;

      const { error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', session.user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Update profile failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, wallet_address')
        .eq('username', username)
        .eq('is_deleted', false)
        .single();

      if (error) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        data: {
          userId: data.id,
          username: data.username,
          fullName: data.full_name,
          avatarUrl: data.avatar_url,
          walletAddress: data.wallet_address,
        },
      };
    } catch (error) {
      logger.error('Get user by username failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User not found',
      };
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<ApiResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', session.user.id)
        .single();

      if (error || !data.wallet_address) {
        return { success: false, error: 'No wallet found' };
      }

      const balance = await getUSDCBalance(data.wallet_address);

      return {
        success: true,
        data: { balance },
      };
    } catch (error) {
      logger.error('Get balance failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get balance',
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(limit = 50): Promise<ApiResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data.map(tx => ({
          id: tx.id,
          signature: tx.signature,
          senderUsername: tx.sender_username,
          recipientUsername: tx.recipient_username,
          amount: parseFloat(tx.amount),
          currency: tx.currency,
          memo: tx.memo,
          status: tx.status,
          type: tx.transaction_type,
          createdAt: new Date(tx.created_at).getTime(),
          confirmedAt: tx.confirmed_at ? new Date(tx.confirmed_at).getTime() : undefined,
        })),
      };
    } catch (error) {
      logger.error('Get transactions failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transactions',
      };
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(data: {
    recipientUsername: string;
    amount: number;
    pin: string;
    memo?: string;
  }): Promise<ApiResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      // Get sender's wallet data
      const { data: senderData, error: senderError } = await supabase
        .from('users')
        .select('username, wallet_address, encrypted_private_key, encryption_iv, encryption_salt, pin_hash')
        .eq('id', session.user.id)
        .single();

      if (senderError || !senderData.wallet_address) {
        return { success: false, error: 'Wallet not found' };
      }

      // Verify PIN
      const pinValid = await verifyPIN(data.pin, senderData.pin_hash);
      if (!pinValid) {
        return { success: false, error: 'Invalid PIN' };
      }

      // Get recipient's wallet address
      const { data: recipientData, error: recipientError } = await supabase
        .from('users')
        .select('id, wallet_address')
        .eq('username', data.recipientUsername)
        .eq('is_deleted', false)
        .single();

      if (recipientError || !recipientData.wallet_address) {
        return { success: false, error: 'Recipient not found' };
      }

      // Decrypt sender's private key
      const senderKeypair = await getKeypairFromEncrypted(
        senderData.encrypted_private_key,
        data.pin,
        senderData.encryption_iv,
        senderData.encryption_salt
      );

      // Send transaction on blockchain
      const signature = await sendUSDC(
        senderKeypair,
        recipientData.wallet_address,
        data.amount
      );

      // Record transaction in database
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          signature,
          sender_id: session.user.id,
          recipient_id: recipientData.id,
          sender_username: senderData.username,
          recipient_username: data.recipientUsername,
          amount: data.amount,
          currency: 'USDC',
          memo: data.memo,
          status: 'confirmed',
          transaction_type: 'transfer',
          confirmed_at: new Date().toISOString(),
        });

      if (txError) {
        logger.error('Failed to record transaction', txError);
        // Transaction succeeded on blockchain, but failed to record
        // Return success anyway
      }

      // Create notification for recipient
      await supabase
        .from('notifications')
        .insert({
          user_id: recipientData.id,
          title: 'Payment Received',
          message: `You received ${data.amount} USDC from @${senderData.username}`,
          type: 'transaction',
        });

      return {
        success: true,
        data: { signature },
      };
    } catch (error) {
      logger.error('Send transaction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }

  /**
   * Get notifications
   */
  async getNotifications(): Promise<ApiResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data.map(notif => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          isRead: notif.is_read,
          readAt: notif.read_at ? new Date(notif.read_at).getTime() : undefined,
          createdAt: new Date(notif.created_at).getTime(),
        })),
      };
    } catch (error) {
      logger.error('Get notifications failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get notifications',
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Mark notification read failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark as read',
      };
    }
  }

  /**
   * Export wallet (get private key with PIN verification)
   */
  async exportWallet(pin: string): Promise<ApiResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('users')
        .select('encrypted_private_key, encryption_iv, encryption_salt, pin_hash')
        .eq('id', session.user.id)
        .single();

      if (error || !data.encrypted_private_key) {
        return { success: false, error: 'Wallet not found' };
      }

      // Verify PIN
      const pinValid = await verifyPIN(pin, data.pin_hash);
      if (!pinValid) {
        return { success: false, error: 'Invalid PIN' };
      }

      // Decrypt private key
      const keypair = await getKeypairFromEncrypted(
        data.encrypted_private_key,
        pin,
        data.encryption_iv,
        data.encryption_salt
      );

      return {
        success: true,
        data: {
          privateKey: Buffer.from(keypair.secretKey).toString('base64'),
        },
      };
    } catch (error) {
      logger.error('Export wallet failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Delete account (soft delete with 30-day grace period)
   */
  async deleteAccount(pin: string): Promise<ApiResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('users')
        .select('pin_hash')
        .eq('id', session.user.id)
        .single();

      if (error) {
        return { success: false, error: 'User not found' };
      }

      // Verify PIN
      const pinValid = await verifyPIN(pin, data.pin_hash);
      if (!pinValid) {
        return { success: false, error: 'Invalid PIN' };
      }

      // Soft delete
      const { error: deleteError } = await supabase
        .from('users')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Delete account failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  /**
   * Reinstate account (restore deleted account)
   */
  async reinstateAccount(pin: string): Promise<ApiResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('users')
        .select('pin_hash, is_deleted')
        .eq('id', session.user.id)
        .single();

      if (error) {
        return { success: false, error: 'User not found' };
      }

      if (!data.is_deleted) {
        return { success: false, error: 'Account is not deleted' };
      }

      // Verify PIN
      const pinValid = await verifyPIN(pin, data.pin_hash);
      if (!pinValid) {
        return { success: false, error: 'Invalid PIN' };
      }

      // Restore account
      const { error: restoreError } = await supabase
        .from('users')
        .update({
          is_deleted: false,
          deleted_at: null,
        })
        .eq('id', session.user.id);

      if (restoreError) {
        return { success: false, error: restoreError.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Reinstate account failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reinstate failed',
      };
    }
  }

  /**
   * Upload photo (placeholder - implement with Supabase Storage)
   */
  async uploadPhoto(file: File): Promise<ApiResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      // Upload to Supabase Storage
      const fileName = `${session.user.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) {
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user profile
      await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      return {
        success: true,
        data: { url: publicUrl },
      };
    } catch (error) {
      logger.error('Upload photo failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Legacy methods for compatibility (no-ops)
  async register() {
    return { success: false, error: 'Use AuthContext.signUp instead' };
  }

  async login() {
    return { success: false, error: 'Use AuthContext.signIn instead' };
  }

  async logout() {
    return { success: false, error: 'Use AuthContext.signOut instead' };
  }

  async claimUsername() {
    return { success: false, error: 'Use AuthContext.claimUsername instead' };
  }

  setAuthToken() {
    // No-op - Supabase handles tokens automatically
  }

  clearAuthToken() {
    // No-op - Supabase handles tokens automatically
  }

  async refreshToken() {
    // No-op - Supabase handles token refresh automatically
    return { success: true };
  }

  async createWallet() {
    return { success: false, error: 'Wallet created automatically on username claim' };
  }

  async getMerchantProfile(username: string) {
    // TODO: Implement merchant features
    return { success: false, error: 'Not implemented yet' };
  }

  async registerMerchant() {
    // TODO: Implement merchant features
    return { success: false, error: 'Not implemented yet' };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export for testing/mocking
export default apiClient;
