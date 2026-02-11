import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import AppLogo from '../AppLogo';

interface LoginProps {
    onToggleMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onToggleMode }) => {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-6 pt-4 animate-fade-in">
             <div className="flex flex-col items-center mb-10 mt-6">
                <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
                    <AppLogo className="w-24 h-24" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
                <p className="text-gray-500 dark:text-white/50 text-center">Sign in to manage your PayMe wallet</p>
             </div>

             <form onSubmit={handleLogin} className="flex flex-col gap-4">
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

                 {error && (
                     <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
                         {error}
                     </div>
                 )}

                 <button 
                    type="submit"
                    disabled={loading}
                    className="mt-4 w-full py-4 rounded-[24px] bg-[#FF5722] text-white font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                 >
                     {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={20} /></>}
                 </button>
             </form>
             
             {/* Feature for v2. If you forgot it, good luck. */}
             <div className="mt-6 text-center">
                 <button className="text-sm text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors">
                     Forgot Password?
                 </button>
             </div>
        </div>
    );
};

export default Login;