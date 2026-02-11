# Security Fixes Implementation Guide

## 🔴 CRITICAL FIX #1: PIN/Biometrics Flow

### The Problem
Current flow is confusing and insecure:
- Biometrics can bypass PIN
- PIN never sent to backend
- Unclear authentication hierarchy

### The Correct Fintech Flow

**Option A: PIN is Primary (Recommended for Fintech)**
```
Transaction Initiated
    ↓
Has PIN set? 
    ↓ YES → Prompt for PIN
    ↓ NO  → Prompt to set PIN first
    ↓
PIN Entered
    ↓
Biometrics enabled?
    ↓ YES → Verify biometrics THEN send PIN to backend
    ↓ NO  → Send PIN directly to backend
    ↓
Backend validates PIN
    ↓
Transaction approved/rejected
```

**Option B: Biometrics as Convenience (Alternative)**
```
Transaction Initiated
    ↓
Biometrics enabled?
    ↓ YES → Verify biometrics
           ↓ SUCCESS → Retrieve encrypted PIN, send to backend
           ↓ FAIL → Fallback to manual PIN entry
    ↓ NO → Prompt for PIN
    ↓
Backend validates PIN
    ↓
Transaction approved/rejected
```

### Implementation (Option A - Recommended)

**Key Principles:**
1. **PIN is ALWAYS required** for transactions
2. **Biometrics are convenience** - they unlock the ability to enter PIN
3. **Backend ALWAYS validates PIN** - never trust client
4. **PIN never stored client-side** - only sent during transaction

---

## 🔴 CRITICAL FIX #2: Secure Token Storage

### Current (Insecure)
```typescript
localStorage.setItem('auth_token', token);
```

### Fixed (Secure)
```typescript
// Backend sets httpOnly cookie
// Frontend never touches token directly
// Automatic inclusion in requests
```

### Implementation Steps

1. **Backend Changes:**
```typescript
// On login success
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000 // 15 minutes
});

res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

2. **Frontend Changes:**
```typescript
// Remove all localStorage token code
// Cookies automatically sent with requests
fetch(url, {
  credentials: 'include' // Include cookies
});
```

---

## 🔴 CRITICAL FIX #3: Server-Side Validation

### Add to Backend

```typescript
// ALWAYS validate on backend
async function sendTransaction(req, res) {
  const { senderId, receiverId, amount, pin } = req.body;
  
  // 1. Validate PIN
  const user = await getUser(senderId);
  const pinValid = await bcrypt.compare(pin, user.transaction_pin_hash);
  if (!pinValid) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  
  // 2. Check balance (NEVER trust client)
  const balance = await getBalance(senderId);
  if (balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // 3. Check transaction limits
  const dailyTotal = await getDailyTransactionTotal(senderId);
  if (dailyTotal + amount > DAILY_LIMIT) {
    return res.status(400).json({ error: 'Daily limit exceeded' });
  }
  
  // 4. Process transaction
  // ...
}
```

---

## 🟡 MEDIUM FIX #1: Token Expiration

### Implementation

```typescript
// api/client.ts
class ApiClient {
  private async request(endpoint, options) {
    try {
      const response = await fetch(url, options);
      
      // Check for token expiration
      if (response.status === 401) {
        // Try to refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request
          return this.request(endpoint, options);
        } else {
          // Force logout
          window.location.href = '/login';
        }
      }
      
      return response;
    } catch (error) {
      // Handle error
    }
  }
  
  private async refreshToken() {
    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

---

## 🟡 MEDIUM FIX #2: Input Sanitization

### Implementation

```typescript
// utils/sanitize.ts
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .slice(0, 200); // Max length
}

export function sanitizeAmount(amount: string): number {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0 || num > 1000000) {
    throw new Error('Invalid amount');
  }
  return Math.round(num * 100) / 100; // 2 decimal places
}

export function sanitizeUsername(username: string): string {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30);
}
```

### Usage

```typescript
// In SendFlow
const handleConfirm = async (pin: string) => {
  const sanitizedNarration = sanitizeInput(narration);
  const sanitizedAmount = sanitizeAmount(amount);
  
  await apiClient.sendTransaction({
    senderId: user.id,
    receiverId: recipientProfile.id,
    amount: sanitizedAmount,
    narration: sanitizedNarration,
    pin: pin // PIN sent to backend for validation
  });
};
```

---

## 🟡 MEDIUM FIX #3: Rate Limiting

### Implementation

```typescript
// utils/rate-limiter.ts
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  canMakeRequest(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

// Usage in SendFlow
const validateRecipient = async (username: string) => {
  if (!rateLimiter.canMakeRequest('recipient-search', 5, 10000)) {
    console.warn('Rate limit exceeded');
    return;
  }
  
  // Make API call
};
```

---

## 🟢 ADDITIONAL SECURITY MEASURES

### 1. Environment Variables

```typescript
// .env.production
VITE_API_URL=https://api.payme.com
VITE_ENABLE_LOGGING=false
VITE_MAX_TRANSACTION_AMOUNT=10000
```

### 2. Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://api.payme.com;">
```

### 3. Remove Console Logs

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove all console.log
        drop_debugger: true
      }
    }
  }
});
```

### 4. Session Timeout

```typescript
// App.tsx
useEffect(() => {
  let timeout: NodeJS.Timeout;
  
  const resetTimeout = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      // Auto logout after 15 minutes of inactivity
      signOut();
    }, 15 * 60 * 1000);
  };
  
  // Reset on user activity
  window.addEventListener('mousemove', resetTimeout);
  window.addEventListener('keypress', resetTimeout);
  
  resetTimeout();
  
  return () => {
    clearTimeout(timeout);
    window.removeEventListener('mousemove', resetTimeout);
    window.removeEventListener('keypress', resetTimeout);
  };
}, []);
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Critical (Do First)
- [ ] Fix PIN/Biometrics flow
- [ ] Move tokens to httpOnly cookies
- [ ] Add server-side validation
- [ ] Remove console.logs in production
- [ ] Add input sanitization

### Phase 2: Important (Do Next)
- [ ] Implement token expiration
- [ ] Add rate limiting
- [ ] Add session timeout
- [ ] Implement HTTPS enforcement
- [ ] Add CSP headers

### Phase 3: Enhanced Security
- [ ] Add fraud detection
- [ ] Implement transaction limits
- [ ] Add audit logging
- [ ] Add 2FA for high-value transactions
- [ ] Implement device fingerprinting

---

## 🧪 TESTING CHECKLIST

- [ ] Test PIN validation with wrong PIN
- [ ] Test biometrics fallback to PIN
- [ ] Test token expiration and refresh
- [ ] Test rate limiting
- [ ] Test XSS prevention
- [ ] Test session timeout
- [ ] Test insufficient balance
- [ ] Test concurrent transactions
- [ ] Test network failures
- [ ] Penetration testing

---

## 📚 RESOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)
- [WebAuthn Best Practices](https://www.w3.org/TR/webauthn/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
