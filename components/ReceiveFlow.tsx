import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { X, Copy, Share2, Check, AtSign, ScanLine, Bitcoin, Landmark, ArrowRight, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Currency } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ReceiveFlowProps {
  onClose: () => void;
  selectedCurrency: Currency;
}

type View = 'menu' | 'payme-id' | 'crypto-address' | 'bank-coming-soon';

const ReceiveFlow: React.FC<ReceiveFlowProps> = ({ onClose, selectedCurrency }) => {
  const { user } = useAuth();
  const [view, setView] = useState<View>('menu');
  const [copied, setCopied] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [loadingWallet, setLoadingWallet] = useState(false);
  
  const username = user?.username ? `@${user.username}` : '@user';
  const cleanUsername = user?.username || 'user';
  const payMeLink = `https://payme.io/${cleanUsername}`;
  const displayLink = `payme.io/${cleanUsername}`;

  // Fetch wallet address when user opens crypto view
  const fetchWalletAddress = async () => {
    if (walletAddress) return; // Already fetched
    
    setLoadingWallet(true);
    try {
      // User's wallet address is stored in their profile
      // It's the public key that can receive USDC on Solana
      const address = user?.walletAddress || '';
      setWalletAddress(address);
    } catch (error) {
      console.error('Failed to fetch wallet address:', error);
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleCopy = (text: string = payMeLink) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMenu = () => (
    <div className="flex flex-col gap-4 animate-fade-in pt-4">
        <h3 className="text-center text-gray-500 dark:text-white/60 mb-4">Choose Deposit Method</h3>
        
        <GlassCard onClick={() => setView('payme-id')} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] bg-white dark:bg-white/[0.03]">
            <div className="w-12 h-12 rounded-full bg-[#673AB7]/10 dark:bg-[#673AB7]/20 flex items-center justify-center">
                <ScanLine size={24} className="text-[#673AB7]" />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900 dark:text-white">PayMe ID</span>
                <span className="text-gray-500 dark:text-white/50 text-sm">QR Code & Profile Link</span>
            </div>
            <div className="flex-1" />
            <ArrowRight size={20} className="text-gray-400 dark:text-white/20" />
        </GlassCard>

        <GlassCard onClick={() => { setView('crypto-address'); fetchWalletAddress(); }} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] bg-white dark:bg-white/[0.03]">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                <Bitcoin size={24} className="text-blue-500 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900 dark:text-white">Crypto Deposit</span>
                <span className="text-gray-500 dark:text-white/50 text-sm">Receive USDC on-chain</span>
            </div>
            <div className="flex-1" />
            <ArrowRight size={20} className="text-gray-400 dark:text-white/20" />
        </GlassCard>

        <GlassCard onClick={() => setView('bank-coming-soon')} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] bg-white dark:bg-white/[0.03]">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                <Landmark size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900 dark:text-white">Bank Transfer</span>
                <span className="text-gray-500 dark:text-white/50 text-sm">Direct Deposit / Wire</span>
            </div>
            <div className="flex-1" />
            <ArrowRight size={20} className="text-gray-400 dark:text-white/20" />
        </GlassCard>
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
            onClick={() => setView('menu')}
            className="px-8 py-3 rounded-full bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-white/20 transition-colors shadow-sm dark:shadow-none"
        >
            Go Back
        </button>
    </div>
  );

  const renderCryptoAddress = () => (
    <div className="flex flex-col items-center gap-8 animate-fade-in pb-24 pt-8">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                <Bitcoin size={32} className="text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Your Wallet Address</h3>
            <p className="text-sm text-gray-500 dark:text-white/50 text-center max-w-[280px]">
                Send USDC (Solana) to this address from any wallet
            </p>
        </div>

        {loadingWallet ? (
            <div className="flex items-center gap-2 text-gray-500 dark:text-white/50">
                <Loader2 size={20} className="animate-spin" />
                <span>Loading wallet...</span>
            </div>
        ) : walletAddress ? (
            <>
                {/* QR Code */}
                <GlassCard className="w-full aspect-square max-w-[280px] flex items-center justify-center bg-white shadow-2xl shadow-blue-500/10" noPadding>
                  <div className="bg-white w-full h-full p-6 flex items-center justify-center relative overflow-hidden">
                     {/* Corner decorations */}
                     <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-[#0f0b1e] rounded-tl-3xl opacity-10"></div>
                     <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#0f0b1e] rounded-tr-3xl opacity-10"></div>
                     <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[#0f0b1e] rounded-bl-3xl opacity-10"></div>
                     <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[#0f0b1e] rounded-br-3xl opacity-10"></div>
                     
                     <img 
                       src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${walletAddress}&color=0f0b1e`} 
                       alt="Wallet QR Code" 
                       className="w-full h-full object-contain mix-blend-multiply opacity-90 z-10"
                     />
                  </div>
                </GlassCard>

                {/* Wallet Address */}
                <div className="flex flex-col gap-4 w-full">
                    <div className="text-center">
                        <p className="text-gray-400 dark:text-white/40 text-sm mb-3 font-medium tracking-wide uppercase">Solana Wallet Address</p>
                        <div 
                            onClick={() => handleCopy(walletAddress)}
                            className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 active:bg-gray-50 dark:active:bg-white/10 cursor-pointer group transition-all hover:border-black/10 dark:hover:border-white/20 shadow-sm dark:shadow-none"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                     <Bitcoin size={14} className="text-blue-500 dark:text-blue-400" />
                                </div>
                                <span className="font-mono text-sm text-gray-900 dark:text-white/90 truncate">
                                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-400 dark:text-white/40 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />}
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Important</p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 leading-relaxed">
                                    Only send USDC on Solana network to this address. Sending other tokens or using wrong network will result in permanent loss.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* External Transfer Badge */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <Bitcoin size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">External Wallet Deposits</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                                    Transfers from external wallets will show as "External Deposit" in your transaction history.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                           if (navigator.share) {
                               navigator.share({
                                   title: 'My Wallet Address',
                                   text: `Send USDC (Solana) to: ${walletAddress}`,
                               })
                           } else {
                               handleCopy(walletAddress);
                           }
                        }}
                        className="w-full py-4 rounded-[24px] bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-blue-600"
                    >
                        <Share2 size={20} />
                        Share Address
                    </button>
                </div>
            </>
        ) : (
            <div className="text-center text-gray-500 dark:text-white/50">
                <p>No wallet address found</p>
                <p className="text-sm mt-2">Please contact support</p>
            </div>
        )}
    </div>
  );

  const renderPayMeID = () => (
    <div className="flex flex-col items-center gap-8 animate-fade-in pb-24 pt-8">
        
        {/* Vanity plate. */}
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-sm dark:shadow-none">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#673AB7] p-[1px]">
                 <div className="w-full h-full rounded-full bg-[#F2F2F7] dark:bg-[#0f0b1e] flex items-center justify-center">
                    <AtSign size={16} className="text-gray-900 dark:text-white" />
                 </div>
            </div>
            <span className="font-bold text-xl tracking-wide text-gray-900 dark:text-white">{username.replace('@','')}</span>
        </div>

        {/* The money portal. */}
        <GlassCard className="w-full aspect-square max-w-[280px] flex items-center justify-center bg-white shadow-2xl shadow-purple-500/10" noPadding>
          <div className="bg-white w-full h-full p-6 flex items-center justify-center relative overflow-hidden">
             {/* CSS crimes to make it look cyberpunk. */}
             <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-[#0f0b1e] rounded-tl-3xl opacity-10"></div>
             <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#0f0b1e] rounded-tr-3xl opacity-10"></div>
             <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[#0f0b1e] rounded-bl-3xl opacity-10"></div>
             <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[#0f0b1e] rounded-br-3xl opacity-10"></div>
             
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${payMeLink}&color=0f0b1e`} 
               alt="QR Code" 
               className="w-full h-full object-contain mix-blend-multiply opacity-90 z-10"
             />
          </div>
        </GlassCard>

        {/* Link & Actions */}
        <div className="flex flex-col gap-4 w-full">
            <div className="text-center">
                <p className="text-gray-400 dark:text-white/40 text-sm mb-3 font-medium tracking-wide uppercase">Your PayMe Link</p>
                <div 
                    onClick={handleCopy}
                    className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 active:bg-gray-50 dark:active:bg-white/10 cursor-pointer group transition-all hover:border-black/10 dark:hover:border-white/20 shadow-sm dark:shadow-none"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#673AB7]/10 dark:bg-[#673AB7]/20 flex items-center justify-center">
                             <LinkIcon size={14} className="text-[#673AB7]" />
                        </div>
                        <span className="font-medium text-lg text-gray-900 dark:text-white/90 tracking-wide">{displayLink}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-400 dark:text-white/40 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />}
                    </div>
                </div>
            </div>

            <button 
                onClick={() => {
                   if (navigator.share) {
                       navigator.share({
                           title: 'PayMe Protocol',
                           text: `Pay me on PayMe Protocol! ${payMeLink} (Accepted: ${selectedCurrency.code})`,
                           url: payMeLink
                       })
                   } else {
                       handleCopy();
                   }
                }}
                className="w-full py-4 rounded-[24px] bg-[#FF5722] text-white font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-[#e64a19]"
            >
                <Share2 size={20} />
                Share Profile
            </button>
        </div>
    </div>
  );

  return (
    <div className="absolute inset-0 z-[60] bg-[#F2F2F7] dark:bg-[#0f0b1e] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center p-6 relative">
            <button 
                onClick={view === 'menu' ? onClose : () => setView('menu')}
                className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center active:bg-black/10 dark:active:bg-white/10 z-10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
                <X size={20} className="text-gray-900 dark:text-white" />
            </button>
            
            <h2 className="absolute left-0 right-0 text-center text-xl font-bold pointer-events-none text-gray-900 dark:text-white">
                {view === 'menu' && 'Receive'}
                {view === 'payme-id' && 'PayMe ID'}
                {view === 'crypto-address' && 'Crypto Deposit'}
                {view.includes('coming-soon') && 'Coming Soon'}
            </h2>
        </div>

        <div className="flex-1 px-6 flex flex-col overflow-y-auto">
            {view === 'menu' && renderMenu()}
            {view === 'payme-id' && renderPayMeID()}
            {view === 'crypto-address' && renderCryptoAddress()}
            {view === 'bank-coming-soon' && renderComingSoon('Mainnet')}
        </div>
    </div>
  );
};

export default ReceiveFlow;