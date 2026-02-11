# 🔄 AWS Cognito Passwordless Auth Flow

## 📊 Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PASSWORDLESS AUTH FLOW                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│  User    │         │ Frontend │         │ Cognito  │         │ Lambdas  │
│          │         │   App    │         │   Pool   │         │          │
└────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │                    │
     │  1. Enter Email    │                    │                    │
     ├───────────────────>│                    │                    │
     │                    │                    │                    │
     │                    │  2. InitiateAuth   │                    │
     │                    │   (CUSTOM_AUTH)    │                    │
     │                    ├───────────────────>│                    │
     │                    │                    │                    │
     │                    │                    │ 3. DefineAuthChallenge
     │                    │                    ├───────────────────>│
     │                    │                    │                    │
     │                    │                    │ 4. "Send Code"     │
     │                    │                    │<───────────────────┤
     │                    │                    │                    │
     │                    │                    │ 5. CreateAuthChallenge
     │                    │                    ├───────────────────>│
     │                    │                    │                    │
     │                    │                    │                    │ 6. Generate
     │                    │                    │                    │    6-digit
     │                    │                    │                    │    code
     │                    │                    │                    │
     │                    │                    │                    │ 7. Send email
     │  8. Email with     │                    │                    │    via SES
     │     code arrives   │<───────────────────┼────────────────────┤
     │<───────────────────┤                    │                    │
     │                    │                    │                    │
     │                    │  9. Challenge      │                    │
     │                    │     Response       │                    │
     │                    │<───────────────────┤                    │
     │                    │                    │                    │
     │ 10. Enter Code     │                    │                    │
     ├───────────────────>│                    │                    │
     │                    │                    │                    │
     │                    │ 11. RespondToAuth  │                    │
     │                    │     (with code)    │                    │
     │                    ├───────────────────>│                    │
     │                    │                    │                    │
     │                    │                    │ 12. VerifyAuthChallenge
     │                    │                    ├───────────────────>│
     │                    │                    │                    │
     │                    │                    │                    │ 13. Compare
     │                    │                    │                    │     codes
     │                    │                    │                    │
     │                    │                    │ 14. "Correct!"     │
     │                    │                    │<───────────────────┤
     │                    │                    │                    │
     │                    │                    │ 15. DefineAuthChallenge
     │                    │                    ├───────────────────>│
     │                    │                    │                    │
     │                    │                    │ 16. "Issue Tokens" │
     │                    │                    │<───────────────────┤
     │                    │                    │                    │
     │                    │ 17. Auth Tokens    │                    │
     │                    │     (ID, Access,   │                    │
     │                    │      Refresh)      │                    │
     │                    │<───────────────────┤                    │
     │                    │                    │                    │
     │ 18. Logged In! ✅  │                    │                    │
     │<───────────────────┤                    │                    │
     │                    │                    │                    │
```

---

## 🔍 Detailed Step Breakdown

### Phase 1: Email Entry (Steps 1-9)

**1. User enters email**
- User types their email in the frontend
- Frontend validates email format

**2. Frontend calls Cognito**
- `Auth.signIn(email)` with CUSTOM_AUTH flow
- No password required!

**3. DefineAuthChallenge Lambda**
- Cognito asks: "What should we do?"
- Lambda responds: "Send a challenge (code)"

**4. Lambda decision**
- First attempt → Send code
- Returns: `challengeName: 'CUSTOM_CHALLENGE'`

**5. CreateAuthChallenge Lambda**
- Cognito triggers this Lambda
- Lambda generates 6-digit code

**6. Code generation**
- Uses crypto.randomInt(100000, 999999)
- Stores code in privateChallengeParameters

**7. Email sent**
- Lambda uses SES to send email
- Email contains the 6-digit code

**8. User receives email**
- Beautiful HTML email with code
- Code expires in 3 minutes

**9. Frontend receives challenge**
- Cognito returns challenge to frontend
- Frontend shows "Enter code" screen

---

### Phase 2: Code Verification (Steps 10-18)

**10. User enters code**
- User types the 6-digit code from email
- Frontend validates it's 6 digits

**11. Frontend sends code**
- `Auth.sendCustomChallengeAnswer(code)`
- Code sent to Cognito

**12. VerifyAuthChallenge Lambda**
- Cognito triggers this Lambda
- Lambda receives the code

**13. Code comparison**
- Lambda compares expected vs provided code
- Returns: `answerCorrect: true/false`

**14. Verification result**
- If correct → Continue
- If wrong → Fail authentication

**15. DefineAuthChallenge Lambda (again)**
- Cognito asks: "What now?"
- Lambda responds: "Issue tokens!"

**16. Token issuance**
- Lambda returns: `issueTokens: true`
- Cognito generates JWT tokens

**17. Tokens returned**
- ID Token (user info)
- Access Token (API access)
- Refresh Token (get new tokens)

**18. User logged in**
- Frontend stores tokens securely
- User redirected to app

---

## 🎯 First-Time User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│              FIRST-TIME USER (USERNAME SELECTION)                   │
└─────────────────────────────────────────────────────────────────────┘

After successful authentication:

1. Frontend checks: Does user have username?
   └─> Check custom:username attribute

2. If NO username:
   ├─> Show username selection screen
   ├─> User enters desired username
   ├─> Frontend validates (3-30 chars, alphanumeric)
   ├─> Frontend calls: updateUserAttributes()
   ├─> Set custom:username = chosen username
   ├─> Set custom:username_set = "true"
   └─> Username is now IMMUTABLE (can't be changed)

3. If username exists:
   └─> Go directly to app

4. Future logins:
   └─> Username already set, skip selection
```

