# 🔧 AWS Cognito Troubleshooting Guide

Common issues and how to fix them during setup.

---

## 🚨 Issue 1: Email Not Sending

### Symptoms
- User doesn't receive verification code
- No email in inbox or spam

### Possible Causes & Solutions

#### Cause 1: SES Email Not Verified
**Check:**
```bash
# Go to SES Console
# Check if your email shows "Verified" status
```

**Fix:**
1. Go to SES Console → Verified identities
2. Find your email
3. If "Pending verification" → Check your email for verification link
4. Click the link to verify
5. Wait 1-2 minutes, then test again

#### Cause 2: Lambda Missing SES Permissions
**Check:**
```bash
# Go to Lambda Console
# Open CreateAuthChallenge function
# Configuration → Permissions → View role
# Check if AmazonSESFullAccess is attached
```

**Fix:**
1. Go to IAM Console
2. Find the Lambda execution role
3. Click "Add permissions" → "Attach policies"
4. Search for "AmazonSESFullAccess"
5. Attach the policy
6. Test again

#### Cause 3: Wrong FROM_EMAIL
**Check:**
```javascript
// In CreateAuthChallenge Lambda code
Source: 'noreply@yourdomain.com'  // Is this verified in SES?
```

**Fix:**
1. Change to your verified SES email
2. Or add environment variable: `FROM_EMAIL`
3. Deploy Lambda
4. Test again

#### Cause 4: SES in Sandbox Mode
**Check:**
```bash
# Go to SES Console → Account dashboard
# Check if "Sandbox" appears
```

**Fix:**
- In sandbox mode, you can only send to verified emails
- For testing: Verify recipient email in SES
- For production: Request production access (takes 24 hours)

#### Cause 5: Lambda Timeout
**Check CloudWatch Logs:**
```bash
# Go to Lambda → CreateAuthChallenge → Monitor → View logs
# Look for "Task timed out" errors
```

**Fix:**
1. Increase Lambda timeout to 30 seconds
2. Configuration → General configuration → Edit
3. Set timeout: 30 seconds
4. Save and test again

---

## 🚨 Issue 2: Authentication Failing

### Symptoms
- Code verification fails
- "Invalid code" error
- Can't log in

### Possible Causes & Solutions

#### Cause 1: Lambda Triggers Not Attached
**Check:**
```bash
# Go to Cognito → User pool → User pool properties → Lambda triggers
# Verify all 3 triggers are attached
```

**Fix:**
1. Attach DefineAuthChallenge Lambda
2. Attach CreateAuthChallenge Lambda
3. Attach VerifyAuthChallenge Lambda
4. Save changes
5. Test again

#### Cause 2: Wrong Auth Flow Enabled
**Check:**
```bash
# Go to Cognito → App integration → App clients
# Check "Authentication flows"
```

**Fix:**
1. Ensure ALLOW_CUSTOM_AUTH is checked ✅
2. Ensure ALLOW_REFRESH_TOKEN_AUTH is checked ✅
3. Save changes
4. Test again

#### Cause 3: Code Expired
**Check:**
```bash
# Codes expire in 3 minutes
# Did user wait too long?
```

**Fix:**
- Request new code
- Enter code within 3 minutes

#### Cause 4: Lambda Logic Error
**Check CloudWatch Logs:**
```bash
# Go to Lambda → Monitor → View logs in CloudWatch
# Look for errors or unexpected behavior
```

**Fix:**
1. Review Lambda code
2. Check for typos
3. Verify logic matches guide
4. Deploy and test again

---

## 🚨 Issue 3: Custom Attributes Not Working

### Symptoms
- Can't set username
- Username not saving
- Attribute errors

### Possible Causes & Solutions

#### Cause 1: Attributes Not Created
**Check:**
```bash
# Go to Cognito → User pool → Sign-up experience → Attribute verification
# Scroll to "Custom attributes"
```

