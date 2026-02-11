# 🚀 Super Simple AWS Cognito Setup Guide

**Hey! This guide will help you set up passwordless login for PayMe.**

**Time needed**: About 1-2 hours (grab a coffee ☕)
**What you need**: AWS account login

Don't worry if you've never done this before - I'll walk you through every single step!

---

## 📋 What We're Building

Think of it like this:
- **User Pool** = Your list of users (like a phonebook)
- **App Client** = How your app talks to AWS
- **3 Magic Functions** = They send codes and check if they're correct

When someone logs in:
1. They type their email
2. AWS sends them a 6-digit code
3. They enter the code
4. They're in! No password needed 🎉

---

## 🎯 Step 1: Create Your User Pool (15-30 minutes)

This is where all your users will be stored. Let's make it!

### Using AWS Console (Easy Way - Follow This!)

**1. Open AWS Cognito**
   - Go to: https://console.aws.amazon.com/cognito/
   - Look at the top right corner - see the region name? (like "N. Virginia" or "Ohio")
   - Pick **us-east-1 (N. Virginia)** - this is important! Write it down:
     ```
     My region: us-east-1
     ```

**2. Click the Big Orange "Create user pool" Button**

**3. Page 1: Configure sign-in**
   - Under "How do you want your end users to sign in?"
   - ✅ Check **Email** ONLY
   - ❌ Uncheck everything else (Username, Phone, etc.)
   - Click **Next** at the bottom

