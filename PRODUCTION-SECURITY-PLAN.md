# Production Security Implementation Plan

## 🎯 Overview

Complete security overhaul with AWS Cognito passwordless authentication before connecting to backend.

## 📋 Changes Required

### 1. Authentication System Overhaul
- ❌ Remove email/password auth
- ✅ Implement AWS Cognito passwordless (email + code)
- ✅ Username selection on first login (immutable after)
- ✅ Admin-only username changes

### 2. Token Management
- ❌ Remove localStorage tokens
- ✅ Use AWS Cognito tokens (handled by AWS SDK)
- ✅ Automatic token refresh
- ✅ Secure session management

### 3. Security Hardening
- ✅ Input sanitization
- ✅ Remove all console.logs
- ✅ Add rate limiting
- ✅ HTTPS enforcement
- ✅ CSP headers

### 4. Backend Validation
- ✅ Server-side balance checks
- ✅ Transaction limits
- ✅ PIN validation
- ✅ Fraud detection hooks

---

## 🔐 Part 1: AWS Cognito Passwordless Auth

### Architecture

```
User Flow:
1. User enters email
2. AWS Cognito sends 6-digit code
3. User enters code
4. First time? → Choose username (immutable)
5. Returning? → Direct to app
6. Username changes → Admin only via AWS Console/API
```

### Frontend Implementation

#### Install Dependencies
```bash
npm install @aws-amplify/auth @aws-amplify/core
```

#### Configure Amplify
```typescript
// src/config/amplify.ts
import { Amplify } from '@aws-amplify/core';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        email: true,
      },
      passwordFormat: {
        requireLowercase: false,
        requireUppercase: false,
        requireNumbers: false,
        requireSpecialCharacters: false,
        minLength: 6,
      },
    },
  },
});
```

#### New Auth Flow Components

**Step 1: Email Entry**
```typescript
// components/Auth/EmailEntry.tsx
const handleSendCode = async (email: string) => {
  await signIn({
    username: email,
    options: {
      authFlowType: 'CUSTOM_WITHOUT_SRP'
    }
  });
  // Code sent to email
};
```

**Step 2: Code Verification**
```typescript
// components/Auth/CodeVerification.tsx
const handleVerifyCode = async (code: string) => {
  await confirmSignIn({
    challengeResponse: code
  });
  // Check if username exists
  const user = await getCurrentUser();
  if (!user.username) {
    // First time - go to username selection
    setStep('username-selection');
  } else {
    // Returning user - go to app
    navigate('/home');
  }
};
```

**Step 3: Username Selection (First Time Only)**
```typescript
// components/Auth/UsernameSelection.tsx
const handleSetUsername = async (username: string) => {
  await updateUserAttributes({
    userAttributes: {
      'custom:username': username,
      'custom:username_set': 'true'
    }
  });
  // Username is now immutable
};
```

### Backend Changes (AWS Cognito)

#### Lambda Triggers

**Pre-Sign-Up Trigger**
```typescript
// Prevent duplicate usernames
export const handler = async (event) => {
  const username = event.request.userAttributes['custom:username'];
  
  if (username) {
    // Check DynamoDB for existing username
    const exists = await checkUsernameExists(username);
    if (exists) {
      throw new Error('Username already taken');
    }
  }
  
  return event;
};
```

**Post-Authentication Trigger**
```typescript
// Create user profile in DynamoDB
export const handler = async (event) => {
  const userId = event.request.userAttributes.sub;
  const email = event.request.userAttributes.email;
  const username = event.request.userAttributes['custom:username'];
  
  // Create profile if first login
  if (username && !await profileExists(userId)) {
    await createUserProfile({
      id: userId,
      email,
      username,
      created_at: new Date().toISOString()
    });
  }
  
  return event;
};
```

**Custom Message Trigger**
```typescript
// Customize email code
export const handler = async (event) => {
  if (event.triggerSource === 'CustomMessage_Authentication') {
    event.response.emailSubject = 'Your PayMe Login Code';
    event.response.emailMessage = `
      <h2>Welcome to PayMe!</h2>
      <p>Your verification code is:</p>
      <h1 style="font-size: 32px; letter-spacing: 8px;">${event.request.codeParameter}</h1>
      <p>This code expires in 3 minutes.</p>
    `;
  }
  return event;
};
```

---

## 🛡️ Part 2: Remove localStorage Tokens

### Current (Insecure)
```typescript
// ❌ DON'T DO THIS
localStorage.setItem('auth_token', token);
localStorage.setItem('payme_user_id', userId);
```

### New (Secure)
```typescript
// ✅ AWS Cognito handles everything
import { fetchAuthSession, getCurrentUser } from '@aws-amplify/auth';

// Get current session (tokens managed by AWS)
const session = await fetchAuthSession();
const accessToken = session.tokens?.accessToken;

// Get current user
const user = await getCurrentUser();
```

### Update API Client
```typescript
// api/client.ts
import { fetchAuthSession } from '@aws-amplify/auth';

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() || null;
    } catch {
      return null;
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Rest of implementation...
  }
}
```

---

## 🧹 Part 3: Remove Console Logs

### Create Production Logger
```typescript
// utils/logger.ts
const IS_PRODUCTION = import.meta.env.PROD;

export const logger = {
  log: (...args: any[]) => {
    if (!IS_PRODUCTION) console.log(...args);
  },
  error: (...args: any[]) => {
    if (!IS_PRODUCTION) console.error(...args);
    // In production, send to monitoring service
    if (IS_PRODUCTION) {
      // Send to CloudWatch, Sentry, etc.
    }
  },
  warn: (...args: any[]) => {
    if (!IS_PRODUCTION) console.warn(...args);
  },
};
```

