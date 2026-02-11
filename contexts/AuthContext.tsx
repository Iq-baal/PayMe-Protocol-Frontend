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
      
      // Fetch user profile from backend
      const response = await apiClient.getProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('sessionToken');
        setUser(null);
      }
    } catch (err) {
      logger.error('Auth check failed', err);
      setUser(null);
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
      
      // Set user profile
      if (response.data.user) {
        setUser(response.data.user);
      } else {
        // Fetch profile if not included in login response
        await refreshProfile();
      }
      
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
      
      // Store session token
      if (response.data.sessionToken) {
        apiClient.setAuthToken(response.data.sessionToken);
      }
      
      // Set user profile (without username yet)
      if (response.data.user) {
        setUser(response.data.user);
      }
      
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
