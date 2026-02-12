import React, { useEffect, useState } from 'react';
import GlassCard from './GlassCard';
import TransactionList from './TransactionList';
import PullToRefresh from './PullToRefresh';
import AnimatedBalance from './AnimatedBalance';
import { ScanLine, Send, Plus, Eye, EyeOff, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Currency } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useBalance } from '../contexts/BalanceContext';

interface HomeProps {
  onSend: () => void;
  onReceive: () => void;
  onScan: () => void;
  onOpenProfile: () => void;
  selectedCurrency: Currency;
  isBalanceHidden: boolean;
  onTogglePrivacy: () => void;
  refreshTrigger?: number; // Added to force refresh
}

const Home: React.FC<HomeProps> = ({ 
    onSend, 
    onReceive, 
    onScan,
    onOpenProfile, 
    selectedCurrency,
    isBalanceHidden,
    onTogglePrivacy,
    refreshTrigger = 0
}) => {
  const { user } = useAuth();
  const { balance, confirmedBalance, pendingTransactions, isLoading, refreshBalance } = useBalance();
  // Internal refresh trigger for manual pull-to-refresh
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);

  const handleRefresh = async () => {
      // Fetch fresh balance
      await refreshBalance();
      // Increment internal trigger to signal TransactionList to reload
      setInternalRefreshTrigger(prev => prev + 1);
      // Wait a little to let the user see the spinner (placebo)
      await new Promise(resolve => setTimeout(resolve, 500));
  };

  // Re-fetch when external refreshTrigger changes (e.g. after a payment)
  useEffect(() => {
      refreshBalance();
  }, [refreshTrigger, refreshBalance]);

  const isBalanceLoading = isLoading;

  // Calculate display balance logic for when not hidden
  const rawBalanceInCurrency = (balance || 0) * selectedCurrency.rate;
  
  // Extract First Name for Greeting
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'User';

  return (
    <div className="h-full flex flex-col">
        <PullToRefresh onRefresh={handleRefresh} className="px-4 pt-4 pb-24 flex-1">
          <div className="flex flex-col gap-8 animate-fade-in min-h-full">
            {/* Profile Header */}
            <div className="flex justify-between items-center px-2 pt-2">
              <div 
                onClick={onOpenProfile}
                className="flex items-center gap-3 cursor-pointer active:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#673AB7] p-[2px]">
                  <img src={user?.avatar_url || "https://picsum.photos/100/100"} alt="User" className="w-full h-full rounded-full object-cover border border-white dark:border-[#0f0b1e]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-white/60">Welcome back,</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{firstName}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                  <button 
                      onClick={onTogglePrivacy}
                      className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center border border-gray-100 dark:border-white/10 active:bg-gray-100 dark:active:bg-white/20 shadow-sm dark:shadow-none transition-colors"
                  >
                      {isBalanceHidden ? (
                          <EyeOff size={20} className="text-gray-900 dark:text-white" />
                      ) : (
                          <Eye size={20} className="text-gray-900 dark:text-white" />
                      )}
                  </button>
                  <button 
                      onClick={onScan}
                      className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center border border-gray-100 dark:border-white/10 active:bg-gray-100 dark:active:bg-white/20 shadow-sm dark:shadow-none transition-colors"
                  >
                      <ScanLine size={20} className="text-gray-900 dark:text-white" />
                  </button>
              </div>
            </div>

            {/* Main Balance Card */}
            <GlassCard className="mt-2 min-h-[220px] flex flex-col justify-between group cursor-pointer hover:shadow-orange-500/20 bg-white dark:bg-white/5">
              <div>
                  <div className="flex justify-between items-start mb-2">
                      <span className="text-gray-500 dark:text-white/60 text-sm font-medium">Total Balance ({selectedCurrency.code})</span>
                      <div className="flex items-center gap-2">
                          {pendingTransactions.length > 0 && (
                              <span className="px-2 py-1 rounded-full bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-bold border border-yellow-500/10 dark:border-yellow-500/20 flex items-center gap-1">
                                  <Clock size={12} />
                                  {pendingTransactions.length} pending
                              </span>
                          )}
                          <span className="px-3 py-1 rounded-full bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold border border-green-500/10 dark:border-green-500/20">
                              Live
                          </span>
                      </div>
                  </div>
                  
                  {isBalanceLoading ? (
                      <div className="h-16 flex items-center">
                          <Loader2 className="animate-spin text-gray-400" />
                      </div>
                  ) : isBalanceHidden ? (
                      <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white py-2">
                          ••••••
                      </h1>
                  ) : (
                      <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-white dark:to-white/70 bg-clip-text text-transparent break-all flex items-baseline">
                          <AnimatedBalance 
                              value={rawBalanceInCurrency} 
                              prefix={selectedCurrency.symbol}
                              decimalClassName="text-2xl text-gray-400 dark:text-white/40"
                          />
                      </h1>
                  )}

                  {!isBalanceHidden && selectedCurrency.code !== 'USDC' && (
                      <div className="flex flex-col gap-1 mt-1">
                          <div className="text-xs text-gray-400 dark:text-white/30 font-mono flex items-center gap-1">
                              ≈ <AnimatedBalance value={balance || 0} prefix="" decimals={0} /> USDC
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-white/20 font-mono">
                              Rate: $1 = {selectedCurrency.symbol}{selectedCurrency.rate.toLocaleString()}
                          </div>
                      </div>
                  )}
                  {isBalanceHidden && selectedCurrency.code !== 'USDC' && (
                      <div className="text-xs text-gray-400 dark:text-white/30 mt-1 font-mono">
                          ≈ •••• USDC
                      </div>
                  )}

                  {/* Pending transactions list */}
                  {!isBalanceHidden && pendingTransactions.length > 0 && (
                      <div className="mt-3 space-y-2">
                          {pendingTransactions.map(tx => (
                              <div key={tx.id} className="flex items-center gap-2 text-xs">
                                  {tx.status === 'pending' && (
                                      <>
                                          <Clock size={12} className="text-yellow-500 animate-pulse" />
                                          <span className="text-gray-600 dark:text-white/60">
                                              {tx.type === 'send' ? 'Sending' : 'Receiving'} ${tx.amount.toLocaleString()}...
                                          </span>
                                      </>
                                  )}
                                  {tx.status === 'confirming' && (
                                      <>
                                          <Loader2 size={12} className="text-blue-500 animate-spin" />
                                          <span className="text-gray-600 dark:text-white/60">
                                              Confirming ${tx.amount.toLocaleString()} on blockchain...
                                          </span>
                                      </>
                                  )}
                                  {tx.status === 'confirmed' && (
                                      <>
                                          <CheckCircle size={12} className="text-green-500" />
                                          <span className="text-green-600 dark:text-green-400">
                                              ${tx.amount.toLocaleString()} confirmed!
                                          </span>
                                      </>
                                  )}
                                  {tx.status === 'failed' && (
                                      <>
                                          <XCircle size={12} className="text-red-500" />
                                          <span className="text-red-600 dark:text-red-400">
                                              ${tx.amount.toLocaleString()} failed
                                          </span>
                                      </>
                                  )}
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              <div className="flex gap-4 mt-8">
                  <button onClick={onSend} className="flex-1 flex flex-col items-center gap-2 group/btn">
                      <div className="w-12 h-12 rounded-[18px] bg-[#FF5722] flex items-center justify-center shadow-lg shadow-orange-500/30 group-active/btn:scale-95 transition-all">
                          <Send size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-white/80">Send</span>
                  </button>
                  <button onClick={onReceive} className="flex-1 flex flex-col items-center gap-2 group/btn">
                      <div className="w-12 h-12 rounded-[18px] bg-[#FF5722] flex items-center justify-center shadow-lg shadow-orange-500/30 group-active/btn:scale-95 transition-all">
                          <Plus size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-white/80">Receive</span>
                  </button>
              </div>
            </GlassCard>

            {/* Transaction Feed - Combined external and internal triggers */}
            <TransactionList 
                selectedCurrency={selectedCurrency} 
                refreshTrigger={refreshTrigger + internalRefreshTrigger} 
                isBalanceHidden={isBalanceHidden}
            />
          </div>
        </PullToRefresh>
    </div>
  );
};

export default Home;