**Fix:**
1. If missing, you need to recreate the user pool
2. Custom attributes can't be added after creation
3. Follow Step 1 again, ensuring you add:
   - custom:username (Mutable: No)
   - custom:username_set (Mutable: Yes)

#### Cause 2: Wrong Attribute Name
**Check:**
```typescript
// In your code, are you using:
'custom:username'  // ✅ Correct
'username'         // ❌ Wrong
```

**Fix:**
- Always prefix with `custom:`
- Update code and test again

#### Cause 3: Trying to Change Immutable Attribute
**Check:**
```bash
# Is custom:username set to Mutable: No?
```

**Expected Behavior:**
- First time: Can set username ✅
- After set: Can't change ❌ (this is correct!)
- Only admin can change via AWS Console

---

## 🚨 Issue 4: Lambda Not Triggering

### Symptoms
- No logs in CloudWatch
- Lambda doesn't execute
- Auth flow hangs

### Possible Causes & Solutions

#### Cause 1: Cognito Can't Invoke Lambda
**Check:**
```bash
# Go to Lambda → Configuration → Permissions
# Check "Resource-based policy statements"
```

**Fix:**
1. Remove Lambda trigger from Cognito
2. Re-add Lambda trigger
3. AWS automatically adds invoke permission
4. Test again

#### Cause 2: Lambda in Wrong Region
**Check:**
```bash
# Lambda region: us-east-1
# Cognito region: us-west-2
# ❌ Must be same region!
```

**Fix:**
1. Create Lambda in same region as Cognito
2. Or recreate Cognito in Lambda's region
3. Attach triggers
4. Test again

#### Cause 3: Lambda Deleted or Renamed
**Check:**
```bash
# Go to Cognito → Lambda triggers
# Do all 3 Lambdas show correctly?
```

**Fix:**
1. Re-attach correct Lambda functions
2. Save changes
3. Test again

---

## 🚨 Issue 5: Frontend Can't Connect

### Symptoms
- "User pool not found"
- "Invalid client ID"
- Connection errors

### Possible Causes & Solutions

#### Cause 1: Wrong Credentials
**Check:**
```bash
# In your .env file:
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX  # Correct format?
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX  # Correct?
VITE_AWS_REGION=us-east-1  # Matches pool region?
```

**Fix:**
1. Go to Cognito Console
2. Copy User Pool ID exactly
3. Go to App integration → App clients
4. Copy Client ID exactly
5. Update .env file
6. Restart dev server

#### Cause 2: Client Secret Generated
**Check:**
```bash
# Go to Cognito → App clients → Your app
# Is "Client secret" shown?
```

**Fix:**
- Web apps should NOT have client secret
- Delete app client
- Create new one WITHOUT secret
- Update Client ID in .env

#### Cause 3: Wrong Region
**Check:**
```bash
# User Pool region: us-east-1
# .env VITE_AWS_REGION: us-west-2
# ❌ Must match!
```

**Fix:**
1. Check User Pool region in console (top right)
2. Update VITE_AWS_REGION to match
3. Restart dev server

---

## 🚨 Issue 6: "User Not Found" Error

### Symptoms
- Can't sign in
- "User does not exist"
- New user can't register

### Possible Causes & Solutions

#### Cause 1: Self-Registration Disabled
**Check:**
```bash
# Go to Cognito → Sign-up experience
# Is "Enable self-registration" checked?
```

**Fix:**
1. Enable self-registration
2. Save changes
3. Test again

#### Cause 2: Email Not Verified
**Check:**
```bash
# Go to Cognito → Users
# Find user → Check "Email verified" status
```

**Fix:**
1. Manually verify email in Cognito console
2. Or have user click verification link in email
3. Test again

---

## 🚨 Issue 7: CloudWatch Logs Not Showing

### Symptoms
- Can't see Lambda logs
- No logs in CloudWatch

### Possible Causes & Solutions

