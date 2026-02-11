# 🧪 Test Your Cognito Authentication

## Quick Start

1. **Start the dev server:**
   ```bash
   cd PayMe-Protocol-frontend/PayMe-Protocol-main
   npm run dev
   ```

2. **Open your browser:**
   - The terminal will show a URL (usually `http://localhost:5173`)
   - Open it in your browser

3. **Test the auth flow:**

---

## 📧 Step 1: Email Entry

You'll see a beautiful screen asking for your email.

**What to do:**
- Enter your email: `phyzeon11@gmail.com` (or any email you verified in Cognito)
- Click "Continue"

**What happens:**
- The app sends a request to Cognito
- Cognito triggers your Lambda function
- Lambda sends a 6-digit code to your email

**Troubleshooting:**
- If you get an error, check the browser console (F12)
- Make sure your `.env` file has the correct Cognito credentials
- Make sure your email is verified in Cognito

---

## 🔢 Step 2: Code Verification

You'll see a screen asking for the 6-digit code.

**What to do:**
- Check your email for the code
- Enter the 6 digits
- Click "Verify Code"

**What happens:**
- The app sends the code to Cognito
- Cognito verifies it with your Lambda function
- If correct, you're authenticated!

**Troubleshooting:**
- Code expires in 3 minutes
- If expired, click "Use a different email" and start over
- Check spam folder if you don't see the email

---

## 👤 Step 3: Username Selection (First-Time Users Only)

If this is your first time signing in, you'll see a username selection screen.

**What to do:**
- Choose a username (3-30 characters, letters and numbers only)
- Click "Continue"

**Important:**
- ⚠️ You can't change your username later!
- Choose wisely!

**What happens:**
- The app saves your username to Cognito
- You're redirected to the main app

---

## 🎉 Step 4: You're In!

You should now see the PayMe home screen!

**What to check:**
- Your username should appear in the top-left
- You should see your balance (mock data for now)
- Try navigating between tabs

---

## 🔐 Test Sign Out

**What to do:**
- Go to Settings tab (bottom-right)
- Scroll down
- Click "Sign Out"

**What happens:**
- You're signed out of Cognito
- You're redirected to the login screen

---

## 🐛 Common Issues

### "Failed to send code"
- Check your `.env` file has correct credentials
- Make sure Lambda functions are connected to Cognito
- Check AWS CloudWatch logs for Lambda errors

### "Invalid code"
- Make sure you entered all 6 digits
- Code might have expired (3 minutes)
- Try requesting a new code

### "Failed to set username"
- Username might already be taken
- Try a different username
- Check browser console for details

### App won't load
- Make sure you ran `npm install`
- Make sure dev server is running
- Check browser console for errors

---

## 📱 Test on Mobile

Want to test on your phone?

1. Find your computer's local IP address:
   - Windows: `ipconfig` (look for IPv4)
   - Mac/Linux: `ifconfig` (look for inet)

2. Update Vite config to allow external access:
   ```bash
   npm run dev -- --host
   ```

3. Open on your phone:
   - Go to `http://YOUR_IP:5173`
   - Example: `http://192.168.1.100:5173`

---

## ✅ What's Working

- ✅ Email entry with validation
- ✅ Code sending via Cognito
- ✅ Code verification
- ✅ Username selection for new users
- ✅ Session management
- ✅ Sign out

## 🚧 What's Mock Data

- Balance (shows $0 for now)
- Transactions (empty for now)
- Notifications (empty for now)

These will work once you deploy the backend and connect it!

---

## 🎯 Next Steps

Once auth is working:

1. **Deploy your backend:**
   - Follow the deployment guide in the backend folder
   - Get your API Gateway URL

2. **Update `.env`:**
   ```
   VITE_API_URL=https://your-api-gateway-url.amazonaws.com/prod
   ```

3. **Test real API calls:**
   - Send transactions
   - Check real balance
   - View real transaction history

---

**Need help?** Check the browser console (F12) for detailed error messages!
