import React, { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import AppLogo from '../AppLogo';
import { ArrowRight, Play } from 'lucide-react';

const AuthScreen: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  // Default to 'signup' when coming from the "Start Paying" landing page
  const [mode, setMode] = useState<'signup' | 'login'>('signup'); 

  if (showLanding) {
      return (
        <div className="flex flex-col h-full bg-[#0f0b1e] relative overflow-hidden font-sans selection:bg-orange-500/30">
            {/* Pretty lights to distract from the loading time. */}
            <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#673AB7] rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] bg-[#FF5722] rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none animate-pulse-slow"></div>

            <div className="relative z-10 flex flex-col h-full px-8 pt-12 pb-8 justify-between">
                
                {/* Top: Logo */}
                <div className="flex justify-start pt-4">
                    <div className="w-20 h-20 transform hover:scale-105 transition-transform duration-500">
                        <AppLogo />
                    </div>
                </div>

                {/* Middle: Typography */}
                <div className="flex flex-col gap-0 mt-auto mb-auto pt-8">
                    <h1 className="text-6xl font-black tracking-tighter text-[#FF5722] leading-[0.95] mb-2 drop-shadow-lg">
                        PayMe.
                    </h1>
                    <h1 className="text-6xl font-black tracking-tighter text-white leading-[0.95] mb-2 drop-shadow-lg">
                        Instant.
                    </h1>
                    <h1 className="text-6xl font-black tracking-tighter text-[#673AB7] leading-[0.95] mb-6 drop-shadow-lg">
                        Global.
                    </h1>

                    <p className="text-gray-400 text-lg font-medium max-w-[260px] leading-relaxed mt-2">
                        Experience the future of borderless payments.
                    </p>
                </div>

                {/* Bottom: Buttons & Footer */}
                <div className="w-full flex flex-col gap-4 animate-slide-up">
                    <button 
                        onClick={() => setShowLanding(false)}
                        className="w-full py-4 rounded-full bg-[#FF5722] text-white font-bold text-lg shadow-lg shadow-orange-500/20 hover:bg-[#e64a19] active:scale-[0.98] transition-all"
                    >
                        Start paying
                    </button>
                    
                    <button 
                        className="w-full py-4 rounded-full bg-[#1c1c1e]/50 border border-white/10 text-white font-bold text-sm hover:bg-white/5 active:scale-[0.98] transition-all tracking-widest uppercase flex items-center justify-center gap-2 backdrop-blur-sm"
                    >
                        Watch Trailer
                    </button>
                    
                    <div className="mt-6 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
                            Secure Protocol V1.2 • Welcome Bonus $10K
                        </p>
                    </div>
                </div>
            </div>
            
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.15; transform: scale(1.05); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s infinite ease-in-out;
                }
            `}</style>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] dark:bg-[#0f0b1e] relative overflow-hidden transition-colors duration-300">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] bg-[#673AB7] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[60%] bg-[#FF5722] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse-slow pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full">
        
        {/* iOS Style Slider Control */}
        <div className="w-full px-6 pt-12 pb-2 z-20">
            <div className="relative w-full h-14 bg-gray-200 dark:bg-white/5 rounded-full p-1 flex shadow-inner border border-black/5 dark:border-white/5 backdrop-blur-md">
                {/* Sliding Indicator */}
                <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#FF5722] rounded-full shadow-md transition-all duration-300 ease-spring ${mode === 'signup' ? 'left-1' : 'left-[calc(50%+4px)]'}`}
                ></div>
                
                <button 
                onClick={() => setMode('signup')}
                className={`flex-1 relative z-10 flex items-center justify-center gap-2 font-bold text-sm tracking-wide transition-colors duration-200 ${mode === 'signup' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-white/40'}`}
                >
                Sign Up
                </button>
                <button 
                onClick={() => setMode('login')}
                className={`flex-1 relative z-10 flex items-center justify-center gap-2 font-bold text-sm tracking-wide transition-colors duration-200 ${mode === 'login' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-white/40'}`}
                >
                Sign In
                </button>
            </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 relative overflow-y-auto">
           {mode === 'signup' ? (
               <SignUp onToggleMode={() => setMode('login')} />
           ) : (
               <Login onToggleMode={() => setMode('signup')} />
           )}
        </div>
      </div>
       <style>{`
        .ease-spring {
            transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;