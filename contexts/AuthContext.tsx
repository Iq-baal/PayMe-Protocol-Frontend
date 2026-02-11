import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { UserProfile } from '../types';
import { logger } from '../utils/logger';

interface AuthContextType {
  session: boolean; 
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  claimUsername: (username: string, pin: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on boot if token exists
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Try to fetch user profile from backend
      const response = await apiClient.getProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // If profile fetch fails, check if we have userId in localStorage
        // This handles the case where user registered but hasn't claimed username
        const userId = localStorage.getItem('userId');
        const email = localStorage.getItem('email');
        
        if (userId && email) {
          // Create minimal user profile for users without username
          const tempUser: UserProfile = {
            userId,
            email,
            username: '', // No username claimed yet
            walletAddress: '',
            balance: 0,
            createdAt: Date.now(),
          };
          setUser(tempUser);
        } else {
          // Token invalid or no user data, clear everything
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('email');
          setUser(null);
        }
      }
    } catch (err) {
      logger.error('Auth check failed', err);
      
      // On error, try to recover from localStorage
      const userId = localStorage.getItem('userId');
      const email = localStorage.getItem('email');
      
      if (userId && email) {
        const tempUser: UserProfile = {
          userId,
          email,
          username: '',
          walletAddress: '',
          balance: 0,
          createdAt: Date.now(),
        };
        setUser(tempUser);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      
      if (!response.success) {
        return { error: response.error || 'Login failed' };
      }
      
      // Store session token
      if (response.data.sessionToken) {
        apiClient.setAuthToken(response.data.sessionToken);
      }
      
      // Store userId and email for recovery
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('email', response.data.email);
      
      // Create user profile from login response
      // Login returns: userId, email, username (null if not claimed), tokens
      const userProfile: UserProfile = {
        userId: response.data.userId,
        email: response.data.email,
        username: response.data.username || '', // Empty string if not claimed
        walletAddress: response.data.walletAddress || '',
        balance: response.data.balance || 0,
        createdAt: response.data.createdAt || Date.now(),
      };
      
      setUser(userProfile);
      
      return { error: null };
    } catch (err: any) {
      logger.error('Sign in error', err);
      return { error: err.message || 'Login failed' };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const response = await apiClient.register(email, password);
      
      if (!response.success) {
        return { error: response.error || 'Registration failed' };
      }
      
      // Store session token (backend returns sessionToken directly)
      if (response.data.sessionToken) {
        apiClient.setAuthToken(response.data.sessionToken);
      }
      
      // Store userId and email for recovery
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('email', response.data.email || email);
      
      // Create a minimal user profile from registration response
      // Username will be set later via claimUsername
      const tempUser: UserProfile = {
        userId: response.data.userId,
        email: response.data.email || email,
        username: '', // Will be claimed later
        walletAddress: '',
        balance: 0,
        createdAt: Date.now(),
      };
      
      setUser(tempUser);
      
      return { error: null };
    } catch (err: any) {
      logger.error('Sign up error', err);
      return { error: err.message || 'Registration failed' };
    }
  };

  const claimUsername = async (username: string, pin: string) => {
    try {
      const response = await apiClient.claimUsername(username, pin);
      
      if (!response.success) {
        return { error: response.error || 'Failed to claim username' };
      }
      
      // Refresh profile with new username
      await refreshProfile();
      
      return { error: null };
    } catch (err: any) {
      logger.error('Claim username error', err);
      return { error: err.message || 'Failed to claim username' };
    }
  };

  const signOut = async () => {
    try {
      await apiClient.logout();
      apiClient.clearAuthToken();
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      setUser(null);
      logger.log('User signed out');
    } catch (err) {
      logger.error('Sign out error', err);
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await apiClient.getProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (err) {
      logger.error('Profile refresh failed', err);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user logged in' };
    
    try {
      const response = await apiClient.updateProfile(updates);
      
      if (!response.success) {
        return { error: response.error || 'Update failed' };
      }
      
      await refreshProfile();
      return { error: null };
    } catch (err: any) {
      logger.error('Profile update error', err);
      return { error: err.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session: !!user, 
      user, 
      loading, 
      signIn,
      signUp,
      claimUsername,
      signOut, 
      refreshProfile, 
      updateProfile 
    }}>
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
