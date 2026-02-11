import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, ArrowDownLeft, DollarSign, Search, Calendar, X, Download, CheckCircle2, Loader2, Landmark, Wallet, Globe, Gift, Copy } from 'lucide-react';
import { Transaction, Currency } from '../types';
import html2canvas from 'html2canvas';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import AppLogo from './AppLogo';

interface TransactionListProps {
  selectedCurrency?: Currency;
  refreshTrigger?: number;
  isBalanceHidden?: boolean;
}

const DEFAULT_CURRENCY: Currency = { code: 'USDC', name: 'USDC', symbol: '$', rate: 1, flag: '🇺🇸' };

const TransactionList: React.FC<TransactionListProps> = ({ 
    selectedCurrency = DEFAULT_CURRENCY, 
    refreshTrigger = 0,
    isBalanceHidden = false
}) => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'ALL' | 'SEND' | 'RECEIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'RECENT'>('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Grabbing the ledger.
  const fetchTransactions = async () => {
    if (!user) return;
    try {
        setLoading(true);

        const response = await apiClient.getTransactions(user.id);

        if (!response.success || !response.data) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        setTransactions(response.data);
        setLoading(false);
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        setTransactions([]);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // Realtime updates will be added when AWS backend supports WebSockets
  }, [user, refreshTrigger]);

  const getIcon = (tx: Transaction) => {
    if (tx.icon === 'bonus') return <Gift className="text-[#FF5722]" size={20} />;
    if (tx.icon === 'bank') return <Landmark className="text-gray-900 dark:text-white" size={20} />;
    if (tx.icon === 'wallet') return <Wallet className="text-gray-900 dark:text-white" size={20} />;
    
    switch (tx.type) {
      case 'receive':
        return <ArrowDownLeft className="text-[#673AB7]" size={20} />;
      case 'send':
        return <ArrowUpRight className="text-[#FF5722]" size={20} />;
      default:
        return <DollarSign className="text-gray-500 dark:text-white" size={20} />;
    }
  };

  const getIconBg = (tx: Transaction) => {
      if (tx.icon === 'bonus') return 'bg-[#FF5722]/10 dark:bg-[#FF5722]/20';
      if (tx.icon === 'bank' || tx.icon === 'wallet') return 'bg-gray-200 dark:bg-white/10';
      return tx.type === 'send' ? 'bg-[#FF5722]/10 dark:bg-[#FF5722]/20' : 'bg-[#673AB7]/10 dark:bg-[#673AB7]/20';
  }

  const getBgColor = (tx: Transaction) => {
    switch (tx.type) {
      case 'receive':
        return 'bg-[#673AB7]/5 dark:bg-[#673AB7]/10';
      case 'send':
        return 'bg-[#FF5722]/5 dark:bg-[#FF5722]/10';
      default:
        return 'bg-gray-100 dark:bg-white/10';
    }
  };
  
  const convertAmount = (amount: number) => {
      const val = amount * selectedCurrency.rate;
      if (val >= 1000000) {
          return new Intl.NumberFormat('en-US', { 
              notation: "compact", 
              maximumFractionDigits: 1,
              minimumFractionDigits: 0
          }).format(val);
      }
      return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const handleDownloadReceipt = async () => {
    const receiptElement = document.getElementById('receipt-card');
    if (receiptElement) {
        try {
            const isDark = document.documentElement.classList.contains('dark');
            const bgColor = isDark ? '#0f0b1e' : '#ffffff';
            
            const canvas = await html2canvas(receiptElement, {
                backgroundColor: bgColor,
                scale: 3,
                logging: false,
                useCORS: true,
                allowTaint: true,
            });
            
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `PayMe_Receipt_${selectedTx?.id.slice(0,8)}.png`;
            link.click();
        } catch (err) {
            console.error("Receipt download failed", err);
            alert("Could not download receipt. Please try again.");
        }
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filterType !== 'ALL' && tx.type.toUpperCase() !== filterType) {
      return false;
    }
    if (searchQuery && !tx.counterparty.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <>
    <div className="flex flex-col gap-4 pb-32">
      <div className="px-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white/90">History</h3>
          </div>

          <div className="w-full bg-gray-200 dark:bg-white/5 rounded-xl p-1 flex relative">
              <div 
                  className="absolute top-1 bottom-1 w-[calc(33.33%-5px)] bg-white dark:bg-[#FF5722] rounded-lg shadow-sm transition-all duration-300 ease-spring"
                  style={{
                      left: filterType === 'ALL' ? '4px' : filterType === 'SEND' ? 'calc(33.33% + 2px)' : 'calc(66.66%)'
                  }}
              />
              <button onClick={() => setFilterType('ALL')} className={`flex-1 relative z-10 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${filterType === 'ALL' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-white/40'}`}>All</button>
              <button onClick={() => setFilterType('SEND')} className={`flex-1 relative z-10 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${filterType === 'SEND' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-white/40'}`}>Sent</button>
              <button onClick={() => setFilterType('RECEIVE')} className={`flex-1 relative z-10 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${filterType === 'RECEIVE' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-white/40'}`}>Received</button>
          </div>
          
          <div className="flex gap-2">
              <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 group-focus-within:text-gray-600 dark:group-focus-within:text-white/70 transition-colors" size={16} />
                  <input 
                      type="text" 
                      placeholder="Search transactions..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm dark:shadow-none"
                  />
              </div>
              <button 
                onClick={() => setDateFilter(dateFilter === 'RECENT' ? 'ALL' : 'RECENT')}
                className={`p-2.5 rounded-xl border transition-all ${dateFilter === 'RECENT' ? 'bg-white dark:bg-white border-gray-200 dark:border-white text-gray-900 dark:text-[#0f0b1e]' : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/5 text-gray-400 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/10'}`}
              >
                  <Calendar size={16} />
              </button>
          </div>
      </div>

      <div className="flex flex-col gap-3 px-2">
          {loading ? (
              <div className="flex flex-col gap-4 items-center justify-center py-12 opacity-50">
                  <Loader2 className="animate-spin text-gray-400" />
                  <span className="text-sm text-gray-400">Loading transactions...</span>
              </div>
          ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    onClick={() => setSelectedTx(tx)}
                    className={`flex items-center justify-between p-4 rounded-[24px] ${getBgColor(tx)} border border-black/5 dark:border-white/5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all`}
                  >
                      <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getIconBg(tx)}`}>
                              {getIcon(tx)}
                          </div>
                          <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 dark:text-white">{tx.counterparty}</span>
                              <span className="text-xs text-gray-500 dark:text-white/50">{tx.date}</span>
                          </div>
                      </div>
                      <div className="flex flex-col items-end">
                          <span className={`font-bold ${tx.type === 'receive' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                              {isBalanceHidden ? '••••' : `${tx.type === 'receive' ? '+' : '-'} ${selectedCurrency.symbol}${convertAmount(tx.amount)}`}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-white/30">{tx.status}</span>
                      </div>
                  </div>
              ))
          ) : (
              <div className="text-center py-12 text-gray-400 dark:text-white/30 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-2">
                      <DollarSign size={20} className="opacity-50" />
                  </div>
                  <span>Nothing to see here...</span>
              </div>
          )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTx(null)}></div>
           
           <div className="relative w-full max-w-md bg-[#F2F2F7] dark:bg-[#0f0b1e] rounded-[32px] p-6 animate-slide-up flex flex-col gap-6 max-h-[90vh] overflow-y-auto shadow-2xl no-scrollbar">
               <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction Details</h2>
                   <button onClick={() => setSelectedTx(null)} className="p-2 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">
                       <X size={20} className="text-gray-900 dark:text-white" />
                   </button>
               </div>

               <div id="receipt-card" className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[24px] shadow-sm border border-black/5 dark:border-white/5 flex flex-col relative overflow-hidden">
                   
                   <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-[#FF5722]/10 rounded-full blur-[50px] pointer-events-none"></div>
                   <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-[#673AB7]/10 rounded-full blur-[50px] pointer-events-none"></div>

                   <div className="flex flex-col items-center justify-center mb-8 z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8">
                                <AppLogo className="w-full h-full rounded-lg shadow-none" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">PayMe Protocol</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-[0.2em] border border-gray-200 dark:border-white/10 px-2 py-0.5 rounded">Transaction Receipt</span>
                   </div>

                   <div className="flex flex-col items-center border-b border-dashed border-gray-200 dark:border-white/10 pb-8 mb-8 z-10">
                       <span className={`text-4xl font-black tracking-tight mb-2 ${selectedTx.type === 'receive' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                           {isBalanceHidden ? '••••••' : `${selectedTx.type === 'receive' ? '+' : '-'}${selectedCurrency.symbol}${convertAmount(selectedTx.amount)}`}
                       </span>
                       <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/5">
                           <CheckCircle2 size={12} className="text-green-600 dark:text-green-400" />
                           <span className="text-xs font-bold text-gray-600 dark:text-white/70 uppercase tracking-wide">{selectedTx.status}</span>
                           <span className="text-[10px] text-gray-400 dark:text-white/30">• {selectedTx.date}</span>
                       </div>
                   </div>

                   <div className="flex flex-col gap-4 z-10 text-sm">
                       <div className="flex justify-between items-center">
                           <span className="text-gray-500 dark:text-white/50">Type</span>
                           <span className="font-medium text-gray-900 dark:text-white capitalize text-right">
                               {selectedTx.icon === 'bonus' ? 'System Reward' : selectedTx.icon === 'bank' ? 'Bank Transfer' : selectedTx.icon === 'wallet' ? 'Crypto Transfer' : selectedTx.type}
                           </span>
                       </div>
                       
                       <div className="flex justify-between items-center">
                           <span className="text-gray-500 dark:text-white/50">From</span>
                           <div className="flex items-center gap-1.5">
                                <span className="font-medium text-gray-900 dark:text-white">{selectedTx.senderHandle}</span>
                           </div>
                       </div>
                       
                       <div className="flex justify-between items-center">
                           <span className="text-gray-500 dark:text-white/50">To</span>
                           <div className="flex items-center gap-1.5">
                                <span className="font-medium text-gray-900 dark:text-white">{selectedTx.receiverHandle}</span>
                           </div>
                       </div>
                       
                       <div className="flex justify-between items-start">
                           <span className="text-gray-500 dark:text-white/50">Reference</span>
                           <span className="font-medium text-gray-900 dark:text-white text-right max-w-[180px] break-words leading-tight">
                               {selectedTx.narration || 'N/A'}
                           </span>
                       </div>

                       <div className="flex justify-between items-center mt-2">
                           <span className="text-gray-500 dark:text-white/50">Transaction ID</span>
                           <div className="flex items-center gap-2">
                               <span className="font-mono text-[10px] text-gray-600 dark:text-white/70 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded border border-black/5 dark:border-white/5">
                                   {selectedTx.id.toUpperCase().slice(0, 12)}...
                               </span>
                           </div>
                       </div>
                   </div>

                   <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center gap-2 z-10">
                        <p className="text-[10px] text-gray-400 dark:text-white/30 text-center max-w-[220px] leading-relaxed">
                            This receipt confirms that the transaction has been processed securely by the PayMe Protocol.
                        </p>
                        <div className="flex items-center gap-1.5 opacity-60">
                            <Globe size={10} className="text-gray-500 dark:text-white/50" />
                            <span className="text-[10px] font-bold text-gray-900 dark:text-white">payme.io</span>
                        </div>
                   </div>
               </div>
               
               <button 
                onClick={handleDownloadReceipt}
                className="w-full py-4 rounded-[24px] bg-gray-900 dark:bg-white text-white dark:text-[#0f0b1e] font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
               >
                   <Download size={20} />
                   Save Image
               </button>
           </div>
        </div>,
        document.body
      )}
      <style>{`
        .ease-spring {
            transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </div>
    </>
  );
};

export default TransactionList;