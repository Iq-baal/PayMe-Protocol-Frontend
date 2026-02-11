import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, ArrowRight, CheckSquare, Square, Eye, EyeOff } from 'lucide-react';
import AppLogo from '../AppLogo';

interface SignUpProps {
    onToggleMode: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onToggleMode }) => {
    const { signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!agreedToTerms) {
            setError("You must agree to the Terms and Conditions to proceed.");
            return;
        }

        setLoading(true);
        setError(null);

        const { error } = await signUp(email, password);

        if (error) {
            setError(error);
            setLoading(false);
        }
        // If successful, user will be redirected to onboarding to claim username
    };

    return (
        <div className="flex flex-col h-full p-6 pt-4 animate-fade-in">
             <div className="flex flex-col items-center mb-6 mt-6">
                <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
                    <AppLogo className="w-24 h-24" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Create Account</h1>
                <p className="text-gray-500 dark:text-white/50 text-center leading-relaxed px-4 text-sm">
                    Sign up to claim your address and <span className="text-[#FF5722] font-semibold">10,000 USDC</span>.
                </p>
             </div>

             <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                 <div>
                    <input 
                        type="email" 
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 text-gray-900 dark:text-white outline-none focus:border-[#FF5722] transition-colors shadow-sm dark:shadow-none"
                        required
                    />
                 </div>
                 <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 pr-12 text-gray-900 dark:text-white outline-none focus:border-[#FF5722] transition-colors shadow-sm dark:shadow-none"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                 </div>

                 {/* Terms and Conditions Checkbox */}
                 <div 
                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                    className="flex items-start gap-3 px-2 cursor-pointer group"
                 >
                    <div className={`mt-0.5 transition-colors ${agreedToTerms ? 'text-[#FF5722]' : 'text-gray-400 dark:text-white/30'}`}>
                        {agreedToTerms ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-white/60 leading-snug">
                        I agree to the <span className="underline decoration-[#FF5722] decoration-1 underline-offset-2">Terms and Conditions</span> and acknowledge that PayMe Protocol is a non-custodial wallet interface.
                    </p>
                 </div>

                 {error && (
                     <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm text-center animate-fade-in">
                         {error}
                     </div>
                 )}

                 <button 
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full py-4 rounded-[24px] bg-[#FF5722] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                 >
                     {loading ? <Loader2 className="animate-spin" /> : <>Start Paying <ArrowRight size={20} /></>}
                 </button>
             </form>

             <div className="mt-6 text-center space-y-2 opacity-60">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-white/50">
                    Powered by PayMe Protocol
                </p>
                <p className="text-[10px] text-gray-400 dark:text-white/30 font-mono">
                    V. 1.2.0 (Custom Auth)
                </p>
            </div>
        </div>
    );
};

export default SignUp;