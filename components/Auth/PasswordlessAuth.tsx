import React, { useState } from 'react';
import { signIn, confirmSignIn, signUp, fetchUserAttributes, updateUserAttributes } from 'aws-amplify/auth';
import { Loader2, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { Sanitize } from '../../utils/sanitize';
import { logger } from '../../utils/logger';

type AuthStep = 'email' | 'code' | 'username';

interface PasswordlessAuthProps {
  onSuccess: () => void;
}

const PasswordlessAuth: React.FC<PasswordlessAuthProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cognitoUser, setCognitoUser] = useState<any>(null);

  // Step 1: Email Entry
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sanitize email
      const sanitizedEmail = Sanitize.email(email);

      logger.log('Initiating passwordless sign-in', { email: sanitizedEmail });

      // Try to sign in (this will trigger the custom auth flow)
      const result = await signIn({
        username: sanitizedEmail,
        options: {
          authFlowType: 'CUSTOM_WITHOUT_SRP'
        }
      });

      logger.log('Sign-in initiated', { nextStep: result.nextStep });

      // Store user for later
      setCognitoUser(result);
      
      // Move to code entry
      setStep('code');
    } catch (err: any) {
      logger.error('Email submission error', err);
      
      if (err.name === 'UserNotFoundException') {
        // User doesn't exist, create them
        try {
          await signUp({
            username: email,
            password: Math.random().toString(36), // Random password (won't be used)
            options: {
              userAttributes: {
                email: email
              },
              autoSignIn: {
                enabled: true
              }
            }
          });
          
          // Now try signing in again
          const result = await signIn({
            username: email,
            options: {
              authFlowType: 'CUSTOM_WITHOUT_SRP'
            }
          });
          
          setCognitoUser(result);
          setStep('code');
        } catch (signUpErr: any) {
          logger.error('Sign-up error', signUpErr);
          setError('Failed to create account. Please try again.');
        }
      } else {
        setError(err.message || 'Failed to send code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Code Verification
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sanitize code
      const sanitizedCode = Sanitize.code(code);

      logger.log('Verifying code');

      // Confirm the sign-in with the code
      const result = await confirmSignIn({
        challengeResponse: sanitizedCode
      });

      logger.log('Code verified', { isSignedIn: result.isSignedIn });

      if (result.isSignedIn) {
        // Check if user has username set
        const attributes = await fetchUserAttributes();
        const hasUsername = attributes['custom:username_set'] === 'true';

        if (!hasUsername) {
          // First-time user - need to set username
          setStep('username');
        } else {
          // Existing user - done!
          logger.log('User authenticated successfully');
          onSuccess();
        }
      }
    } catch (err: any) {
      logger.error('Code verification error', err);
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Username Selection (First-time users only)
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sanitize username
      const sanitizedUsername = Sanitize.username(username);
      if (!sanitizedUsername || sanitizedUsername.length < 3) {
        setError('Username must be 3-30 characters, alphanumeric only');
        setLoading(false);
        return;
      }

      logger.log('Setting username', { username: sanitizedUsername });

      // Update user attributes
      await updateUserAttributes({
        userAttributes: {
          'custom:username': sanitizedUsername,
          'custom:username_set': 'true'
        }
      });

      logger.log('Username set successfully');
      onSuccess();
    } catch (err: any) {
      logger.error('Username update error', err);
      setError(err.message || 'Failed to set username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render Email Entry Screen
  if (step === 'email') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF5722] via-[#673AB7] to-[#FF5722] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-tr from-[#FF5722] to-[#673AB7] rounded-full mx-auto mb-4 flex items-center justify-center">
                <Mail size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to PayMe</h1>
              <p className="text-gray-600 dark:text-white/70">Enter your email to get started</p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-4 rounded-[16px] bg-gray-100 dark:bg-white/10 border-2 border-transparent focus:border-[#FF5722] focus:bg-white dark:focus:bg-white/20 outline-none text-gray-900 dark:text-white transition-all"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-4 rounded-[16px] bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-[24px] bg-[#FF5722] text-white font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={24} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-white/50 mt-6">
              We'll send you a 6-digit code to verify your email
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render Code Entry Screen
  if (step === 'code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF5722] via-[#673AB7] to-[#FF5722] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-tr from-[#FF5722] to-[#673AB7] rounded-full mx-auto mb-4 flex items-center justify-center">
                <Lock size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h1>
              <p className="text-gray-600 dark:text-white/70">We sent a code to</p>
              <p className="text-[#FF5722] font-semibold">{email}</p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 rounded-[16px] bg-gray-100 dark:bg-white/10 border-2 border-transparent focus:border-[#FF5722] focus:bg-white dark:focus:bg-white/20 outline-none text-gray-900 dark:text-white text-center text-2xl font-bold tracking-[0.5em] transition-all"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-4 rounded-[16px] bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-4 rounded-[24px] bg-[#FF5722] text-white font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Code
                    <ArrowRight size={24} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full py-3 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
                disabled={loading}
              >
                Use a different email
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-white/50 mt-6">
              Code expires in 3 minutes
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render Username Selection Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF5722] via-[#673AB7] to-[#FF5722] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#FF5722] to-[#673AB7] rounded-full mx-auto mb-4 flex items-center justify-center">
              <UserIcon size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Choose your username</h1>
            <p className="text-gray-600 dark:text-white/70">This will be your @username on PayMe</p>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">⚠️ You can't change this later!</p>
          </div>

          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  placeholder="username"
                  minLength={3}
                  maxLength={30}
                  className="w-full pl-10 pr-4 py-4 rounded-[16px] bg-gray-100 dark:bg-white/10 border-2 border-transparent focus:border-[#FF5722] focus:bg-white dark:focus:bg-white/20 outline-none text-gray-900 dark:text-white transition-all"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-white/50 mt-2 ml-2">
                3-30 characters, letters and numbers only
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-[16px] bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || username.length < 3}
              className="w-full py-4 rounded-[24px] bg-[#FF5722] text-white font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={24} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordlessAuth;