---

## 🔐 Security Features

### Token Storage
```
❌ OLD WAY (Insecure):
localStorage.setItem('token', 'abc123')
→ Vulnerable to XSS attacks

✅ NEW WAY (Secure):
Cognito SDK manages tokens
→ Stored in memory
→ Automatic refresh
→ httpOnly cookies (optional)
```

### Username Immutability
```
First Login:
├─> custom:username = null
├─> User chooses: "alice"
├─> custom:username = "alice" (Mutable: false)
└─> custom:username_set = "true"

Future Attempts:
├─> User tries to change username
└─> ❌ DENIED (attribute is immutable)

Admin Override:
└─> Only AWS admin can change via console
```

### Code Expiration
```
Code Generated: 12:00:00
Code Expires:   12:03:00 (3 minutes)

User enters code at 12:02:30 → ✅ Valid
User enters code at 12:03:01 → ❌ Expired
```

---

## 🏗️ Architecture Components

### Frontend (React + Amplify)
```typescript
import { Auth } from '@aws-amplify/auth';

// 1. User enters email
await Auth.signIn(email);

// 2. User enters code
await Auth.sendCustomChallengeAnswer(user, code);

// 3. Get current user
const user = await Auth.currentAuthenticatedUser();

// 4. Get tokens
const session = await Auth.currentSession();
const idToken = session.getIdToken().getJwtToken();
```

### Backend (Cognito + Lambda)
```
Cognito User Pool
├─> Custom Attributes
│   ├─> custom:username (immutable)
│   └─> custom:username_set (mutable)
│
├─> Lambda Triggers
│   ├─> DefineAuthChallenge
│   ├─> CreateAuthChallenge
│   └─> VerifyAuthChallenge
│
└─> App Client
    ├─> ALLOW_CUSTOM_AUTH
    └─> ALLOW_REFRESH_TOKEN_AUTH
```

### Email Service (SES)
```
CreateAuthChallenge Lambda
└─> AWS SES
    ├─> Send email with code
    ├─> HTML + Text versions
    └─> From: noreply@yourdomain.com
```

---

## 📊 Data Flow

### User Attributes in Cognito
```json
{
  "email": "alice@example.com",
  "email_verified": true,
  "custom:username": "alice",
  "custom:username_set": "true",
  "sub": "uuid-1234-5678-90ab-cdef"
}
```

### JWT Token Structure
```json
{
  "sub": "uuid-1234-5678-90ab-cdef",
  "email": "alice@example.com",
  "email_verified": true,
  "custom:username": "alice",
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXX",
  "exp": 1234567890,
  "iat": 1234567890
}
```

---

## 🎯 Why This Approach?

### ✅ Benefits

1. **No Passwords**
   - Users don't need to remember passwords
   - No password reset flows
   - No password strength requirements

2. **Secure**
   - Codes expire in 3 minutes
   - One-time use only
   - Tokens managed by Cognito

3. **User-Friendly**
   - Just enter email → get code → done
   - Familiar flow (like Slack, Notion)

4. **Scalable**
   - Cognito handles millions of users
   - Lambda auto-scales
   - SES handles email delivery

5. **Immutable Usernames**
   - Users can't change their @username
   - Prevents impersonation
   - Admin-only changes

---

## 🔄 Comparison: Old vs New

### Old Flow (Email/Password)
```
1. User enters email + password
2. Frontend validates
3. Send to backend
4. Backend checks database
5. Return token
6. Store in localStorage ❌ INSECURE
```

### New Flow (Passwordless)
```
1. User enters email
2. Cognito sends code
3. User enters code
4. Cognito verifies
5. Return JWT tokens
6. Amplify manages tokens ✅ SECURE
```

---

## 📝 Summary

**What you're building:**
- Passwordless authentication (email + code)
- Immutable usernames
- Secure token management
- Production-ready fintech auth

**Components:**
- 1 Cognito User Pool
- 1 App Client
- 3 Lambda functions
- SES for emails

**Result:**
- Enterprise-grade security
- Great user experience
- Scalable architecture
- Production-ready! 🚀
