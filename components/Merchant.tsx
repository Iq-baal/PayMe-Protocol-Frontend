import React from 'react';
import { Store, Rocket, Lock } from 'lucide-react';
import GlassCard from './GlassCard';

const Merchant: React.FC = () => {
  return (
    <div className="h-full flex flex-col px-4 pt-8 pb-24">
      {/* Header - keeping it simple because I'm tired */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF5722] to-[#673AB7] flex items-center justify-center mb-4 shadow-2xl shadow-purple-500/30">
          <Store size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Merchant Hub</h1>
        <p className="text-gray-500 dark:text-white/50 text-center max-w-[280px]">
          Accept payments, manage your business, and grow your revenue
        </p>
      </div>

      {/* Coming Soon Card - because we're not ready yet, obviously */}
      <GlassCard className="p-8 text-center bg-white dark:bg-white/5 mb-6">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
          <Rocket size={32} className="text-[#673AB7] dark:text-[#9c7dd6]" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Coming to Mainnet
        </h2>
        
        <p className="text-gray-500 dark:text-white/50 mb-6 leading-relaxed">
          Merchant features will be available when we launch on mainnet. Get ready to accept USDC payments from customers worldwide.
        </p>

        {/* Feature List - so users know what they're waiting for */}
        <div className="flex flex-col gap-3 text-left">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Payment Links</h3>
              <p className="text-xs text-gray-500 dark:text-white/50">Generate shareable payment links</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">QR Codes</h3>
              <p className="text-xs text-gray-500 dark:text-white/50">Accept in-person payments instantly</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Analytics Dashboard</h3>
              <p className="text-xs text-gray-500 dark:text-white/50">Track sales and revenue in real-time</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Multi-Currency</h3>
              <p className="text-xs text-gray-500 dark:text-white/50">Accept payments in any currency</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Mainnet Notice - just so they know we're serious */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
        <Lock size={20} className="text-[#FF5722] flex-shrink-0" />
        <p className="text-sm text-gray-700 dark:text-white/70">
          <span className="font-bold">Mainnet Launch:</span> Merchant features require mainnet deployment for security and compliance.
        </p>
      </div>
    </div>
  );
};

export default Merchant;
