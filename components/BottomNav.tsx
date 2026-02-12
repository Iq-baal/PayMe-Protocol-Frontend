import React from 'react';
import { Home, Bell, Activity, Settings, Store } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  hasUnread?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, hasUnread = false }) => {
  
  const getIconClass = (tab: AppTab) => {
    return activeTab === tab ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/40';
  };

  const getStrokeWidth = (tab: AppTab) => {
    return activeTab === tab ? 2.5 : 2;
  }

  return (
    <div className="h-20 rounded-[40px] glass-panel flex items-center justify-around px-2 shadow-2xl backdrop-blur-2xl border border-black/5 dark:border-white/10 w-full pointer-events-auto bg-white/80 dark:bg-black/20">
      
      {/* Home - because that's where the money lives */}
      <button 
        onClick={() => onTabChange(AppTab.HOME)}
        className="flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300 active:scale-90"
      >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${activeTab === AppTab.HOME ? 'bg-black/5 dark:bg-white/10' : ''}`}>
           <Home size={24} className={getIconClass(AppTab.HOME)} strokeWidth={getStrokeWidth(AppTab.HOME)} />
        </div>
      </button>

      {/* Notifications - for when people actually send you money */}
      <button 
        onClick={() => onTabChange(AppTab.NOTIFICATIONS)}
        className="flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300 active:scale-90"
      >
        <div className="relative">
          <div className={`p-2 rounded-2xl transition-all duration-300 ${activeTab === AppTab.NOTIFICATIONS ? 'bg-black/5 dark:bg-white/10' : ''}`}>
             <Bell size={24} className={getIconClass(AppTab.NOTIFICATIONS)} strokeWidth={getStrokeWidth(AppTab.NOTIFICATIONS)} />
          </div>
          {hasUnread && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF5722] rounded-full border-2 border-[#F2F2F7] dark:border-[#0f0b1e] animate-pulse"></span>
          )}
        </div>
      </button>

      {/* Merchant - coming soon to mainnet, patience young grasshopper */}
      <button 
        onClick={() => onTabChange(AppTab.MERCHANT)}
        className="flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300 active:scale-90"
      >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${activeTab === AppTab.MERCHANT ? 'bg-black/5 dark:bg-white/10' : ''}`}>
          <Store size={24} className={getIconClass(AppTab.MERCHANT)} strokeWidth={getStrokeWidth(AppTab.MERCHANT)} />
        </div>
      </button>

      {/* Network - pretending we care about blockchain stats */}
      <button 
        onClick={() => onTabChange(AppTab.NETWORK)}
        className="flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300 active:scale-90"
      >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${activeTab === AppTab.NETWORK ? 'bg-black/5 dark:bg-white/10' : ''}`}>
          <Activity size={24} className={getIconClass(AppTab.NETWORK)} strokeWidth={getStrokeWidth(AppTab.NETWORK)} />
        </div>
      </button>

      {/* Settings - where dreams of customization go to die */}
      <button 
        onClick={() => onTabChange(AppTab.SETTINGS)}
        className="flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300 active:scale-90"
      >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${activeTab === AppTab.SETTINGS ? 'bg-black/5 dark:bg-white/10' : ''}`}>
           <Settings size={24} className={getIconClass(AppTab.SETTINGS)} strokeWidth={getStrokeWidth(AppTab.SETTINGS)} />
        </div>
      </button>

    </div>
  );
};

export default BottomNav;