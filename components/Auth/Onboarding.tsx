import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, CheckCircle, AtSign, AlertCircle, Gift, Eye, EyeOff } from 'lucide-react';

const Onboarding: React.FC = () => {
    const { claimUsername } = useAuth();
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Sanitize: allow lowercase, numbers, and underscores.
        const cleanUsername = username.replace(/[^a-z0-9_]/g, '').toLowerCase();

        if (cleanUsername.length < 3) {
            setError("Username must be at least 3 characters.");
            setLoading(false);
            return;
        }

        if (pin.length !== 4) {
            setError("PIN must be exactly 4 digits.");
            setLoading(false);
            return;
        }

        // Claiming the username and setting PIN
        const result = await claimUsername(cleanUsername, pin);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        }
        // Success - user will be redirected to main app
    };

    return (
        <div className="flex flex-col h-full p-6 pt-20 animate-fade-in bg-[#F2F2F7] dark:bg-[#0f0b1e]">
             <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 ring-4 ring-green-500/5">
                    <AtSign size={32} className="text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Claim PayMe ID</h1>
                <p className="text-gray-500 dark:text-white/50 text-center max-w-[250px] mb-4">
                    Your username acts as your wallet address to receive money globally.
                </p>
                <div className="flex items-center gap-2 px-3 py-1 bg-[#FF5722]/10 rounded-full border border-[#FF5722]/20">
                    <Gift size={14} className="text-[#FF5722]" />
                    <span className="text-xs font-bold text-[#FF5722]">Unlock 10,000 USDC</span>
                </div>
             </div>

             <form onSubmit={handleClaim} className="flex flex-col gap-4">
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
                 
                 <div className="relative">
                    <input 
                        type={showPin ? "text" : "password"}
                        placeholder="4-Digit Transaction PIN"
                        value={pin}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setPin(value);
                        }}
                        maxLength={4}
                        className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 pr-12 text-gray-900 dark:text-white outline-none focus:border-green-500 transition-colors"
                        required
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
                    Your PIN secures all transactions. Keep it safe!
                 </div>

                 {error && (
                     <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2 justify-center text-center">
                         <AlertCircle size={16} className="flex-shrink-0" /> {error}
                     </div>
                 )}

                 <button 
                    type="submit"
                    disabled={loading || !username}
                    className="mt-4 w-full py-4 rounded-[24px] bg-gray-900 dark:bg-white text-white dark:text-[#0f0b1e] font-bold text-lg shadow-xl shadow-black/10 dark:shadow-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                 >
                     {loading ? <Loader2 className="animate-spin" /> : <>Claim ID & Bonus <CheckCircle size={20} /></>}
                 </button>
             </form>
        </div>
    );
};

export default Onboarding;