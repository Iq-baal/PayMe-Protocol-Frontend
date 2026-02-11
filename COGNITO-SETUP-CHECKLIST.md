# ✅ Super Simple Checklist - Track Your Progress!

Print this out or keep it open while you work. Check off each box as you go!

---

## 📋 Step 1: Create User Pool (15-30 min)

- [ ] Opened AWS Cognito (https://console.aws.amazon.com/cognito/)
- [ ] Selected region: **us-east-1** (N. Virginia)
- [ ] Clicked "Create user pool"
- [ ] Page 1: Checked **Email** only for sign-in
- [ ] Page 2: Selected **No MFA**
- [ ] Page 2: Enabled self-service recovery with **Email only**
- [ ] Page 3: Enabled **self-registration**
- [ ] Page 3: Added custom attribute: `username` (Mutable: **NO**)
- [ ] Page 3: Added custom attribute: `username_set` (Mutable: **YES**)
- [ ] Page 4: Selected **Send email with Cognito**
- [ ] Page 5: Named pool: **PayMe-Users-Passwordless**
- [ ] Page 5: Named app client: **PayMe-Web-Client**
- [ ] Page 5: Checked **ALLOW_CUSTOM_AUTH**
- [ ] Page 5: Checked **ALLOW_REFRESH_TOKEN_AUTH**
- [ ] Page 5: Did NOT generate client secret
- [ ] Clicked **Create user pool**
- [ ] **Copied User Pool ID**: `_______________________________`
- [ ] **Copied Client ID**: `_______________________________`
- [ ] **Wrote down Region**: `us-east-1`

---

## 📋 Step 2: Create Lambda Functions (30-45 min)

### Lambda 1: DefineAuthChallenge
- [ ] Opened Lambda console (https://console.aws.amazon.com/lambda/)
- [ ] Confirmed region is **us-east-1**
- [ ] Created function: **PayMe-DefineAuthChallenge**
- [ ] Runtime: **Node.js 18.x**
- [ ] Pasted the code from guide
- [ ] Clicked **Deploy**
- [ ] Set timeout to **30 seconds**

### Lambda 2: CreateAuthChallenge
- [ ] Created function: **PayMe-CreateAuthChallenge**
- [ ] Runtime: **Node.js 18.x**
- [ ] Pasted the code from guide
- [ ] Clicked **Deploy**
- [ ] Clicked Configuration → Permissions → Role name
- [ ] Added **AmazonSESFullAccess** policy
- [ ] Set timeout to **30 seconds**

### Lambda 3: VerifyAuthChallenge
- [ ] Created function: **PayMe-VerifyAuthChallenge**
- [ ] Runtime: **Node.js 18.x**
- [ ] Pasted the code from guide
- [ ] Clicked **Deploy**
- [ ] Set timeout to **30 seconds**

---

## 📋 Step 3: Connect Everything (5 min)

- [ ] Went back to Cognito console
- [ ] Opened **PayMe-Users-Passwordless**
- [ ] Clicked **User pool properties** tab
- [ ] Found **Lambda triggers** section
- [ ] Clicked **Add Lambda trigger**
- [ ] Connected **Define auth challenge** → PayMe-DefineAuthChallenge
- [ ] Connected **Create auth challenge** → PayMe-CreateAuthChallenge
- [ ] Connected **Verify auth challenge** → PayMe-VerifyAuthChallenge
- [ ] Clicked **Add Lambda trigger**
- [ ] Verified all 3 functions are showing

---

## 📋 Step 4: Set Up Email (5-10 min)

- [ ] Opened SES console (https://console.aws.amazon.com/ses/)
- [ ] Confirmed region is **us-east-1**
- [ ] Clicked **Verified identities**
- [ ] Clicked **Create identity**
- [ ] Selected **Email address**
- [ ] Entered my email: `_______________________________`
- [ ] Clicked **Create identity**
- [ ] Checked my email inbox
- [ ] Clicked verification link in email
- [ ] Refreshed SES page - shows **Verified**
- [ ] Went back to Lambda → PayMe-CreateAuthChallenge
- [ ] Updated the `Source:` line with my verified email
- [ ] Clicked **Deploy**

---

## 📋 Step 5: Test It (10 min)

- [ ] Went to Cognito → PayMe-Users-Passwordless
- [ ] Clicked **Users** tab
- [ ] Clicked **Create user**
- [ ] Entered my verified email
- [ ] Checked **Mark email address as verified**
- [ ] Clicked **Create user**
- [ ] User created successfully

---

## 📋 Final: Get Credentials

- [ ] **User Pool ID**: `_______________________________`
- [ ] **Client ID**: `_______________________________`
- [ ] **Region**: `us-east-1`

---

## ✅ All Done? Check These:

- [ ] User pool name is **PayMe-Users-Passwordless**
- [ ] App client name is **PayMe-Web-Client**
- [ ] All 3 Lambda functions exist
- [ ] All 3 Lambda triggers are connected
- [ ] Email is verified in SES
- [ ] Email updated in CreateAuthChallenge Lambda
- [ ] Test user created
- [ ] All 3 credentials copied above

---

## 🎉 Ready to Continue!

Copy your credentials and say in chat:

> "Cognito is ready! Here are my credentials:"
> ```
> VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
> VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
> VITE_AWS_REGION=us-east-1
> ```

---

## ⏱️ How Long Did It Take?

- Step 1 (User Pool): _____ minutes
- Step 2 (Lambdas): _____ minutes
- Step 3 (Connect): _____ minutes
- Step 4 (Email): _____ minutes
- Step 5 (Test): _____ minutes
- **Total**: _____ minutes

---

## 📝 Notes

If you had any issues or questions, write them here:

1. _______________________________
2. _______________________________
3. _______________________________

(I can help with these later!)
