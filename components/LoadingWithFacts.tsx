import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

// PayMe facts - interesting, true, and engaging!
const PAYME_FACTS = [
    "💰 PayMe will refund you if you lose money due to our error. Your trust matters!",
    "🔒 Your transactions are recorded on the blockchain and cannot be deleted once sent.",
    "✅ No one can pretend they didn't receive a payment from you. Blockchain receipts are permanent!",
    "🌍 Send money to anyone, anywhere in the world using just their @username.",
    "⚡ Your wallet is created automatically when you claim your username. No complicated setup!",
    "🎁 New users get 10,000 USDC bonus to start sending money immediately.",
    "🔐 Your 4-digit PIN is encrypted and never stored in plain text. Security first!",
    "📱 PayMe works on any device - phone, tablet, or computer. Same account everywhere!",
    "💸 Transaction fees are paid by PayMe, not you. Send money for free!",
    "🚀 Powered by Solana blockchain - one of the fastest blockchains in the world.",
    "👥 Your @username is unique. Once claimed, it's yours forever!",
    "💳 No bank account needed. Just your email and a username to get started.",
    "🔄 Real-time balance updates every 5 seconds. Always know your balance!",
    "📊 All transactions are tracked and visible in your history. Full transparency!",
    "🛡️ Your private keys are encrypted with military-grade security (KMS).",
    "⏱️ Blockchain confirmations take 10-30 seconds. Worth the wait for security!",
    "🌟 PayMe is built for the future of money - fast, secure, and global.",
    "💬 Send money as easily as sending a text message. Just @username and amount!",
    "🎯 No hidden fees, no surprises. What you send is what they receive.",
    "🔓 Open source and transparent. Trust through code, not promises."
];

interface LoadingWithFactsProps {
    duration?: number; // How long to show loading (in ms)
    onComplete?: () => void; // Callback when loading is done
}

const LoadingWithFacts: React.FC<LoadingWithFactsProps> = ({ 
    duration = 20000, // Default 20 seconds
    onComplete 
}) => {
    const [currentFact, setCurrentFact] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Rotate facts every 4 seconds
        const factInterval = setInterval(() => {
            setCurrentFact(prev => (prev + 1) % PAYME_FACTS.length);
        }, 4000);

        // Update progress bar
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + (100 / (duration / 100));
                if (newProgress >= 100) {
                    clearInterval(progressInterval);
                    if (onComplete) onComplete();
                    return 100;
                }
                return newProgress;
            });
        }, 100);

        // Cleanup
        return () => {
            clearInterval(factInterval);
            clearInterval(progressInterval);
        };
    }, [duration, onComplete]);

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 bg-[#F2F2F7] dark:bg-[#0f0b1e]">
            <div className="flex flex-col items-center gap-8 max-w-md w-full">
                {/* Animated logo/icon */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#FF5722]/20 animate-ping" />
                    <div className="absolute inset-0 rounded-full bg-[#FF5722]/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#FF5722] to-[#673AB7] flex items-center justify-center shadow-2xl shadow-[#FF5722]/50">
                        <Sparkles size={40} className="text-white animate-pulse" />
                    </div>
                </div>

                {/* Loading message */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Setting up your wallet...
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-white/50">
                        This takes 15-20 seconds for blockchain confirmation
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-[#FF5722] to-[#673AB7] transition-all duration-300 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Fun fact card */}
                <div className="w-full bg-white dark:bg-white/5 rounded-2xl p-6 border border-[#FF5722]/20 shadow-lg min-h-[140px] flex items-center">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-[#FF5722]" />
                            <span className="text-xs font-bold text-[#FF5722] uppercase tracking-wide">
                                Did You Know?
                            </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed animate-fade-in">
                            {PAYME_FACTS[currentFact]}
                        </p>
                    </div>
                </div>

                {/* Loading spinner */}
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-white/50">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Confirming on blockchain...</span>
                </div>

                {/* Progress percentage */}
                <div className="text-xs text-gray-400 dark:text-white/30 font-mono">
                    {Math.round(progress)}% complete
                </div>
            </div>
        </div>
    );
};

export default LoadingWithFacts;