**4. Page 2: Security stuff**
   - Password policy: Leave it as **"Cognito defaults"** (we won't use passwords anyway!)
   - Multi-factor authentication (MFA): Select **"No MFA"**
   - User account recovery: ✅ Check **"Enable self-service account recovery"**
   - How should users recover their account?: Select **"Email only"**
   - Click **Next**

**5. Page 3: Sign-up settings**
   - Self-service sign-up: ✅ Check **"Enable self-registration"**
   - Attribute verification: ✅ Check **"Allow Cognito to automatically send messages"**
   - Attributes to verify: ✅ Check **"Send email message, verify email address"**
   - Required attributes: ✅ Check **"email"** (should already be checked)
   
   - **IMPORTANT: Custom attributes** (scroll down a bit)
     * Click **"Add custom attribute"**
     * Name: `username` (type exactly this)
     * Type: **String**
     * Min length: `3`
     * Max length: `30`
     * Mutable: **NO** (uncheck the box) ⚠️ This is important!
     * Click **"Add custom attribute"** again
     * Name: `username_set` (type exactly this)
     * Type: **String**
     * Min length: `0`
     * Max length: `10`
     * Mutable: **YES** (check the box)
   
   - Click **Next**

**6. Page 4: Email settings**
   - Email provider: Select **"Send email with Cognito"** (easiest option)
   - FROM email address: Leave as default
   - Click **Next**

**7. Page 5: Name your pool**
   - User pool name: Type exactly: `PayMe-Users-Passwordless`
   - ⚠️ **IMPORTANT**: Use this exact name!
   
   - Hosted authentication pages: Select **"Use the Cognito Hosted UI"** then immediately select **"I want to create a user pool without a hosted UI"** (we don't need it)
   
   - Initial app client:
     * App client name: Type exactly: `PayMe-Web-Client`
     * ⚠️ **IMPORTANT**: Use this exact name!
     * Client secret: **DON'T generate a client secret** (make sure it's NOT checked)
     * Authentication flows: 
       - ✅ Check **ALLOW_CUSTOM_AUTH**
       - ✅ Check **ALLOW_REFRESH_TOKEN_AUTH**
       - ❌ Uncheck everything else
   
   - Click **Next**

**8. Page 6: Review everything**
   - Scroll through and make sure everything looks right
   - Click **Create user pool** (big orange button)

**9. 🎉 Success! Now save your info:**
   
   After it's created, you'll see a page with your pool details.
   
   - Look for **User pool ID** (looks like: `us-east-1_XXXXXXXXX`)
   - Copy it and write it here:
     ```
     VITE_COGNITO_USER_POOL_ID=us-east-1_O6REsQ1pJ
     ```
   
   - Click on **App integration** tab at the top
   - Scroll down to **App clients and analytics**
   - Click on **PayMe-Web-Client**
   - Copy the **Client ID** (long string of letters and numbers)
   - Write it here:
     ```
     VITE_COGNITO_CLIENT_ID=us-east-1:47a61048-df54-419b-8a2d-69380772daf0
     ```
   
   - Write your region:
     ```
     VITE_AWS_REGION=us-east-1
     ```

**✅ Step 1 Done! Take a 5-minute break, you earned it!**

---

## 🎯 Step 2: Create the Magic Functions (30-45 minutes)

These are called "Lambda functions" - they're like little robots that do specific jobs.
We need 3 of them to make the passwordless login work.

### Lambda 1: The Decision Maker (DefineAuthChallenge)

This one decides: "Should we send a code? Or let them in?"

**1. Go to AWS Lambda**
   - Open: https://console.aws.amazon.com/lambda/
   - Make sure you're in **us-east-1** (same region as before!)

**2. Click "Create function" (orange button)**

**3. Fill in the details:**
   - Choose **"Author from scratch"**
   - Function name: Type exactly: `PayMe-DefineAuthChallenge`
   - ⚠️ **IMPORTANT**: Use this exact name!
   - Runtime: Select **Node.js 18.x** (or newer if available)
   - Architecture: Leave as **x86_64**
   - Click **Create function** (bottom right)

**4. Add the code:**
   - You'll see a code editor
   - Delete everything in there
   - Copy and paste this EXACT code:

```javascript
exports.handler = async (event) => {
  console.log('DefineAuthChallenge - Starting');
  
  if (event.request.session.length === 0) {
    // First time - send them a code
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'CUSTOM_CHALLENGE';
    console.log('Sending code to user');
  } else if (
    event.request.session.length === 1 &&
    event.request.session[0].challengeName === 'CUSTOM_CHALLENGE' &&
    event.request.session[0].challengeResult === true
  ) {
    // They got the code right - let them in!
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
    console.log('Code correct - logging them in');
  } else {
    // Wrong code - no entry
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
    console.log('Code wrong - access denied');
  }
  
  return event;
};
```

**5. Save it:**
   - Click **Deploy** (orange button near the top)
   - Wait for "Successfully deployed" message

**6. Make it wait longer:**
   - Click **Configuration** tab
   - Click **General configuration** on the left
   - Click **Edit**
   - Change Timeout to **30** seconds
   - Click **Save**

**✅ Lambda 1 Done!**

---

### Lambda 2: The Code Sender (CreateAuthChallenge)

This one creates the 6-digit code and emails it to the user.

**1. Go back to Lambda main page**
   - Click **Functions** in the left menu
   - Click **Create function**

**2. Fill in the details:**
   - Function name: Type exactly: `PayMe-CreateAuthChallenge`
   - ⚠️ **IMPORTANT**: Use this exact name!
   - Runtime: **Node.js 18.x**
   - Click **Create function**

**3. Add the code:**
   - Delete everything in the editor
   - Copy and paste this code:

```javascript
const crypto = require('crypto');
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });

exports.handler = async (event) => {
  console.log('CreateAuthChallenge - Generating code');
  
  // Make a random 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  console.log('Code generated for:', event.request.userAttributes.email);
  
  // Save the code (AWS handles this securely)
  event.response.privateChallengeParameters = { code };
  event.response.challengeMetadata = 'CODE_CHALLENGE';
  
  // Get user's email
  const email = event.request.userAttributes.email;
  
  // Send the email
  try {
    await ses.sendEmail({
      Source: 'noreply@payme.com', // ⚠️ CHANGE THIS to your email later
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Your PayMe Login Code'
        },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #FF5722;">Welcome to PayMe!</h2>
                <p>Your verification code is:</p>
                <h1 style="font-size: 48px; letter-spacing: 8px; color: #FF5722;">${code}</h1>
                <p style="color: #666;">This code expires in 3 minutes.</p>
                <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
              </div>
            `
          },
          Text: {
            Data: `Your PayMe code is: ${code}\n\nExpires in 3 minutes.`
          }
        }
      }
    }).promise();
    
    console.log('Email sent to:', email);
  } catch (error) {
    console.error('Email failed:', error);
    // Don't stop the login if email fails
  }
  
  return event;
};
```

**4. Click Deploy**

**5. Give it permission to send emails (IMPORTANT!):**
   - Click **Configuration** tab
   - Click **Permissions** on the left
   - Click on the **Role name** (it's a blue link)
   - This opens a new tab - don't close the Lambda tab!
   - In the new tab, click **Add permissions** → **Attach policies**
   - In the search box, type: `AmazonSESFullAccess`
   - ✅ Check the box next to it
   - Click **Add permissions** (bottom right)
   - Close this tab and go back to Lambda

**6. Set timeout:**
   - Configuration → General configuration → Edit
   - Timeout: **30** seconds
   - Click **Save**

**✅ Lambda 2 Done!**

---

### Lambda 3: The Code Checker (VerifyAuthChallenge)

This one checks if the code the user entered is correct.

**1. Create another function:**
   - Functions → Create function
   - Function name: Type exactly: `PayMe-VerifyAuthChallenge`
   - ⚠️ **IMPORTANT**: Use this exact name!
   - Runtime: **Node.js 18.x**
   - Click **Create function**

**2. Add the code:**

```javascript
exports.handler = async (event) => {
  console.log('VerifyAuthChallenge - Checking code');
  
  const expectedCode = event.request.privateChallengeParameters.code;
  const providedCode = event.request.challengeAnswer;
  
  // Check if they match
  event.response.answerCorrect = (expectedCode === providedCode);
  
  console.log('Code check:', {
    expected: expectedCode,
    provided: providedCode,
    correct: event.response.answerCorrect
  });
  
  return event;
};
```

**3. Click Deploy**

**4. Set timeout:**
   - Configuration → General configuration → Edit
   - Timeout: **30** seconds
   - Save

**✅ All 3 Lambdas Done! You're crushing it! 🎉**

---

## 🎯 Step 3: Connect Everything Together (5 minutes)

Now we need to tell Cognito to use those 3 functions we just made.

**1. Go back to Cognito**
   - Open: https://console.aws.amazon.com/cognito/
   - Click on **PayMe-Users-Passwordless** (your user pool)

**2. Find Lambda triggers**
   - Click **User pool properties** tab at the top
   - Scroll down until you see **Lambda triggers**
   - Click **Add Lambda trigger**

**3. Connect the functions:**
   - Under **Authentication** section, you'll see 3 dropdowns:
   
   - **Define auth challenge**: 
     * Click the dropdown
     * Select **PayMe-DefineAuthChallenge**
   
   - **Create auth challenge**:
     * Click the dropdown
     * Select **PayMe-CreateAuthChallenge**
   
   - **Verify auth challenge response**:
     * Click the dropdown
     * Select **PayMe-VerifyAuthChallenge**

**4. Save it:**
   - Click **Add Lambda trigger** (bottom of the page)
   - You should see all 3 functions listed now

**✅ Step 3 Done! Everything is connected!**

---

## 🎯 Step 4: Set Up Email Sending (5-10 minutes)

For the codes to actually send, we need to verify an email address.

**1. Go to Amazon SES**
   - Open: https://console.aws.amazon.com/ses/
   - Make sure you're in **us-east-1** (same region!)

**2. Verify your email:**
   - Click **Verified identities** on the left
   - Click **Create identity** (orange button)
   - Identity type: Select **Email address**
   - Email address: Type your email (like: `noreply@yourdomain.com` or your personal email for testing)
   - Click **Create identity**

**3. Check your email:**
   - You'll get an email from AWS
   - Click the verification link in the email
   - Go back to AWS console
   - Refresh the page - it should say "Verified" now

**4. Update the Lambda function:**
   - Go back to Lambda console
   - Open **PayMe-CreateAuthChallenge**
   - Find this line in the code:
     ```javascript
     Source: 'noreply@payme.com', // ⚠️ CHANGE THIS to your email later
     ```
   - Change it to your verified email:
     ```javascript
     Source: 'your-verified-email@example.com',
     ```
   - Click **Deploy**

**✅ Step 4 Done! Emails will now send!**

**Note**: Right now, emails can only go to verified addresses (AWS sandbox mode). For production, you'll need to request production access in SES, but that's for later!

---

## 🎯 Step 5: Test It! (10 minutes)

Let's make sure everything works before we connect the frontend.

**1. Create a test user:**
   - Go to Cognito console
   - Click on **PayMe-Users-Passwordless**
   - Click **Users** tab
   - Click **Create user**
   - Email: Use your verified email from Step 4
   - ✅ Check **Mark email address as verified**
   - Click **Create user**

**2. Check if Lambdas are working:**
   - Go to Lambda console
   - Click on **PayMe-DefineAuthChallenge**
   - Click **Monitor** tab
   - Click **View CloudWatch logs**
   - You should see logs (if not, that's okay - they'll appear when someone logs in)

**✅ Step 5 Done! Everything is set up!**

---

## 🎉 You Did It! Now Get Your Credentials

You should have written these down earlier, but let's double-check:

**1. User Pool ID:**
   - Go to Cognito → PayMe-Users-Passwordless
   - Look at the top - you'll see **User pool ID**
   - Copy it (looks like: `us-east-1_XXXXXXXXX`)

**2. Client ID:**
   - Same page, click **App integration** tab
   - Scroll to **App clients and analytics**
   - Click **PayMe-Web-Client**
   - Copy the **Client ID** (long string)

**3. Region:**
   - Should be `us-east-1`

**Write them all here:**
```
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_AWS_REGION=us-east-1
```

---

## ✅ Final Checklist

Before you tell me you're done, make sure:

- [ ] User pool created: **PayMe-Users-Passwordless**
- [ ] App client created: **PayMe-Web-Client**
- [ ] Lambda 1 created: **PayMe-DefineAuthChallenge**
- [ ] Lambda 2 created: **PayMe-CreateAuthChallenge**
- [ ] Lambda 3 created: **PayMe-VerifyAuthChallenge**
- [ ] All 3 Lambdas connected to Cognito (Lambda triggers)
- [ ] Email verified in SES
- [ ] Email address updated in CreateAuthChallenge Lambda
- [ ] Test user created
- [ ] All 3 credentials copied

---

## 🎊 You're Ready!

Come back to the chat and say:

> "Cognito is ready! Here are my credentials:"
> ```
> VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
> VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
> VITE_AWS_REGION=us-east-1
> ```

Then I'll build the frontend to use it! 🚀

---

## 🆘 Need Help?

**Email not sending?**
- Make sure you verified your email in SES
- Make sure you updated the email in the Lambda code
- Check that Lambda has SES permissions

**Lambda not working?**
- Make sure all 3 are in **us-east-1** region
- Make sure they're connected in Cognito (Lambda triggers)
- Check CloudWatch logs for errors

**Can't find something?**
- Make sure you're in the right region (us-east-1)
- Use the search bar at the top of AWS console
- Type the name of what you're looking for

**Still stuck?**
Come back to the chat and tell me:
- What step you're on
- What error you're seeing
- I'll help you fix it!

---

## 💪 Great Job!

Setting up AWS stuff for the first time can be confusing, but you did it! This is the hardest part - everything else will be easier. 

Now go grab that coffee you deserve! ☕