#### Cause 1: Lambda Missing CloudWatch Permissions
**Check:**
```bash
# Go to Lambda → Configuration → Permissions
# Check if AWSLambdaBasicExecutionRole is attached
```

**Fix:**
1. Go to IAM Console
2. Find Lambda execution role
3. Attach AWSLambdaBasicExecutionRole
4. Test again

#### Cause 2: Looking in Wrong Region
**Check:**
```bash
# CloudWatch region: us-west-2
# Lambda region: us-east-1
# ❌ Must match!
```

**Fix:**
1. Switch CloudWatch to Lambda's region
2. Refresh logs

#### Cause 3: Logs Not Created Yet
**Check:**
```bash
# Have you triggered the Lambda?
```

**Fix:**
1. Test Lambda manually
2. Or trigger via Cognito auth flow
3. Wait 10-30 seconds
4. Refresh CloudWatch

---

## 🔍 Debugging Checklist

When something doesn't work, check in this order:

1. **CloudWatch Logs**
   - [ ] Check all 3 Lambda function logs
   - [ ] Look for errors or exceptions
   - [ ] Verify functions are being triggered

2. **Cognito Configuration**
   - [ ] User Pool exists
   - [ ] App Client configured correctly
   - [ ] Lambda triggers attached
   - [ ] Custom attributes created

3. **Lambda Configuration**
   - [ ] All 3 functions deployed
   - [ ] Correct code (no typos)
   - [ ] Proper permissions (SES, CloudWatch)
   - [ ] Timeout set to 30 seconds

4. **SES Configuration**
   - [ ] Email verified
   - [ ] Correct FROM_EMAIL
   - [ ] Not in sandbox (or recipient verified)

5. **Frontend Configuration**
   - [ ] Correct User Pool ID
   - [ ] Correct Client ID
   - [ ] Correct Region
   - [ ] .env file loaded

---

## 🛠️ Useful AWS CLI Commands

### Check User Pool
```bash
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_XXXXXXXXX
```

### List App Clients
```bash
aws cognito-idp list-user-pool-clients \
  --user-pool-id us-east-1_XXXXXXXXX
```

### Check Lambda Triggers
```bash
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_XXXXXXXXX \
  --query 'UserPool.LambdaConfig'
```

### Test Lambda
```bash
aws lambda invoke \
  --function-name PayMe-DefineAuthChallenge \
  --payload '{}' \
  response.json
```

### Check SES Verified Emails
```bash
aws ses list-verified-email-addresses
```

---

## 📞 Still Stuck?

If you've tried everything and it's still not working:

1. **Share with me:**
   - Error message (exact text)
   - CloudWatch logs (last 10 lines)
   - What you were trying to do
   - What happened instead

2. **I'll help you:**
   - Debug the issue
   - Check your configuration
   - Fix the problem
   - Get you back on track

Just say: "I'm stuck with [issue]. Here's what I see: [error/logs]"

---

## ✅ Success Indicators

You'll know everything is working when:

- [ ] User enters email → Receives code within 30 seconds
- [ ] User enters code → Gets authenticated
- [ ] CloudWatch shows all 3 Lambda executions
- [ ] No errors in any logs
- [ ] Frontend connects successfully
- [ ] Tokens are returned

---

## 🎯 Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| No email | Verify SES email, check Lambda permissions |
| Auth fails | Check Lambda triggers attached |
| Can't set username | Verify custom attributes exist |
| Lambda not running | Check same region, re-attach triggers |
| Frontend errors | Verify credentials in .env |
| User not found | Enable self-registration |
| No logs | Check CloudWatch permissions |

---

## 💡 Pro Tips

1. **Always check CloudWatch first** - Logs tell you everything
2. **Test one Lambda at a time** - Isolate issues
3. **Use test events** - Don't wait for full auth flow
4. **Keep regions consistent** - Everything in same region
5. **Copy credentials carefully** - One wrong character breaks everything

---

**Remember**: Most issues are simple configuration mistakes. Check the basics first! 🔍
