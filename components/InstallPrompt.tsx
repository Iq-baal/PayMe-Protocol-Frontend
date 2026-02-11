import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, ChevronRight } from 'lucide-react';
import GlassCard from './GlassCard';

const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // 2. Check if user dismissed it recently (e.g., hide for 24h)
    const dismissedTs = localStorage.getItem('payme_install_dismissed');
    if (dismissedTs) {
        const diff = Date.now() - parseInt(dismissedTs);
        // If dismissed less than 24 hours ago, don't show
        if (diff < 24 * 60 * 60 * 1000) return; 
    }

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
        // Show prompt for iOS immediately (since we can't detect "installability" event like Android)
        setShowPrompt(true);
    }

    // 4. Detect Android (beforeinstallprompt)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
        setShowIOSInstructions(true);
    } else if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
      setShowPrompt(false);
      setShowIOSInstructions(false);
      localStorage.setItem('payme_install_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <>
        {/* Floating Install Banner (Bottom) */}
        {!showIOSInstructions && (
            <div className="fixed bottom-24 left-4 right-4 z-[40] animate-slide-up">
                <GlassCard noPadding className="flex items-center justify-between p-4 bg-gray-900/90 dark:bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FF5722] flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <Download size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-white text-sm">Install PayMe</span>
                            <span className="text-xs text-white/60">Add to Home Screen</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleDismiss}
                            className="p-2 rounded-full hover:bg-white/10 text-white/40 transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <button 
                            onClick={handleInstallClick}
                            className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold active:scale-95 transition-transform"
                        >
                            Install
                        </button>
                    </div>
                </GlassCard>
            </div>
        )}

        {/* iOS Instruction Modal */}
        {showIOSInstructions && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowIOSInstructions(false)}></div>
                
                <div className="relative w-full max-w-md bg-[#F2F2F7] dark:bg-[#0f0b1e] rounded-t-[32px] sm:rounded-[32px] p-6 animate-slide-up flex flex-col gap-6 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Install on iOS</h2>
                        <button onClick={() => setShowIOSInstructions(false)} className="p-2 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">
                            <X size={20} className="text-gray-900 dark:text-white" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-500/10 rounded-xl">
                                <Share className="text-blue-500" size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-900 dark:text-white">1. Tap the Share Button</span>
                                <span className="text-sm text-gray-500 dark:text-white/50">Look for the icon at the bottom of your Safari browser.</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            <div className="h-8 w-px bg-gray-300 dark:bg-white/10"></div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-200 dark:bg-white/10 rounded-xl">
                                <PlusSquare className="text-gray-900 dark:text-white" size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-900 dark:text-white">2. Add to Home Screen</span>
                                <span className="text-sm text-gray-500 dark:text-white/50">Scroll down and select "Add to Home Screen".</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowIOSInstructions(false)}
                        className="w-full py-4 rounded-[24px] bg-[#FF5722] text-white font-bold text-lg shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all"
                    >
                        Got it
                    </button>
                    
                    {/* Visual Pointer for iOS Safari Bottom Bar */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full flex flex-col items-center animate-bounce opacity-80 pointer-events-none">
                         <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white dark:border-t-[#0f0b1e]"></div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default InstallPrompt;