### Replace All Console Logs
```bash
# Find all console.log
grep -r "console\." PayMe-Protocol-main/

# Replace with logger
# console.log() → logger.log()
# console.error() → logger.error()
# console.warn() → logger.warn()
```

---

## 🔒 Part 4: Input Sanitization

### Create Sanitization Utilities
```typescript
// utils/sanitize.ts
import DOMPurify from 'dompurify';

export const sanitize = {
  // Text input (narration, names, etc.)
  text: (input: string, maxLength = 200): string => {
    return DOMPurify.sanitize(input)
      .trim()
      .slice(0, maxLength);
  },

  // Username (alphanumeric + underscore only)
  username: (input: string): string => {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);
  },

  // Amount (positive number, max 2 decimals)
  amount: (input: string): number => {
    const num = parseFloat(input);
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid amount');
    }
    if (num > 1000000) {
      throw new Error('Amount too large');
    }
    return Math.round(num * 100) / 100;
  },

  // Email
  email: (input: string): string => {
    const email = input.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email');
    }
    return email;
  },

  // PIN (4 digits only)
  pin: (input: string): string => {
    const pin = input.replace(/[^0-9]/g, '');
    if (pin.length !== 4) {
      throw new Error('PIN must be 4 digits');
    }
    return pin;
  },
};
```

### Install DOMPurify
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

### Apply Sanitization
```typescript
// In SendFlow.tsx
import { sanitize } from '../utils/sanitize';

const handleConfirm = async (pin: string) => {
  try {
    const sanitizedAmount = sanitize.amount(amount);
    const sanitizedNarration = sanitize.text(narration);
    const sanitizedPin = sanitize.pin(pin);

    await apiClient.sendTransaction({
      senderId: user!.id,
      receiverId: recipientProfile.id,
      amount: sanitizedAmount,
      narration: sanitizedNarration,
      pin: sanitizedPin,
    });
  } catch (error) {
    // Handle validation errors
  }
};
```

---

## ⚡ Part 5: Rate Limiting

### Client-Side Rate Limiter
```typescript
// utils/rate-limiter.ts
class RateLimiter {
  private requests = new Map<string, number[]>();

  canMakeRequest(
    key: string,
    maxRequests: number,
    windowMs: number
  ): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside window
    const validRequests = requests.filter(
      (time) => now - time < windowMs
    );

    if (validRequests.length >= maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  reset(key: string) {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Usage
export const RATE_LIMITS = {
  RECIPIENT_SEARCH: { max: 10, window: 60000 }, // 10 per minute
  TRANSACTION: { max: 5, window: 60000 }, // 5 per minute
  LOGIN_ATTEMPT: { max: 3, window: 300000 }, // 3 per 5 minutes
};
```

### Apply Rate Limiting
```typescript
// In SendFlow.tsx
const validateRecipient = async (username: string) => {
  if (!rateLimiter.canMakeRequest(
    'recipient-search',
    RATE_LIMITS.RECIPIENT_SEARCH.max,
    RATE_LIMITS.RECIPIENT_SEARCH.window
  )) {
    setTwoFAError('Too many searches. Please wait.');
    return;
  }

  // Proceed with search
};
```

---

## 🔐 Part 6: Security Headers

### Add to index.html
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://*.amazonaws.com https://*.amazoncognito.com; 
               font-src 'self' data:;">

<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
<meta name="referrer" content="strict-origin-when-cross-origin">
```

### Vite Config
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

---

## 📦 Part 7: Environment Variables

### .env.example
```bash
# AWS Cognito
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_AWS_REGION=us-east-1

# API Gateway
VITE_API_URL=https://api.payme.com

# Feature Flags
VITE_ENABLE_BIOMETRICS=true
VITE_ENABLE_LOGGING=false

# Limits
VITE_MAX_TRANSACTION_AMOUNT=10000
VITE_DAILY_TRANSACTION_LIMIT=50000
```

---

## 🎯 Implementation Order

### Phase 1: Security Hardening (Day 1)
1. ✅ Create sanitization utilities
2. ✅ Replace all console.logs with logger
3. ✅ Add rate limiting
4. ✅ Add security headers
5. ✅ Test thoroughly

### Phase 2: AWS Cognito Integration (Day 2-3)
1. ✅ Set up Cognito User Pool
2. ✅ Configure Lambda triggers
3. ✅ Install Amplify
4. ✅ Build new auth components
5. ✅ Remove old auth system
6. ✅ Test passwordless flow

### Phase 3: Backend Integration (Day 4-5)
1. ✅ Update API client for Cognito tokens
2. ✅ Add server-side validation
3. ✅ Implement transaction limits
4. ✅ Add audit logging
5. ✅ End-to-end testing

---

## ✅ Testing Checklist

### Security Tests
- [ ] XSS prevention (try injecting scripts)
- [ ] SQL injection prevention
- [ ] Rate limiting works
- [ ] Sanitization catches malicious input
- [ ] No sensitive data in console
- [ ] Tokens not in localStorage
- [ ] Session expires correctly

### Auth Tests
- [ ] Email code delivery
- [ ] Code expiration (3 min)
- [ ] Username uniqueness
- [ ] Username immutability
- [ ] Invalid code handling
- [ ] Rate limit on login attempts

### Transaction Tests
- [ ] PIN validation
- [ ] Balance checks (server-side)
- [ ] Transaction limits
- [ ] Concurrent transaction handling
- [ ] Network failure recovery

---

## 📚 Next Steps

1. Review this plan
2. Set up AWS Cognito User Pool
3. Implement Phase 1 (security hardening)
4. Implement Phase 2 (Cognito auth)
5. Deploy and test
6. Connect to backend
7. Production deployment

**Estimated Time:** 5 days for complete implementation
**Result:** Enterprise-grade, production-ready fintech app
