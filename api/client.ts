/**
 * AWS API Gateway Client
 * Direct connection to PayMe Protocol backend API
 */

import { logger } from '../utils/logger';

// API Gateway URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://07ei5xeck7.execute-api.us-east-1.amazonaws.com/prod';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get session token from localStorage
   * The backend returns a sessionToken on login/register
   */
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('sessionToken');
    } catch (err) {
      logger.error('Failed to get auth token', err);
      return null;
    }
  }

  /**
   * Store session token
   */
  setAuthToken(token: string) {
    localStorage.setItem('sessionToken', token);
  }

  /**
   * Clear session token
   */
  clearAuthToken() {
    localStorage.removeItem('sessionToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Get session token
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || data.message || data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      logger.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async register(email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async claimUsername(username: string, pin: string) {
    return this.request('/auth/claim-username', {
      method: 'POST',
      body: JSON.stringify({ username, pin }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    this.clearAuthToken();
    return { success: true };
  }

  async refreshToken() {
    // Token refresh not implemented yet
    return { success: true };
  }

  // User endpoints
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(updates: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getUserByUsername(username: string) {
    return this.request(`/users/${username}`);
  }

  async uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('photo', file);
    
    const token = this.getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/users/profile/photo`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || data.message || 'Upload failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      logger.error('Photo upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Wallet endpoints
  async createWallet(pin: string) {
    return this.request('/wallet/create', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }

  async getBalance() {
    return this.request('/wallet/balance');
  }

  // Transaction endpoints
  async getTransactions(limit = 50) {
    return this.request(`/transactions/history?limit=${limit}`);
  }

  async sendTransaction(data: {
    recipientUsername: string;
    amount: number;
    pin: string;
    memo?: string;
  }) {
    return this.request('/transactions/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notifications endpoints (not implemented in backend yet)
  async getNotifications() {
    // Return empty array for now
    return { success: true, data: [] };
  }

  async markNotificationRead(notificationId: string) {
    // No-op for now
    return { success: true };
  }

  // Merchant endpoints
  async getMerchantProfile(username: string) {
    return this.request(`/merchants/${username}`);
  }

  async registerMerchant(data: {
    businessName: string;
    businessType: string;
    taxId: string;
  }) {
    return this.request('/merchants/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export for testing/mocking
export default apiClient;
