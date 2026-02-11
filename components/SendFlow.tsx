import React, { useState, useEffect, useRef } from 'react';
import GlassCard from './GlassCard';
import { X, ArrowRight, User, Search, ChevronDown, Fingerprint, CheckCircle2, AlertCircle, Zap, AtSign, ScanLine, Bitcoin, Landmark, Loader2, FileText, Lock, ScanFace, ArrowUpDown, RefreshCcw, Wallet, ShieldCheck, CreditCard } from 'lucide-react';
import { Currency } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import { verifyBiometrics } from '../utils/biometrics';

interface SendFlowProps {
  onClose: () => void;
  onSuccess?: () => void;
  selectedCurrency: Currency;
  initialRecipient?: string;
}

type Step = 'menu' | 'recipient' | 'amount' | 'confirm' | 'biometric-check' | '2fa' | 'success' | 'crypto-coming-soon' | 'bank-coming-soon';

interface RecipientProfile {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
}

const SendFlow: React.FC<SendFlowProps> = ({ onClose, onSuccess, selectedCurrency, initialRecipient }) => {
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>(initialRecipient ? 'amount' : 'menu');
  const [recipient, setRecipient] = useState(initialRecipient || '');
  
  // Store full profile for display
  const [recipientProfile, setRecipientProfile] = useState<RecipientProfile | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<RecipientProfile[]>([]);
  
  // Amount & Currency Logic
  const [amount, setAmount] = useState('');
  const [inputInBaseCurrency, setInputInBaseCurrency] = useState(false); // false = Local (e.g. NGN), true = Base (USDC)
  
  const [narration, setNarration] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(0); // Always in USDC
  
  const [validationStatus, setValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>(initialRecipient ? 'idle' : 'idle');
  
  // 2FA State
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAError, setTwoFAError] = useState('');

  // Hold to Send State
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<any>(null);
  const isSubmitting = useRef(false);
  
  // Biometric State
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  useEffect(() => {
      setBiometricsEnabled(localStorage.getItem('payme_biometrics_payment_enabled') === 'true');
  }, []);

  // Helper for consistent formatting across the app
  const formatCompactNumber = (val: number) => {
      if (val >= 1000000) {
          return new Intl.NumberFormat('en-US', { 
              notation: "compact", 
              maximumFractionDigits: 1,
              minimumFractionDigits: 0
          }).format(val);
      }
      return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  // Fetch Balance
  useEffect(() => {
    if (!user) return;
    const fetchBalance = async () => {
        const response = await apiClient.getBalance();
        if (response.success && response.data) {
            // Handle both response formats
            const balanceValue = typeof response.data.balance === 'object' 
              ? response.data.balance.balance 
              : response.data.balance;
            setCurrentBalance(balanceValue || 0);
        }
    };
    fetchBalance();
    
    // Poll balance every 5 seconds for real-time updates
    const intervalId = setInterval(fetchBalance, 5000);
    return () => clearInterval(intervalId);
  }, [user]);

  // Fetch Suggestions - Mock users for now
  useEffect(() => {
      if (!user) return;
      const fetchSuggestions = async () => {
          // TODO: Add API endpoint for suggested users
          // For now, suggestions are empty
          setSuggestedUsers([]);
      };
      
      if (step === 'recipient' && !recipient) {
          fetchSuggestions();
      }
  }, [step, user, recipient]);

  // Validate recipient username
  useEffect(() => {
    // If we have an initial recipient that hasn't changed, perform a quick check
    if (initialRecipient && recipient === initialRecipient) {
         const checkInitial = async () => {
             const username = initialRecipient.replace('@','').toLowerCase();
              if (user?.username === username) {
                setValidationStatus('invalid');
                return;
             }
             const response = await apiClient.getUserByUsername(username);
                
             if (response.success && response.data) {
                 setRecipientProfile(response.data);
                 setValidationStatus('valid');
             } else {
                 setValidationStatus('invalid');
             }
         }
         checkInitial();
         return;
    }

    const timer = setTimeout(async () => {
      const cleanHandle = recipient.replace('@', '').trim().toLowerCase();

      if (cleanHandle.length > 2) {
          setValidationStatus('checking');
          
          if (user?.username === cleanHandle) {
              setValidationStatus('invalid');
              return;
          }

          try {
            const response = await apiClient.getUserByUsername(cleanHandle);

            if (response.success && response.data) {
                setRecipientProfile(response.data);
                setValidationStatus('valid');
            } else {
                setValidationStatus('invalid');
                setRecipientProfile(null);
            }
          } catch (e) {
             setValidationStatus('invalid');
          }
      } else if (recipient.length === 0) {
          setValidationStatus('idle');
          setRecipientProfile(null);
      }
    }, 500); 

    return () => clearTimeout(timer);
  }, [recipient, initialRecipient, user]);

  useEffect(() => {
      return () => {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      }
  }, []);

  useEffect(() => {
    if (holdProgress >= 100) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
        initiateTransaction();
    }
  }, [holdProgress]);

  const startHold = (e?: React.SyntheticEvent) => {
    if (isProcessing || isSubmitting.current) return;
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    holdIntervalRef.current = setInterval(() => {
        setHoldProgress(prev => {
            if (prev >= 100) {
                if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
                return 100;
            }
            return prev + 3; 
        });
    }, 10);
  };

  const stopHold = () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      if (holdProgress < 100) {
          setHoldProgress(0);
      }
  };

  const handleAmountInput = (val: string) => {
    if (/^\d*\.?\d*$/.test(val)) {
      setAmount(val);
    }
  };

  /**
   * SECURE FINTECH FLOW:
   * 1. PIN is ALWAYS required for transactions
   * 2. Biometrics are convenience - they verify user identity before PIN entry
   * 3. Backend ALWAYS validates PIN - never trust client
   * 4. PIN is sent to backend for each transaction (never stored client-side)
   */

  const handleBiometricVerification = async () => {
      // Biometrics verify user identity, then prompt for PIN
      const verified = await verifyBiometrics();
      if (verified) {
          // Biometric success - now prompt for PIN
          setStep('2fa');
      } else {
          // Biometric failed - still allow PIN entry as fallback
          setTwoFAError('Biometric verification failed. Enter PIN to continue.');
          setStep('2fa');
      }
  }

  const initiateTransaction = () => {
      if (isSubmitting.current) return;
      
      // ALWAYS require PIN for transactions (fintech best practice)
      // Check if user has set a PIN
      if (!user?.transaction_pin) {
          setTwoFAError('Please set a transaction PIN in Settings first');
          setStep('confirm');
          return;
      }
      
      // If biometrics enabled, verify identity first, then prompt for PIN
      if (biometricsEnabled) {
          handleBiometricVerification();
      } else {
          // No biometrics - go straight to PIN entry
          setStep('2fa');
      }
  }

  const handle2FAVerify = () => {
      if (!user) return;
      
      if (twoFACode.length !== 4) {
          setTwoFAError('Enter 4-digit PIN');
          return;
      }

      // Send PIN to backend for validation (NEVER validate client-side)
      handleConfirm(twoFACode);
  };

  const handleConfirm = async (pin?: string) => {
    if (isSubmitting.current || !recipientProfile) return;
    
    // PIN is REQUIRED for all transactions
    if (!pin) {
        setTwoFAError('PIN is required for transactions');
        setStep('2fa');
        return;
    }
    
    isSubmitting.current = true;
    setIsProcessing(true);
    setTwoFAError('');

    try {
        // Calculate amount in USDC
        const amountNum = parseFloat(amount);
        const finalAmountUSDC = inputInBaseCurrency ? amountNum : (amountNum / selectedCurrency.rate);

        // Send transaction with PIN to backend for validation
        const response = await apiClient.sendTransaction({
            senderId: user!.id,
            receiverId: recipientProfile.id,
            amount: finalAmountUSDC,
            currency: 'USDC',
            narration: narration || 'Money Transfer',
            pin: pin, // PIN sent to backend for validation
        });

        if (!response.success) {
            // Check for PIN error
            if (response.error?.includes('PIN') || response.error?.includes('pin')) {
                setTwoFAError('Incorrect PIN. Please try again.');
                setStep('2fa');
                setTimeout(() => setTwoFACode(''), 500);
            } else if (response.error?.includes('balance') || response.error?.includes('Insufficient')) {
                setTwoFAError('Insufficient balance');
                setStep('confirm');
            } else {
                setTwoFAError(response.error || "Transaction failed");
                setStep('confirm'); 
            }
            isSubmitting.current = false;
            setIsProcessing(false);
            setHoldProgress(0);
            return;
        }

        setStep('success');
        if (onSuccess) onSuccess();

    } catch (err: any) {
        console.error("Transfer failed", err);
        setTwoFAError('Transaction failed. Please try again.');
        isSubmitting.current = false;
        setIsProcessing(false);
        setHoldProgress(0);
        setStep('confirm');
    }
  };

  // --- RENDERERS ---

  const renderMenu = () => (
    <div className="flex flex-col gap-4 animate-fade-in pt-4">
        <h3 className="text-center text-gray-500 dark:text-white/60 mb-4">Choose Recipient</h3>
        
        <GlassCard onClick={() => setStep('recipient')} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] bg-white dark:bg-white/[0.03]">
            <div className="w-12 h-12 rounded-full bg-[#FF5722]/10 dark:bg-[#FF5722]/20 flex items-center justify-center">
                <AtSign size={24} className="text-[#FF5722]" />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900 dark:text-white">PayMe ID</span>
                <span className="text-gray-500 dark:text-white/50 text-sm">Send to @username</span>
            </div>
            <div className="flex-1" />
            <ArrowRight size={20} className="text-gray-400 dark:text-white/20" />
        </GlassCard>

        <GlassCard onClick={() => setStep('crypto-coming-soon')} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] bg-white dark:bg-white/[0.03]">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                <Bitcoin size={24} className="text-blue-500 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900 dark:text-white">Crypto Address</span>
                <span className="text-gray-500 dark:text-white/50 text-sm">Send to 0x... wallet</span>
            </div>
            <div className="flex-1" />
            <ArrowRight size={20} className="text-gray-400 dark:text-white/20" />
        </GlassCard>

        <GlassCard onClick={() => setStep('bank-coming-soon')} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] bg-white dark:bg-white/[0.03]">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                <Landmark size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900 dark:text-white">Bank Account</span>
                <span className="text-gray-500 dark:text-white/50 text-sm">Withdraw to Bank</span>
            </div>
            <div className="flex-1" />
            <ArrowRight size={20} className="text-gray-400 dark:text-white/20" />
        </GlassCard>
    </div>
  );

  const renderRecipient = () => (
    <div className="flex flex-col gap-6 animate-fade-in pt-2">
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40">
                <Search size={20} />
            </div>
            <input 
                type="text" 
                placeholder="Enter @username"
                value={recipient}
                onChange={(e) => {
                    let val = e.target.value.toLowerCase(); // Force lowercase
                    // Force @ prefix logic for better UX
                    if (val.length === 1 && val !== '@') {
                        val = '@' + val;
                    }
                    setRecipient(val);
                }}
                className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 pl-12 pr-12 text-gray-900 dark:text-white text-lg font-medium outline-none focus:border-[#FF5722] transition-colors shadow-sm dark:shadow-none"
                autoFocus
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {validationStatus === 'checking' && <Loader2 size={20} className="animate-spin text-gray-400" />}
                {validationStatus === 'valid' && <CheckCircle2 size={20} className="text-green-500" />}
                {validationStatus === 'invalid' && recipient.length > 2 && <AlertCircle size={20} className="text-red-500" />}
            </div>
        </div>

        {/* Found User Profile Preview - Show this prominently when found */}
        {validationStatus === 'valid' && recipientProfile && (
             <div className="flex flex-col items-center gap-4 py-4 animate-fade-in">
                 <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#673AB7] p-[2px] shadow-lg shadow-purple-500/20">
                     <img 
                        src={recipientProfile.avatar_url || "https://picsum.photos/100"} 
                        alt={recipientProfile.username} 
                        className="w-full h-full rounded-full object-cover border-2 border-white dark:border-[#0f0b1e]" 
                     />
                 </div>
                 <div className="flex flex-col items-center">
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white">{recipientProfile.full_name}</h3>
                     <p className="text-gray-500 dark:text-white/50">@{recipientProfile.username}</p>
                     <div className="mt-2 flex items-center gap-1 bg-green-500/10 px-3 py-1 rounded-full">
                         <CheckCircle2 size={12} className="text-green-500" />
                         <span className="text-xs font-bold text-green-600 dark:text-green-400">Verified User</span>
                     </div>
                 </div>
             </div>
        )}

        {/* Suggested Users List - Only show if we haven't found a specific user yet */}
        {validationStatus !== 'valid' && !recipient && suggestedUsers.length > 0 && (
            <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider ml-2">Suggested</h4>
                {suggestedUsers.map(u => (
                    <div 
                        key={u.id}
                        onClick={() => {
                            setRecipient('@' + u.username);
                            setRecipientProfile(u);
                            // Immediate transition feels snappy
                            setValidationStatus('valid');
                        }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 active:bg-gray-50 dark:active:bg-white/10 cursor-pointer transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#673AB7] p-[1px]">
                             <img src={u.avatar_url || "https://picsum.photos/100"} alt={u.username} className="w-full h-full rounded-full object-cover border border-white dark:border-[#0f0b1e]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{u.full_name}</span>
                            <span className="text-xs text-gray-500 dark:text-white/50">@{u.username}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <button 
            disabled={validationStatus !== 'valid'}
            onClick={() => setStep('amount')}
            className="w-full py-4 rounded-[24px] bg-[#FF5722] disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 dark:disabled:text-white/30 text-white font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-auto"
        >
            Next
        </button>
    </div>
  );

  const renderAmount = () => {
    // Conversion Logic
    const amountNum = parseFloat(amount) || 0;
    
    // If input is Base (USDC), converted is Local.
    // If input is Local (NGN), converted is Base.
    const convertedValue = inputInBaseCurrency 
        ? (amountNum * selectedCurrency.rate) 
        : (amountNum / selectedCurrency.rate);

    const convertedSymbol = inputInBaseCurrency ? selectedCurrency.symbol : '$';
    const convertedCode = inputInBaseCurrency ? selectedCurrency.code : 'USDC';

    // Balance Check
    // If input is Local, compare converted (USDC) to Balance (USDC)
    // If input is Base, compare input (USDC) to Balance (USDC)
    const transactionAmountUSDC = inputInBaseCurrency ? amountNum : convertedValue;
    const isInsufficient = transactionAmountUSDC > currentBalance;
    
    // Calculate display balance logic
    const availableBalance = inputInBaseCurrency 
        ? currentBalance 
        : currentBalance * selectedCurrency.rate;
        
    const balanceSymbol = inputInBaseCurrency ? '$' : selectedCurrency.symbol;

    return (
        <div className="flex flex-col h-full animate-fade-in pt-4">
             {/* Profile Check */}
             <div className="flex items-center justify-center gap-2 mb-8 opacity-80">
                <span className="text-gray-500 dark:text-white/50">Sending to</span>
                <span className="font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded-lg">
                    {recipientProfile?.full_name || recipient}
                </span>
             </div>

             {/* Input Area */}
             <div className="flex flex-col items-center justify-center flex-1 relative">
                 <div className="flex items-end justify-center gap-1 relative w-full">
                     <span className="text-4xl font-medium text-gray-400 dark:text-white/40 mb-2">
                         {inputInBaseCurrency ? '$' : selectedCurrency.symbol}
                     </span>
                     <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => handleAmountInput(e.target.value)}
                        placeholder="0"
                        className="text-7xl font-bold bg-transparent text-center text-gray-900 dark:text-white outline-none w-full max-w-[280px] caret-[#FF5722]"
                        autoFocus
                     />
                 </div>

                 {/* Toggle Currency */}
                 <div 
                    onClick={() => setInputInBaseCurrency(!inputInBaseCurrency)}
                    className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/5 cursor-pointer active:scale-95 transition-transform"
                 >
                     <RefreshCcw size={12} className="text-gray-400 dark:text-white/40" />
                     <span className="text-xs font-mono text-gray-500 dark:text-white/50">
                        ≈ {convertedSymbol}{formatCompactNumber(convertedValue)} {convertedCode}
                     </span>
                 </div>
                 
                 {/* Available Balance Indicator */}
                 <div className="mt-6 flex items-center gap-2 bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-xl border border-black/5 dark:border-white/5">
                    <Wallet size={14} className="text-gray-400 dark:text-white/40" />
                    <span className="text-sm text-gray-500 dark:text-white/50">Available:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {balanceSymbol}{formatCompactNumber(availableBalance)}
                    </span>
                 </div>
                 
                 {isInsufficient && (
                    <span className="text-red-500 text-sm font-medium mt-4 bg-red-500/10 px-3 py-1 rounded-lg animate-pulse">
                        Insufficient Balance
                    </span>
                 )}
             </div>

             {/* Narration */}
             <div className="mt-8 mb-4">
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40">
                        <FileText size={18} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="What's this for? (Optional)"
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-3 pl-10 pr-4 text-gray-900 dark:text-white text-sm outline-none focus:border-[#FF5722] transition-colors shadow-sm dark:shadow-none"
                    />
                </div>
             </div>

             <button 
                disabled={!amount || parseFloat(amount) <= 0 || isInsufficient}
                onClick={() => setStep('confirm')}
                className="w-full py-4 rounded-[24px] bg-[#FF5722] disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 dark:disabled:text-white/30 text-white font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                Review
            </button>
        </div>
    );
  };

  const renderConfirm = () => {
      const amountNum = parseFloat(amount);
      const displaySymbol = inputInBaseCurrency ? '$' : selectedCurrency.symbol;
      const amountInUSDC = inputInBaseCurrency ? amountNum : (amountNum / selectedCurrency.rate);
      
      return (
        <div className="flex flex-col h-full animate-fade-in pt-2 relative">
             <div className="flex-1 flex flex-col items-center justify-start pt-4 overflow-y-auto no-scrollbar pb-32">
                 
                 {/* 1. Recipient Identity */}
                 <div className="flex flex-col items-center mb-6">
                     <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#673AB7] p-[2px] mb-2 shadow-xl shadow-orange-500/20">
                         <img src={recipientProfile?.avatar_url || "https://picsum.photos/100"} alt="User" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-[#0f0b1e]" />
                     </div>
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white">{recipientProfile?.full_name}</h3>
                     <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 text-xs font-mono">@{recipientProfile?.username}</span>
                 </div>

                 {/* 2. Massive Amount */}
                 <div className="mb-8 text-center">
                     <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                         {displaySymbol}{formatCompactNumber(amountNum)}
                     </span>
                     {!inputInBaseCurrency && selectedCurrency.code !== 'USDC' && (
                         <div className="text-sm text-gray-400 dark:text-white/40 mt-1">
                             ≈ ${formatCompactNumber(amountInUSDC)} USDC
                         </div>
                     )}
                 </div>

                 {/* 3. Details Card - SIMPLIFIED */}
                 <div className="w-full bg-white dark:bg-white/5 rounded-[24px] p-5 border border-black/5 dark:border-white/5 shadow-sm flex flex-col gap-4">
                     
                     <div className="flex justify-between items-center">
                         <span className="text-gray-500 dark:text-white/50 text-sm">Amount</span>
                         <span className="text-gray-900 dark:text-white text-sm font-medium">
                            {displaySymbol}{formatCompactNumber(amountNum)}
                         </span>
                     </div>

                     <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>

                     <div className="flex justify-between items-center">
                         <span className="text-gray-500 dark:text-white/50 text-sm">Network Fee</span>
                         <div className="flex items-center gap-2">
                            <span className="text-gray-400 dark:text-white/30 text-xs line-through">$0.01</span>
                            <span className="text-green-600 dark:text-green-400 text-sm font-bold bg-green-500/10 px-2 py-0.5 rounded">Free</span>
                         </div>
                     </div>

                     {narration && (
                         <>
                            <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>
                            <div className="flex justify-between items-start">
                                <span className="text-gray-500 dark:text-white/50 text-sm">Note</span>
                                <span className="text-gray-900 dark:text-white text-sm text-right max-w-[150px] break-words leading-tight">{narration}</span>
                            </div>
                         </>
                     )}

                     <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>

                     <div className="flex justify-between items-center">
                         <span className="text-gray-900 dark:text-white text-sm font-bold">Total Debit</span>
                         <span className="text-gray-900 dark:text-white text-base font-black">
                             ${formatCompactNumber(amountInUSDC)}
                         </span>
                     </div>
                 </div>
             </div>

             {/* Footer Actions */}
             <div className="mt-auto pt-4 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F2F2F7] via-[#F2F2F7] to-transparent dark:from-[#0f0b1e] dark:via-[#0f0b1e] pb-0">
                {twoFAError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm text-center flex items-center justify-center gap-2 animate-pulse">
                        <AlertCircle size={16} /> {twoFAError}
                    </div>
                )}
                
                {/* 
                   SECURE FINTECH FLOW:
                   - Hold to confirm button initiates transaction
                   - If biometrics enabled: verify identity → prompt for PIN
                   - If biometrics disabled: go straight to PIN
                   - PIN is ALWAYS required and validated by backend
                */}
                <button 
                    onMouseDown={startHold}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={startHold}
                    onTouchEnd={stopHold}
                    disabled={isProcessing}
                    className="w-full h-16 rounded-[24px] bg-[#FF5722] text-white font-bold text-lg shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative overflow-hidden select-none"
                >
                    {/* Progress Fill */}
                    <div 
                        className="absolute left-0 top-0 bottom-0 bg-[#FF5722]/80 transition-all duration-75 ease-linear"
                        style={{ width: `${holdProgress}%` }}
                    />
                    
                    <span className="relative z-10 flex items-center gap-2">
                        {isProcessing ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Processing...
                            </>
                        ) : holdProgress > 0 ? (
                            <>
                                <Lock size={24} />
                                Hold to Confirm...
                            </>
                        ) : (
                            <>
                                {biometricsEnabled ? <ScanFace size={24} /> : <Lock size={24} />}
                                Hold to Send
                            </>
                        )}
                    </span>
                </button>
                
                {biometricsEnabled && (
                    <p className="text-xs text-center text-gray-500 dark:text-white/40 mt-2">
                        <Fingerprint size={12} className="inline mr-1" />
                        Biometric verification + PIN required
                    </p>
                )}
             </div>
        </div>
      );
  };

  const render2FA = () => (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in px-4">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
              <ShieldCheck size={32} className="text-[#673AB7] dark:text-[#9c7dd6]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Security Check</h2>
          <p className="text-gray-500 dark:text-white/50 text-center text-sm mb-8">
              Please enter your 4-digit transaction PIN to confirm this payment.
          </p>

          {/* Native numeric keypad input for PIN */}
          <div className="relative mb-8">
            <input 
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={twoFACode}
                onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length <= 4) setTwoFACode(val);
                }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                autoFocus
            />
            <div className="flex gap-4 justify-center">
                 {[0, 1, 2, 3].map((i) => (
                     <div 
                        key={i} 
                        className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-bold transition-all
                            ${twoFACode[i] 
                                ? 'border-[#FF5722] bg-[#FF5722] text-white shadow-lg shadow-orange-500/30' 
                                : 'border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/20 bg-white dark:bg-white/5'}`}
                     >
                         {twoFACode[i] ? '•' : ''}
                     </div>
                 ))}
            </div>
          </div>

          {twoFAError && (
                 <div className="mb-8 text-red-500 text-sm font-medium animate-pulse flex items-center gap-2">
                     <AlertCircle size={16} /> {twoFAError}
                 </div>
          )}

          <button 
            onClick={handle2FAVerify}
            disabled={isProcessing}
            className="w-full py-4 rounded-[24px] bg-[#673AB7] text-white font-bold text-lg shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center"
          >
              {isProcessing ? <Loader2 className="animate-spin" /> : 'Verify & Send'}
          </button>
      </div>
  );

  const renderSuccess = () => (
      <div className="flex flex-col items-center justify-center h-full animate-slide-up text-center px-6">
          {/* Animated Success Icon with Pulse Effect */}
          <div className="relative mb-8">
              {/* Outer pulse rings */}
              <div className="absolute inset-0 w-24 h-24 rounded-full bg-green-500/20 animate-ping"></div>
              <div className="absolute inset-0 w-24 h-24 rounded-full bg-green-500/30 animate-pulse"></div>
              
              {/* Main icon */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/50 animate-bounce">
                  <CheckCircle2 size={48} className="text-white" />
              </div>
          </div>
          
          {/* Success Message */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 animate-fade-in">
              Payment Sent! 🎉
          </h2>
          
          <p className="text-gray-500 dark:text-white/50 mb-2 text-lg">
              You sent <span className="font-bold text-green-600 dark:text-green-400">{inputInBaseCurrency ? '$' : selectedCurrency.symbol}{amount}</span>
          </p>
          
          <p className="text-gray-400 dark:text-white/40 mb-8">
              to <span className="font-semibold text-gray-900 dark:text-white">{recipientProfile?.full_name}</span>
          </p>
          
          {/* Transaction Details Card */}
          <div className="w-full max-w-sm bg-white dark:bg-white/5 rounded-2xl p-4 mb-8 border border-gray-100 dark:border-white/10">
              <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-white/50">Status</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">Completed</span>
              </div>
          </div>
          
          <button 
            onClick={onClose}
            className="px-12 py-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/30 active:scale-95"
          >
              Done
          </button>
      </div>
  );

  const renderComingSoon = (network: string) => (
    <div className="flex flex-col h-full items-center justify-center animate-fade-in text-center pb-20">
        <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6 animate-pulse">
            <Loader2 size={40} className="text-gray-400 dark:text-white/40 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Coming to {network}</h2>
        <p className="text-gray-500 dark:text-white/50 mb-8 max-w-[240px]">
            This feature is currently under development for the {network} environment.
        </p>
        <button 
            onClick={() => setStep('menu')}
            className="px-8 py-3 rounded-full bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-white/20 transition-colors shadow-sm dark:shadow-none"
        >
            Go Back
        </button>
    </div>
  );

  return (
    <div className="absolute inset-0 z-[60] bg-[#F2F2F7] dark:bg-[#0f0b1e] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center p-6 relative">
            <button 
                onClick={step === 'menu' ? onClose : () => {
                    // Back logic
                    if (step === 'recipient') setStep('menu');
                    if (step === 'amount') setStep('recipient');
                    if (step === 'confirm') setStep('amount');
                    if (step === '2fa') setStep('confirm');
                    if (step.includes('coming-soon')) setStep('menu');
                }}
                className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center active:bg-black/10 dark:active:bg-white/10 z-10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
                <X size={20} className="text-gray-900 dark:text-white" />
            </button>
            
            <h2 className="absolute left-0 right-0 text-center text-xl font-bold pointer-events-none text-gray-900 dark:text-white">
                {step === 'menu' && 'Send Money'}
                {step === 'recipient' && 'Recipient'}
                {step === 'amount' && 'Amount'}
                {step === 'confirm' && 'Review'}
                {step === '2fa' && 'Verification'}
            </h2>
        </div>

        <div className="flex-1 px-6 flex flex-col overflow-y-auto">
            {step === 'menu' && renderMenu()}
            {step === 'recipient' && renderRecipient()}
            {step === 'amount' && renderAmount()}
            {step === 'confirm' && renderConfirm()}
            {step === '2fa' && render2FA()}
            {step === 'success' && renderSuccess()}
            {step === 'crypto-coming-soon' && renderComingSoon('Testnet')}
            {step === 'bank-coming-soon' && renderComingSoon('Mainnet')}
        </div>
    </div>
  );
};

export default SendFlow;