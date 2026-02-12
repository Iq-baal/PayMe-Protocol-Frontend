import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Home from './components/Home';
import Notifications from './components/Notifications';
import NetworkStatus from './components/NetworkStatus';
import Merchant from './components/Merchant';
import Settings, { SettingsView } from './components/Settings';
import SendFlow from './components/SendFlow';
import ReceiveFlow from './components/ReceiveFlow';
import QRScanner from './components/QRScanner';
import AuthScreen from './components/Auth/AuthScreen';
import Onboarding from './components/Auth/Onboarding';
import InstallPrompt from './components/InstallPrompt';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BalanceProvider } from './contexts/BalanceContext';
import { AppTab, Currency, Theme } from './types';
import { DEFAULT_CURRENCIES } from './constants';
import { Loader2, Lock, Fingerprint, LogOut } from 'lucide-react';
import { verifyBiometrics } from './utils/biometrics';
import { logger } from './utils/logger';

const LockScreen: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const { signOut } = useAuth();

    const handleUnlock = async () => {
        setScanning(true);
        setError('');
        
        try {
            const verified = await verifyBiometrics();
            if (verified) {
                onUnlock();
            } else {
                setError('Biometric verification failed');
            }
        } catch (e) {
            setError('Verification error');
        } finally {
            setScanning(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-[#0f0b1e] flex flex-col items-center justify-center text-white relative">
            {/* Fallback Escape Hatch */}
            <div className="absolute top-8 right-8">
                <button 
                    onClick={() => signOut()}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
                >
                    <LogOut size={16} /> Sign Out
                </button>
            </div>

            <div className="mb-8 relative">
                 <div 
                    onClick={handleUnlock}
                    className={`w-24 h-24 rounded-full border-4 border-[#FF5722] flex items-center justify-center cursor-pointer active:scale-95 transition-all ${scanning ? 'animate-pulse' : ''}`}
                 >
                    <Fingerprint size={48} className="text-[#FF5722]" />
                 </div>
                 {scanning && (
                    <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-20"></div>
                 )}
            </div>
            
            <h1 className="text-2xl font-bold mb-2">PayMe Locked</h1>
            <p className="text-white/50 mb-8 max-w-[200px] text-center">{error || 'Tap icon to unlock with Face ID'}</p>

            <button 
                onClick={handleUnlock}
                className="px-8 py-3 rounded-full bg-white text-black font-bold flex items-center gap-2 active:scale-95 transition-transform"
            >
                {scanning ? 'Verifying...' : 'Unlock'}
            </button>
        </div>
    );
};

const MainApp: React.FC = () => {
  const { session, user, loading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [modalView, setModalView] = useState<'none' | 'send' | 'receive' | 'scan'>('none');
  const [settingsInitView, setSettingsInitView] = useState<SettingsView>('main');
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [scanRecipient, setScanRecipient] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<Theme>('dark');
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  
  // Balance Refresh Logic
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState(0);
  const [pendingRefresh, setPendingRefresh] = useState(false);
  
  // Security State
  const [isLocked, setIsLocked] = useState(false);

  // Currency State - Initialize from LocalStorage or Defaults
  const [currencyList, setCurrencyList] = useState<Currency[]>(DEFAULT_CURRENCIES);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
      const savedCode = localStorage.getItem('payme_selected_currency');
      if (savedCode) {
          const found = DEFAULT_CURRENCIES.find(c => c.code === savedCode);
          if (found) return found;
      }
      return DEFAULT_CURRENCIES.find(c => c.code === 'USD') || DEFAULT_CURRENCIES[0];
  });

  // Save Currency Selection
  useEffect(() => {
      localStorage.setItem('payme_selected_currency', selectedCurrency.code);
  }, [selectedCurrency]);

  // Fetch Live Rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Construct comma separated list of currency codes (lowercase)
        const targets = DEFAULT_CURRENCIES.filter(c => c.code !== 'USDC' && c.code !== 'USD').map(c => c.code.toLowerCase()).join(',');
        
        // Fetch rates for USDC vs Targets
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=${targets}`);
        const data = await response.json();
        
        if (data && data['usd-coin']) {
            const rates = data['usd-coin'];
            
            const updatedList = DEFAULT_CURRENCIES.map(currency => {
                const codeLower = currency.code.toLowerCase();
                if (rates[codeLower]) {
                    return { ...currency, rate: rates[codeLower] };
                }
                return currency;
            });
            
            setCurrencyList(updatedList);
            
            // Also update selected currency reference so the new rate propagates
            setSelectedCurrency(prev => {
                const updated = updatedList.find(c => c.code === prev.code);
                return updated || prev;
            });
        }
      } catch (e) {
        console.warn("Failed to fetch live rates, using defaults.", e);
      }
    };
    
    // Initial Fetch
    fetchRates();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check Face ID Setting on Mount
  useEffect(() => {
      const faceIdEnabled = localStorage.getItem('payme_face_id_enabled') === 'true';
      if (faceIdEnabled) {
          setIsLocked(true);
      }
  }, []);

  // Dark mode because light mode hurts my eyes at 3AM.
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Check for unread notifications
  useEffect(() => {
    if (!user) return;

    const checkUnread = async () => {
        try {
            // Check local read history first
            const localRead = localStorage.getItem('payme_read_notifications');
            const readSet = localRead ? new Set(JSON.parse(localRead)) : new Set();

            // TODO: Fetch from AWS API when notifications endpoint is ready
            // For now, just check localStorage
            const unreadCount = 0; // Placeholder
            
            if (unreadCount > 0) {
                setHasUnreadNotifications(true);
            }
        } catch (e) {
            logger.error("Failed to check notifications", e);
        }
    };
    
    checkUnread();
  }, [user]);

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    if (tab === AppTab.SETTINGS) {
        setSettingsInitView('main');
    }
    
    // When opening notifications, clear the dot
    if (tab === AppTab.NOTIFICATIONS) {
        setHasUnreadNotifications(false);
    }
  };

  const handleOpenProfile = () => {
    setSettingsInitView('account');
    setActiveTab(AppTab.SETTINGS);
  };

  const handleScanSuccess = (decodedText: string) => {
    // Simple parser
    let recipient = decodedText;
    if (decodedText.includes('/')) {
        const parts = decodedText.split('/');
        recipient = parts[parts.length - 1];
    }
    // ensure it starts with @ if it's a name
    if (!recipient.startsWith('@') && !recipient.startsWith('0x')) {
        recipient = '@' + recipient;
    }

    setScanRecipient(recipient);
    setModalView('send');
  };

  const handleSendClose = () => {
      setModalView('none');
      
      // DEFERRED REFRESH: Trigger the balance update only when closing the modal
      // This ensures the user sees the balance animating on the Home screen.
      if (pendingRefresh) {
          setTimeout(() => {
              setBalanceRefreshTrigger(prev => prev + 1);
              setPendingRefresh(false);
          }, 100);
      }
      
      setTimeout(() => setScanRecipient(undefined), 500);
  }

  // --- Auth View Logic ---
  if (loading) {
      return (
          <div className="w-full h-full flex items-center justify-center bg-[#F2F2F7] dark:bg-[#0f0b1e]">
              <Loader2 className="animate-spin text-[#FF5722]" size={32} />
          </div>
      )
  }

  // If Face ID is required and active
  if (isLocked) {
      return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  if (!session) {
      return <AuthScreen />;
  }

  if (session && user && !user.username) {
      return <Onboarding />;
  }

  // --- Main App Logic ---
  const renderContent = () => {
    switch (activeTab) {
      case AppTab.HOME:
        return <Home 
                  onSend={() => setModalView('send')} 
                  onReceive={() => setModalView('receive')} 
                  onScan={() => setModalView('scan')}
                  onOpenProfile={handleOpenProfile}
                  selectedCurrency={selectedCurrency}
                  isBalanceHidden={isBalanceHidden}
                  onTogglePrivacy={() => setIsBalanceHidden(!isBalanceHidden)}
                  refreshTrigger={balanceRefreshTrigger}
               />;
      case AppTab.NOTIFICATIONS:
        return <Notifications selectedCurrency={selectedCurrency} />;
      case AppTab.NETWORK:
        return <NetworkStatus />;
      case AppTab.MERCHANT:
        // Merchant tab - coming soon to mainnet, not my problem right now
        return <Merchant />;
      case AppTab.SETTINGS:
        return <Settings 
                 key={settingsInitView} 
                 initialView={settingsInitView} 
                 selectedCurrency={selectedCurrency}
                 onCurrencyChange={setSelectedCurrency}
                 availableCurrencies={currencyList}
                 theme={theme}
                 onThemeChange={setTheme}
               />;
      default:
        return <Home 
                onSend={() => setModalView('send')} 
                onReceive={() => setModalView('receive')}
                onScan={() => setModalView('scan')}
                onOpenProfile={handleOpenProfile}
                selectedCurrency={selectedCurrency}
                isBalanceHidden={isBalanceHidden}
                onTogglePrivacy={() => setIsBalanceHidden(!isBalanceHidden)}
                refreshTrigger={balanceRefreshTrigger}
               />;
    }
  };

  return (
    <div className="relative w-full h-full max-w-md mx-auto overflow-hidden bg-[#F2F2F7] dark:bg-[#0f0b1e] transition-colors duration-300 flex flex-col">
      {/* Background Ambient Glows - Dark Mode Only (for main app) */}
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] bg-[#673AB7] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse-slow pointer-events-none hidden dark:block"></div>
      <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[60%] bg-[#FF5722] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse-slow pointer-events-none hidden dark:block"></div>

      {/* Main Content Area - Scroll delegated to children now */}
      <main className="relative z-10 w-full flex-1 overflow-hidden">
        {renderContent()}
      </main>

      {/* Navigation */}
      <div className={`fixed bottom-6 left-0 right-0 z-50 flex justify-center transition-all duration-500 pointer-events-none ${modalView !== 'none' ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="w-full max-w-md px-4">
            <BottomNav 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
                hasUnread={hasUnreadNotifications}
            />
        </div>
      </div>

      {/* PWA Install Prompt - Appears over content if applicable */}
      <InstallPrompt />

      {/* Modal Overlays */}
      {modalView !== 'none' && (
        <div className="absolute inset-0 z-50">
           {modalView === 'send' && (
                <SendFlow 
                    onClose={handleSendClose} 
                    onSuccess={() => {
                        // Mark that we need a refresh, but don't do it yet.
                        // We wait for handleSendClose to trigger it so the user sees the animation.
                        setPendingRefresh(true);
                    }}
                    selectedCurrency={selectedCurrency} 
                    initialRecipient={scanRecipient}
                />
            )}
           {modalView === 'receive' && (
                <ReceiveFlow 
                    onClose={() => setModalView('none')} 
                    selectedCurrency={selectedCurrency} 
                />
            )}
            {modalView === 'scan' && (
                <QRScanner 
                    onClose={() => setModalView('none')}
                    onScanSuccess={handleScanSuccess}
                />
            )}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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

const App: React.FC = () => {
    return (
        <AuthProvider>
            <BalanceProvider>
                <MainApp />
            </BalanceProvider>
        </AuthProvider>
    )
}

export default App;