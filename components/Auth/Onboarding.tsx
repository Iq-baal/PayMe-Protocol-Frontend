/**
 * Onboarding Flow
 * Step 1: Claim Username (creates wallet)
 * Step 2: Set Transaction PIN (encrypts wallet)
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Lock, ArrowRight, Loader2, CheckCircle, Fingerprint } from 'lucide-react';
import { logger } from '../../utils/logger';

const Onboarding: React.FC = () => {
  const { claimUsername, setTransactionPIN } = useAuth();
  
  const [step, setStep] = useState<'username' | 'pin' | 'biometrics'>('username');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClaimUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await claimUsername(username);
      
      if (result.error) {
        setError(result.error);
      } else {
        setStep('pin');
        logger.log('Username claimed:', username);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to claim username');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPIN = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be 4 digits');
      return;
    }

    setLoading(true);

    try {
      const result = await setTransactionPIN(pin);
      
      if (result.error) {
        setError(result.error);
      } else {
        setStep('biometrics');
        logger.log('Transaction PIN set successfully');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableBiometrics = async () => {
    try {
      // Enable Face ID/Touch ID for app unlock
      localStorage.setItem('payme_face_id_enabled', 'true');
      logger.log('Biometrics enabled');
      // Onboarding complete - AuthContext will navigate to dashboard
      window.location.reload();
    } catch (err) {
      logger.error('Failed to enable biometrics', err);
    }
  };

  const handleSkipBiometrics = () => {
    localStorage.setItem('payme_face_id_enabled', 'false');
    window.location.reload();
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0f0b1e] via-[#1a1333] to-[#0f0b1e] text-white px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] bg-[#673AB7] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[60%] bg-[#FF5722] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse-slow"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-2 h-2 rounded-full ${step === 'username' ? 'bg-[#FF5722]' : 'bg-white/20'}`}></div>
          <div className={`w-2 h-2 rounded-full ${step === 'pin' ? 'bg-[#FF5722]' : 'bg-white/20'}`}></div>
          <div className={`w-2 h-2 rounded-full ${step === 'biometrics' ? 'bg-[#FF5722]' : 'bg-white/20'}`}></div>
        </div>

        {/* Username Step */}
        {step === 'username' && (
          <form onSubmit={handleClaimUsername} className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF5722] to-[#673AB7] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Choose Your Username</h2>
              <p className="text-white/50">This is how people will send you money</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="yourname"
                  className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-[#FF5722] transition-all"
                  maxLength={20}
                  required
                  autoFocus
                />
              </div>
              <p className="text-white/40 text-xs mt-2">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || username.length < 3}
              className="w-full py-4 bg-gradient-to-r from-[#FF5722] to-[#FF7043] rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#FF5722]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating Wallet...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Transaction PIN Step */}
        {step === 'pin' && (
          <form onSubmit={handleSetPIN} className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF5722] to-[#673AB7] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Set Transaction PIN</h2>
              <p className="text-white/50">You'll need this to send money</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Create 4-Digit PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-2xl tracking-widest placeholder-white/30 focus:outline-none focus:border-[#FF5722] transition-all"
                inputMode="numeric"
                maxLength={4}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Confirm PIN
              </label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-2xl tracking-widest placeholder-white/30 focus:outline-none focus:border-[#FF5722] transition-all"
                inputMode="numeric"
                maxLength={4}
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
              className="w-full py-4 bg-gradient-to-r from-[#FF5722] to-[#FF7043] rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#FF5722]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Securing Wallet...
                </>
              ) : (
                <>
                  Set PIN
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <p className="text-center text-white/40 text-xs">
              Your PIN encrypts your wallet. Keep it safe and don't share it.
            </p>
          </form>
        )}

        {/* Biometrics Step */}
        {step === 'biometrics' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF5722] to-[#673AB7] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Fingerprint size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Enable Face ID</h2>
              <p className="text-white/50">Unlock PayMe quickly and securely</p>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-medium">Fast & Secure</p>
                  <p className="text-white/50 text-sm">Unlock with your face or fingerprint</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-medium">Transaction PIN Separate</p>
                  <p className="text-white/50 text-sm">You'll still need your PIN to send money</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleEnableBiometrics}
              className="w-full py-4 bg-gradient-to-r from-[#FF5722] to-[#FF7043] rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#FF5722]/20 transition-all"
            >
              Enable Face ID
              <Fingerprint size={20} />
            </button>

            <button
              onClick={handleSkipBiometrics}
              className="w-full py-3 text-white/50 hover:text-white transition-colors text-sm"
            >
              Skip for now
            </button>
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

export default Onboarding;
