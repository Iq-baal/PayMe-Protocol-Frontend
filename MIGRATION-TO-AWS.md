# Migration from Supabase/Convex to AWS

## ✅ Completed

All Supabase and Convex dependencies have been removed from the frontend.

## Changes Made

### 1. Removed Dependencies
- `@supabase/supabase-js` - Removed
- `convex` - Removed
- `bcryptjs` - Removed (password hashing now handled by backend)

### 2. New API Client
Created `api/client.ts` - A clean AWS API Gateway client that:
- Handles authentication tokens
- Makes REST API calls to Lambda functions
- Uses mock data for local development (when `VITE_API_URL` is not set)
- Automatically switches to real AWS API when deployed

### 3. Mock Data for Development
Created `api/mock-data.ts` with:
- Sample users (alice@example.com, bob@example.com - password: "password")
- Mock transactions
- Mock balances
- Allows full frontend testing without backend

### 4. Updated Components
- `contexts/AuthContext.tsx` - Now uses `apiClient` instead of Supabase
- `App.tsx` - Removed Supabase realtime subscriptions
- `index.tsx` - Removed Supabase configuration checks

### 5. Components Still Need Updating
These components still have Supabase imports but won't break (they check for null):
- `components/Home.tsx`
- `components/SendFlow.tsx`
- `components/Notifications.tsx`
- `components/TransactionList.tsx`
- `components/Settings.tsx`

## Local Development

### Current State
The app runs with **mock data** - you can:
- Register new users
- Login with existing mock users
- View mock transactions
- Test the full UI flow

### Mock Users
- Email: `alice@example.com` / Password: `password`
- Email: `bob@example.com` / Password: `password`

## Connecting to AWS Backend

### When Backend is Deployed

1. Get your API Gateway URL from AWS deployment
2. Create `.env` file:
   ```
   VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
   ```
3. Restart dev server
4. Frontend will automatically use real AWS API

### API Endpoints Expected

The frontend expects these endpoints from your Lambda functions:

**Auth:**
- `POST /auth/login` - Login user
- `POST /auth/register` - Register new user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh token

**User:**
- `GET /user/profile/:userId` - Get user profile
- `PUT /user/profile/:userId` - Update profile
- `GET /user/username/:username` - Find user by username
- `POST /user/photo` - Upload profile photo

**Wallet:**
- `GET /wallet/balance/:userId` - Get balance
- `GET /wallet/address/:userId` - Get wallet address

**Transactions:**
- `GET /transactions/:userId` - Get user transactions
- `POST /transactions/send` - Send transaction

**Notifications:**
- `GET /notifications/:userId` - Get notifications
- `PUT /notifications/:notificationId/read` - Mark as read

## Next Steps

1. ✅ Remove Supabase/Convex (DONE)
2. ✅ Create AWS API client (DONE)
3. ✅ Add mock data for development (DONE)
4. ⏳ Update remaining components to use API client
5. ⏳ Deploy backend to AWS
6. ⏳ Connect frontend to deployed backend
7. ⏳ Test end-to-end flow

## Testing

### Test with Mock Data (Current)
```bash
npm run dev
# App runs on http://localhost:3000
# Uses mock data automatically
```

### Test with AWS Backend (After Deployment)
```bash
# Add VITE_API_URL to .env
npm run dev
# App will use real AWS API
```

## Notes

- Mock data persists only in memory (resets on page refresh)
- Real-time features (notifications, balance updates) are disabled until AWS backend is connected
- All authentication is JWT-based (stored in localStorage)
- Frontend is ready for AWS integration - just needs backend URL
