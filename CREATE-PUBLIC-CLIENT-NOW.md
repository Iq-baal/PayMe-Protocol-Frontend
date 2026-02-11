# Create Public Client (2 Minutes)

## This is the ONLY way to make it work with Amplify v6

---

## Steps:

### 1. Go to AWS Cognito
https://console.aws.amazon.com/cognito/

### 2. Click "PayMe-Users-Passwordless"

### 3. Click "App integration" tab

### 4. Scroll to "App clients and analytics"

### 5. Click "Create app client" button

### 6. Fill in:

**App client name:**
```
PayMe-Public-Client
```

**App type:**
- Select: **Public client** ← IMPORTANT!

**Authentication flows:**
- ✅ ALLOW_USER_PASSWORD_AUTH
- ✅ ALLOW_REFRESH_TOKEN_AUTH
- ✅ ALLOW_USER_SRP_AUTH

### 7. Click "Create app client"

### 8. Copy the Client ID

You'll see something like:
```
Client ID: 7a8b9c0d1e2f3g4h5i6j7k8l9m
```

### 9. Send me the new Client ID

I'll update your `.env` file and we'll be done!

---

## Why This Works:

- Public clients don't have secrets
- No SECRET_HASH needed
- Amplify v6 works perfectly with public clients
- This is the AWS-recommended way for web/mobile apps

---

**This will take you 2 minutes and solve all our problems!**
