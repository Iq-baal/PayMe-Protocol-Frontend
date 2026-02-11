/**
 * Calculate Cognito SECRET_HASH
 * Required when app client has a client secret
 * 
 * ⚠️ WARNING: This should NOT be in frontend code for production!
 * Use a public client (no secret) for production apps.
 */

import CryptoJS from 'crypto-js';

export function calculateSecretHash(username: string): string {
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
  const clientSecret = import.meta.env.VITE_COGNITO_CLIENT_SECRET || '';
  
  if (!clientSecret) {
    throw new Error('Client secret not configured');
  }
  
  // SECRET_HASH = Base64(HMAC_SHA256(username + clientId, clientSecret))
  const message = username + clientId;
  const hash = CryptoJS.HmacSHA256(message, clientSecret);
  const secretHash = CryptoJS.enc.Base64.stringify(hash);
  
  return secretHash;
}
