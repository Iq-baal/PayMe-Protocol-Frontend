import React, { useState } from 'react';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
import { Loader2, Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Sanitize } from '../../utils/sanitize';
import { logger } from '../../utils/logger';

type AuthStep = 'signin' | 'signup' | 'confirm';

interface EmailPasswordAuthProps {
  onSuccess: () => void;
}

const EmailPasswordAuth: React.FC<EmailPasswordAuthProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<AuthStep>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const sanitizedEmail = Sanitize.email(email);
      
      logger.log('Signing in user', { email: sanitizedEmail });

      await signIn({
        username: sanitizedEmail,
        password: password,
      });

      logger.log('Sign in successful');
      onSuccess();
    } catch (err: any) {
      logger.error('Sign in error', err);
      
      if (err.name === 'UserNotConfirmedException') {
        setError('Please confirm your email first. Check your inbox for the confirmation code.');
        setStep('confirm');
      } else if (err.name === 'NotAuthorizedException') {
        setError('Incorrect email or password');
      } else if (err.name === 'UserNotFoundException') {
        setError('No account found with this email. Please sign up first.');
      } else {
        setError(err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const sanitizedEmail = Sanitize.email(email);
      const sanitizedUsername = Sanitize.username(username);

      if (!sanitizedUsername || sanitizedUsername.length < 3) {
        setError('Username must be 3-30 characters, alphanumeric only');
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }

      logger.log('Creating new account', { email: sanitizedEmail, username: sanitizedUsername });

      await signUp({
        username: sanitizedEmail,
        password: password,
        options: {
          userAttributes: {
            email: sanitizedEmail,
            'custom:username': sanitizedUsername,
          },
        },
      });

      logger.log('Sign up successful, awaiting confirmation');
      setStep('confirm');
      setError('');
    } catch (err: any) {
      logger.error('Sign up error', err);
      
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (err.name === 'InvalidPasswordException') {
        setError('Password must be at least 8 characters');
      } else {
        setError(err.message || 'Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Confirm Sign Up
  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const sanitizedEmail = Sanitize.email(email);
      const sanitizedCode = Sanitize.code(confirmationCode);

      logger.log('Confirming sign up');

      await confirmSignUp({
        username: sanitizedEmail,
        confirmationCode: sanitizedCode,
      });

      logger.log('Confirmation successful');
      
      // Now sign in automatically
      await signIn({
        username: sanitizedEmail,
        password: password,
      });

      onSuccess();
    } catch (err: any) {
      logger.error('Confirmation error', err);
      
      if (err.name === 'CodeMismatchException') {
        setError('Invalid confirmation code. Please check and try again.');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Confirmation code expired. Please request a new one.');
      } else {
        setError(err.message || 'Confirmation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render Sign In Screen
  if (step === 'signin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF5722] via-[#673AB7] to-[#FF5722] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-tr from-[#FF5722] to-[#673AB7] rounded-full mx-auto mb-4 flex items-center justify-center">
                <Mail size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
              <p className="text-gray-600 dark:text-white/70">Sign in to your PayMe account</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-4 rounded-[16px] bg-gray-100 dark:bg-white/10 border-2 border-transparent focus:border-[#FF5722] focus:bg-white dark:focus:bg-white/20 outline-none text-gray-900 dark:text-white transition-all"
                  required
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-4 rounded-[16px] bg-gray-100 dark:bg-white/10 border-2 border-transparent focus:border-[#FF5722] focus:bg-white dark:focus:bg-white/20 outline-none text-gray-900 dark:text-white transition-all pr-12"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/70"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
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
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={24} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('signup');
                  setError('');
                }}
                className="w-full py-3 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
                disabled={loading}
              >
                Don't have an account? <span className="text-[#FF5722] font-semibold">Sign Up</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render Sign Up Screen
  if (step === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF5722] via-[#673AB7] to-[#FF5722] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-tr from-[#FF5722] to-[#673AB7] rounded-full mx-auto mb-4 flex items-center justify-center">
                <UserIcon size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h1>
              <p className="text-gray-600 dark:text-white/70">Join PayMe today</p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-4 rounded-[16px] bg-gray-100 dark:bg-white/10 border-2 border-transparent focus:border-[#FF5722] focus:bg-white dark:focus:bg-white/20 outline-none text-gray-900 dark:text-white transition-all"
                  required
                  disabled={loading}
                />
              </div>

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
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 8 characters)"
                  minLength={8}
                  className="w-full px-4 py-4 rounded-[16px] bg-gray-100 dark:bg-white/10 border-2 border-transparent focus:border-[#FF5722] focus:bg-white dark:focus:bg-white/20 outline-none text-gray-900 dark:text-white transition-all pr-12"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/70"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight size={24} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('signin');
                  setError('');
                }}
                className="w-full py-3 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
                disabled={loading}
              >
                Already have an account? <span className="text-[#FF5722] font-semibold">Sign In</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render Confirmation Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF5722] via-[#673AB7] to-[#FF5722] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#FF5722] to-[#673AB7] rounded-full mx-auto mb-4 flex items-center justify-center">
              <Lock size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h1>
            <p className="text-gray-600 dark:text-white/70">We sent a confirmation code to</p>
            <p className="text-[#FF5722] font-semibold">{email}</p>
          </div>

          <form onSubmit={handleConfirmSignUp} className="space-y-4">
            <div>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.replace(/[^0-9]/g, ''))}
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
              disabled={loading || confirmationCode.length !== 6}
              className="w-full py-4 rounded-[24px] bg-[#FF5722] text-white font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  Confirm
                  <ArrowRight size={24} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('signup');
                setError('');
              }}
              className="w-full py-3 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
              disabled={loading}
            >
              Back to sign up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailPasswordAuth;
