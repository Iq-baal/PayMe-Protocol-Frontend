/**
 * Passwordless Auth Screen
 * Flow: Email → OTP Code → Success
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { logger } from '../../utils/logger';

const AuthScreen: React.FC = () => {
  const { sendOTPCode, verifyOTP } = useAuth();
  
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await sendOTPCode(email);
      
      if (result.error) {
        setError(result.error);
      } else {
        setStep('code');
        logger.log('OTP code sent to', email);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyOTP(email, code);
      
      if (result.error) {
        setError(result.error);
      } else {
        setStep('success');
        logger.log('Code verified successfully');
        // AuthContext will handle navigation to onboarding
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0f0b1e] via-[#1a1333] to-[#0f0b1e] text-white px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] bg-[#673AB7] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[60%] bg-[#FF5722] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse-slow"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF5722] to-[#673AB7] rounded-3xl flex items-center justify-center mb-4 shadow-2xl">
            <span className="text-4xl font-bold">₱</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            PayMe
          </h1>
          <p className="text-white/50 mt-2">Send money with just a username</p>
        </div>

        {/* Email Step */}
        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-[#FF5722] transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-4 bg-gradient-to-r from-[#FF5722] to-[#FF7043] rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#FF5722]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Sending Code...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <p className="text-center text-white/40 text-sm">
              We'll send you a 6-digit code to verify your email
            </p>
          </form>
        )}

        {/* Code Verification Step */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Verification Code
              </label>
              <p className="text-white/50 text-sm mb-4">
                Enter the 6-digit code sent to {email}
              </p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-2xl tracking-widest placeholder-white/30 focus:outline-none focus:border-[#FF5722] transition-all"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-4 bg-gradient-to-r from-[#FF5722] to-[#FF7043] rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#FF5722]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Code
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full py-3 text-white/50 hover:text-white transition-colors text-sm"
            >
              Use different email
            </button>
          </form>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="text-green-400" size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Verified!</h2>
              <p className="text-white/50">Setting up your account...</p>
            </div>
            <Loader2 className="animate-spin text-[#FF5722] mx-auto" size={32} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;
