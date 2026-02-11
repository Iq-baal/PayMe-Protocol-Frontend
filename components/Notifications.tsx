import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, ShieldAlert, CheckCircle, Info, Loader2, RefreshCcw, X, Smartphone, User, ArrowRight, Wallet, Landmark, Zap, PartyPopper } from 'lucide-react';
import { Notification, Currency } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import PullToRefresh from './PullToRefresh';
import GlassCard from './GlassCard';

interface GroupedNotifications {
    title: string;
    items: Notification[];
}

interface NotificationsProps {
    selectedCurrency?: Currency;
}

const DEFAULT_CURRENCY: Currency = { code: 'USDC', name: 'USDC', symbol: '$', rate: 1, flag: '🇺🇸' };

const Notifications: React.FC<NotificationsProps> = ({ selectedCurrency = DEFAULT_CURRENCY }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Persistent Read State (Local)
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
      const saved = localStorage.getItem('payme_read_notifications');
      return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
      localStorage.setItem('payme_read_notifications', JSON.stringify(Array.from(readNotificationIds)));
  }, [readNotificationIds]);

  // Helper to format currency
  const formatAmount = (amountUSDC: number) => {
      const val = amountUSDC * selectedCurrency.rate;
      if (val >= 1000000) {
          return new Intl.NumberFormat('en-US', { 
              notation: "compact", 
              maximumFractionDigits: 1,
              minimumFractionDigits: 0
          }).format(val);
      }
      return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);

    try {
        const response = await apiClient.getNotifications(user.id);
        
        if (response.success && response.data) {
            setNotifications(response.data);
        } else {
            setNotifications([]);
        }
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
    } finally {
        setLoading(false);
    }
  };

  // Re-fetch when currency changes to update the numbers
  useEffect(() => {
    fetchNotifications();
  }, [user, readNotificationIds, selectedCurrency]);
  
  const getIcon = (type: Notification['type'], title: string = '', iconSize: number = 24) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('update')) return <Smartphone size={iconSize} className="text-white" />;
    if (lowerTitle.includes('welcome') || lowerTitle.includes('bonus')) return <PartyPopper size={iconSize} className="text-white" />;
    if (lowerTitle.includes('security') || lowerTitle.includes('login')) return <ShieldAlert size={iconSize} className="text-white" />;
    if (lowerTitle.includes('bank') || lowerTitle.includes('withdrawal')) return <Landmark size={iconSize} className="text-white" />;
    if (lowerTitle.includes('wallet')) return <Wallet size={iconSize} className="text-white" />;
    if (lowerTitle.includes('received')) return <ArrowRight size={iconSize} className="text-white rotate-90" />;
    if (lowerTitle.includes('sent')) return <ArrowRight size={iconSize} className="text-white -rotate-90" />;

    switch (type) {
        case 'alert': return <ShieldAlert size={iconSize} className="text-white" />;
        case 'success': return <CheckCircle size={iconSize} className="text-white" />;
        case 'info': return <Info size={iconSize} className="text-white" />;
        default: return <Info size={iconSize} className="text-white" />;
    }
  };

  const getIconBg = (type: Notification['type'], title: string = '') => {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('update')) return 'bg-gradient-to-tr from-[#673AB7] to-purple-400';
      if (lowerTitle.includes('welcome') || lowerTitle.includes('bonus')) return 'bg-gradient-to-tr from-pink-500 to-rose-400';
      if (lowerTitle.includes('security') || lowerTitle.includes('login')) return 'bg-gradient-to-tr from-red-500 to-orange-500';
      if (lowerTitle.includes('bank')) return 'bg-gradient-to-tr from-emerald-500 to-teal-400';
      if (lowerTitle.includes('received')) return 'bg-gradient-to-tr from-green-500 to-emerald-400';
      if (lowerTitle.includes('sent')) return 'bg-gradient-to-tr from-gray-700 to-gray-500';

      switch (type) {
        case 'alert': return 'bg-gradient-to-tr from-red-500 to-orange-500';
        case 'success': return 'bg-gradient-to-tr from-green-500 to-emerald-400';
        case 'info': return 'bg-gradient-to-tr from-blue-500 to-cyan-400';
      }
  }

  const handleNotificationClick = async (note: Notification) => {
      setSelectedNotification(note);
      
      if (!note.read) {
          setReadNotificationIds(prev => {
              const newSet = new Set(prev);
              newSet.add(note.id);
              return newSet;
          });

          setNotifications(prev => prev.map(n => n.id === note.id ? { ...n, read: true } : n));
          
          // Mark as read on backend
          if (!note.id.startsWith('tx-') && !note.id.startsWith('sys-')) {
              await apiClient.markNotificationRead(note.id);
          }
      }
  };

  const groupNotifications = (notifs: Notification[]): GroupedNotifications[] => {
      const today = new Date().setHours(0,0,0,0);
      const yesterday = new Date(Date.now() - 86400000).setHours(0,0,0,0);
      
      const groups: GroupedNotifications[] = [
          { title: 'Today', items: [] },
          { title: 'Yesterday', items: [] },
          { title: 'Earlier', items: [] }
      ];

      notifs.forEach(n => {
          const nDate = new Date(n.timestamp || 0).setHours(0,0,0,0);
          if (nDate === today) {
              groups[0].items.push(n);
          } else if (nDate === yesterday) {
              groups[1].items.push(n);
          } else {
              groups[2].items.push(n);
          }
      });

      return groups.filter(g => g.items.length > 0);
  };

  const grouped = groupNotifications(notifications);

  return (
    <>
    <PullToRefresh onRefresh={async () => await fetchNotifications()} className="px-4 pt-4 pb-32 h-full">
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center px-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                <button 
                    onClick={fetchNotifications}
                    className="p-2 rounded-full bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none border border-black/5 dark:border-transparent"
                >
                    {loading ? <Loader2 size={20} className="animate-spin text-gray-600 dark:text-white/80" /> : <RefreshCcw size={20} className="text-gray-600 dark:text-white/80" />}
                </button>
            </div>

            {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <Loader2 size={40} className="animate-spin text-gray-400 mb-4" />
                    <p className="text-gray-500">Loading updates...</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50 text-center">
                    <Bell size={48} className="text-gray-300 dark:text-white/20 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nothing to see here...</h3>
                    <p className="text-gray-500 dark:text-white/50">Your notifications will appear here.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {grouped.map((group) => (
                        <div key={group.title} className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider px-2">{group.title}</h3>
                            {group.items.map(note => (
                                <div 
                                    key={note.id} 
                                    onClick={() => handleNotificationClick(note)}
                                    className={`p-4 rounded-[24px] relative overflow-hidden transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer
                                        ${note.read 
                                            ? 'bg-transparent border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5' 
                                            : 'bg-white dark:bg-[#1c1c1e] shadow-lg shadow-black/5 dark:shadow-black/20 border border-transparent'} 
                                        flex gap-4 items-start group`}
                                >
                                    {!note.read && (
                                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#FF5722] shadow-[0_0_10px_#FF5722]"></div>
                                    )}

                                    <div className={`mt-0 flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${getIconBg(note.type, note.title)} ${note.read ? 'opacity-80 grayscale-[0.5]' : ''}`}>
                                        {getIcon(note.type, note.title)}
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                        <div className="flex justify-between items-start pr-4">
                                            <h3 className={`font-bold text-sm sm:text-base leading-tight ${note.read ? 'text-gray-600 dark:text-white/60' : 'text-gray-900 dark:text-white'}`}>
                                                {note.title}
                                            </h3>
                                        </div>
                                        <p className={`text-xs sm:text-sm leading-relaxed line-clamp-2 ${note.read ? 'text-gray-400 dark:text-white/40' : 'text-gray-600 dark:text-white/80'}`}>
                                            {note.message}
                                        </p>
                                        <span className="text-[10px] text-gray-400 dark:text-white/30 font-medium mt-1">{note.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    </PullToRefresh>

    {selectedNotification && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNotification(null)}></div>
           
           <div className="relative w-full max-w-md bg-[#F2F2F7] dark:bg-[#0f0b1e] rounded-t-[32px] sm:rounded-[32px] p-6 animate-slide-up flex flex-col gap-6 max-h-[90vh] overflow-y-auto shadow-2xl">
               <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white">Details</h2>
                   <button onClick={() => setSelectedNotification(null)} className="p-2 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">
                       <X size={20} className="text-gray-900 dark:text-white" />
                   </button>
               </div>

               <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[32px] shadow-sm border border-black/5 dark:border-white/5 flex flex-col items-center text-center gap-6">
                   <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-2 shadow-lg ${getIconBg(selectedNotification.type, selectedNotification.title)}`}>
                        {getIcon(selectedNotification.type, selectedNotification.title, 40)}
                   </div>
                   
                   <div className="flex flex-col gap-2">
                       <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                           {selectedNotification.title}
                       </h3>
                       <span className="text-sm text-gray-400 dark:text-white/40 font-medium">
                           {selectedNotification.time}
                       </span>
                   </div>

                   <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>

                   <p className="text-base text-gray-600 dark:text-white/70 leading-relaxed">
                       {selectedNotification.message}
                   </p>

                   {selectedNotification.title.includes('Update') && (
                       <div className="mt-2 px-4 py-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-600 dark:text-purple-400 text-sm font-semibold">
                           Latest Version Installed
                       </div>
                   )}
               </div>
               
               <button 
                onClick={() => setSelectedNotification(null)}
                className="w-full py-4 rounded-[24px] bg-[#FF5722] text-white font-bold text-lg shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
               >
                   Done
               </button>
           </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Notifications;