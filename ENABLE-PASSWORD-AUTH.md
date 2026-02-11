# Enable Password Authentication in Cognito

## The Issue

Your app client has a client secret, which requires additional configuration. We need to enable the right authentication flows.

---

## Quick Fix (5 minutes):

### Step 1: Go to Your User Pool
- AWS Cognito Console: https://console.aws.amazon.com/cognito/
- Region: **us-east-1**
- Click on **PayMe-Users-Passwordless**

### Step 2: Go to App Integration Tab
- Click **App integration** at the top

### Step 3: Find Your App Client
- Scroll down to **App clients and analytics**
- Click on **PayMe-Web-Client** (your existing client)

### Step 4: Edit Authentication Flows
- Click **Edit** button (top right of the app client details)
- Scroll down to **Authentication flows**

### Step 5: Enable These Flows
Make sure these are CHECKED:
- ✅ **ALLOW_USER_PASSWORD_AUTH** ← This is the important one!
- ✅ **ALLOW_REFRESH_TOKEN_AUTH**
- ✅ **ALLOW_USER_SRP_AUTH**

You can UNCHECK:
- ❌ ALLOW_CUSTOM_AUTH (we're not using custom auth anymore)

### Step 6: Save Changes
- Scroll to the bottom
- Click **Save changes**

---

## That's It!

Now refresh your browser and try signing up again. The SECRET_HASH error should be gone!

---

## Why This Works

When you enable `ALLOW_USER_PASSWORD_AUTH`, Cognito allows direct username/password authentication even with a client secret. The AWS SDK handles the secret hash calculation automatically.

---

**Still getting errors?** Let me know and I'll help troubleshoot!
