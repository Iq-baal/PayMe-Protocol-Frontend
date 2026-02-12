import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, CheckCircle, AtSign, AlertCircle, Gift, Eye, EyeOff, ArrowRight, Lock } from 'lucide-react';
import LoadingWithFacts from '../LoadingWithFacts';

const Onboarding: React.FC = () => {
    const { claimUsername } = useAuth();
    const [step, setStep] = useState<'username' | 'pin' | 'loading'>('username'); // Three-step flow now
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1: Validate username and move to PIN screen
    const handleUsernameNext = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Sanitize: allow lowercase, numbers, and underscores.
        const cleanUsername = username.replace(/[^a-z0-9_]/g, '').toLowerCase();

        if (cleanUsername.length < 3) {
            setError("Username must be at least 3 characters.");
            return;
        }

        setUsername(cleanUsername);
        setStep('pin'); // Move to PIN screen
    };

    // Step 2: Submit PIN and claim username
    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (pin.length !== 4) {
            setError("PIN must be exactly 4 digits.");
            setLoading(false);
            return;
        }

        // Claiming the username and setting PIN
        const result = await claimUsername(username, pin);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            // Success! Show loading screen with facts
            // This gives blockchain time to confirm (15-20 seconds)
            setLoading(false);
            setStep('loading');
        }
    };

    // Handle loading completion - redirect to dashboard
    const handleLoadingComplete = () => {
        // User will be redirected to main app by AuthContext
        // The 20-second wait gives blockchain time to confirm
        window.location.reload(); // Force refresh to load dashboard with confirmed balance
    };

    // Loading screen with PayMe facts (15-20 seconds)
    if (step === 'loading') {
        return <LoadingWithFacts duration={20000} onComplete={handleLoadingComplete} />;
    }

    // Step 1: Username claim screen
    if (step === 'username') {
        return (
            <div className="flex flex-col h-full p-6 pt-20 animate-fade-in bg-[#F2F2F7] dark:bg-[#0f0b1e]">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 ring-4 ring-green-500/5">
                        <AtSign size={32} className="text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Claim Your PayMe ID</h1>
                    <p className="text-gray-500 dark:text-white/50 text-center max-w-[280px] mb-4">
                        Choose a unique username. This is how people will send you money globally.
                    </p>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#FF5722]/10 rounded-full border border-[#FF5722]/20">
                        <Gift size={14} className="text-[#FF5722]" />
                        <span className="text-xs font-bold text-[#FF5722]">Unlock 10,000 USDC Bonus</span>
                    </div>
                </div>

                <form onSubmit={handleUsernameNext} className="flex flex-col gap-4">
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 font-bold text-lg">@</div>
                        <input 
                            type="text" 
                            placeholder="username123"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase())}
                            className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 pl-10 pr-4 text-gray-900 dark:text-white outline-none focus:border-green-500 transition-colors font-bold text-lg lowercase"
                            required
                            autoFocus
                        />
                    </div>
                    
                    <div className="text-center text-xs text-gray-400 dark:text-white/30">
                        Use lowercase letters, numbers, and underscores only
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2 justify-center text-center">
                            <AlertCircle size={16} className="flex-shrink-0" /> {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={!username || username.length < 3}
                        className="mt-4 w-full py-4 rounded-[24px] bg-gray-900 dark:bg-white text-white dark:text-[#0f0b1e] font-bold text-lg shadow-xl shadow-black/10 dark:shadow-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        );
    }

    // Step 2: PIN setup screen
    return (
        <div className="flex flex-col h-full p-6 pt-20 animate-fade-in bg-[#F2F2F7] dark:bg-[#0f0b1e]">
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-6 ring-4 ring-purple-500/5">
                    <Lock size={32} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Secure Your Account</h1>
                <p className="text-gray-500 dark:text-white/50 text-center max-w-[280px] mb-4">
                    Create a 4-digit PIN to protect your transactions. You'll need this every time you send money.
                </p>
                <div className="px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">@{username}</span>
                </div>
            </div>

            <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
                <div className="relative">
                    <input 
                        type={showPin ? "text" : "password"}
                        inputMode="numeric" // This triggers numeric keyboard on mobile! 🎉
                        pattern="[0-9]*" // iOS needs this too
                        placeholder="Enter 4-digit PIN"
                        value={pin}
                        onChange={(e) => {
                            // Only allow numbers, max 4 digits
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setPin(value);
                        }}
                        maxLength={4}
                        className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 pr-12 text-gray-900 dark:text-white outline-none focus:border-purple-500 transition-colors text-center text-2xl font-bold tracking-[0.5em]"
                        required
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
                    >
                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                
                <div className="text-center text-xs text-gray-400 dark:text-white/30">
                    🔒 Your PIN is encrypted and stored securely. Never share it with anyone!
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2 justify-center text-center">
                        <AlertCircle size={16} className="flex-shrink-0" /> {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={() => {
                            setStep('username');
                            setPin('');
                            setError(null);
                        }}
                        className="px-6 py-4 rounded-[24px] bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-lg border border-gray-200 dark:border-white/10 active:scale-[0.98] transition-all"
                    >
                        Back
                    </button>
                    <button 
                        type="submit"
                        disabled={loading || pin.length !== 4}
                        className="flex-1 py-4 rounded-[24px] bg-gray-900 dark:bg-white text-white dark:text-[#0f0b1e] font-bold text-lg shadow-xl shadow-black/10 dark:shadow-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Claim ID & Bonus <CheckCircle size={20} /></>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Onboarding;