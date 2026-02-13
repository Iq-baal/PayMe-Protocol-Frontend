import React, { useState, useRef, useEffect } from 'react';
import GlassCard from './GlassCard';
import { 
  User, Shield, Smartphone, HelpCircle, LogOut, ChevronRight, ChevronLeft, 
  Moon, Sun, CheckCircle as CheckCircleIcon, Lock, Fingerprint, Mail, AtSign, MessageCircle, 
  ChevronDown, Search, KeyRound, Eye, Banknote, RefreshCcw, Camera, Save, X, Link as LinkIcon, Image as ImageIcon,
  FileText, Info, ExternalLink, Download, Briefcase, ScanFace, Scale, Check, Key, Trash2, AlertTriangle, Loader2
} from 'lucide-react';
import { Currency, Theme } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import AnimatedBalance from './AnimatedBalance';
import { registerBiometrics, isBiometricsSupported } from '../utils/biometrics';

export type SettingsView = 'main' | 'account' | 'security' | 'appearance' | 'help' | 'currency' | 'privacy' | 'terms' | 'change-pin' | 'export-wallet' | 'delete-account';

interface SettingsProps {
  initialView?: SettingsView;
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  availableCurrencies: Currency[];
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const Settings: React.FC<SettingsProps> = ({ initialView = 'main', selectedCurrency, onCurrencyChange, availableCurrencies, theme, onThemeChange }) => {
  const [currentView, setCurrentView] = useState<SettingsView>(initialView);
  const { signOut, user, updateProfile } = useAuth();
  
  // Account Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editOccupation, setEditOccupation] = useState(user?.occupation || '');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(user?.avatar_url || '');

  // PIN Changing State
  const [pinStep, setPinStep] = useState<'enter' | 'confirm' | 'success'>('enter');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Export Wallet State
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [exportPin, setExportPin] = useState('');
  const [privateKeyData, setPrivateKeyData] = useState<string>('');
  const [exportError, setExportError] = useState('');

  // Delete Account State
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'verify-pin' | 'processing' | 'success'>('confirm');
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Settings States
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [biometricsPaymentEnabled, setBiometricsPaymentEnabled] = useState(false);
  
  // Computed Settings
  // Discoverability is ON by default (if null/undefined, treat as true)
  const isDiscoverable = user?.is_discoverable !== false;

  // Load local settings on mount
  useEffect(() => {
      setFaceIdEnabled(localStorage.getItem('payme_face_id_enabled') === 'true');
      setBiometricsPaymentEnabled(localStorage.getItem('payme_biometrics_payment_enabled') === 'true');
  }, []);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Capture the install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const sendNotification = async (title: string, message: string, type: 'info' | 'success' | 'alert' = 'info') => {
      if (!user) return;
      try {
          // TODO: Add notification creation endpoint
          console.log('Notification:', title, message, type);
      } catch (e) {
          console.error('Failed to send notification', e);
      }
  };

  const handleUnderDevelopment = (featureName: string) => {
      alert(`"${featureName}" is currently under development.`);
  };

  // --- PIN Logic ---
  const handlePinSubmit = async () => {
      if (pinStep === 'enter') {
          if (newPin.length < 4) {
              setPinError('PIN must be 4 digits');
              return;
          }
          setPinStep('confirm');
          setPinError('');
      } else if (pinStep === 'confirm') {
          if (newPin !== confirmPin) {
              setPinError('PINs do not match');
              setConfirmPin('');
              setPinStep('enter'); // Reset
              setNewPin('');
              return;
          }
          
          // Save PIN
          const { error } = await updateProfile({ transaction_pin: newPin });
          if (!error) {
              setPinStep('success');
              sendNotification('Security Update', 'Your transaction PIN has been updated.', 'success');
              setTimeout(() => {
                  setNewPin('');
                  setConfirmPin('');
                  setPinStep('enter');
                  setCurrentView('security');
              }, 1500);
          } else {
              setPinError('Failed to update PIN');
          }
      }
  }

  // --- Setting Toggles ---

  const handleExportWallet = async () => {
      if (!exportPin || exportPin.length !== 4) {
          setExportError('Please enter your 4-digit PIN');
          return;
      }

      try {
          // Verify PIN and get private key from backend
          const response = await apiClient.exportWallet(exportPin);
          
          if (response.success && response.data) {
              setPrivateKeyData(response.data.privateKey);
              setShowPrivateKey(true);
              setExportError('');
          } else {
              setExportError(response.error || 'Failed to export wallet. Incorrect PIN.');
              setExportPin('');
          }
      } catch (error) {
          setExportError('Failed to export wallet. Please try again.');
          setExportPin('');
      }
  };

  const handleDeleteAccount = async () => {
      if (deleteStep === 'confirm') {
          if (deleteConfirmText.toLowerCase() !== 'delete') {
              setDeleteError('Please type "delete" to confirm');
              return;
          }
          setDeleteStep('verify-pin');
          setDeleteError('');
      } else if (deleteStep === 'verify-pin') {
          if (!deletePin || deletePin.length !== 4) {
              setDeleteError('Please enter your 4-digit PIN');
              return;
          }

          setDeleteStep('processing');
          
          try {
              // Call backend to disable account (30-day grace period)
              const response = await apiClient.deleteAccount(deletePin);
              
              if (response.success) {
                  setDeleteStep('success');
                  // Sign out after 3 seconds
                  setTimeout(() => {
                      signOut();
                  }, 3000);
              } else {
                  setDeleteError(response.error || 'Failed to delete account. Incorrect PIN.');
                  setDeletePin('');
                  setDeleteStep('verify-pin');
              }
          } catch (error) {
              setDeleteError('Failed to delete account. Please try again.');
              setDeletePin('');
              setDeleteStep('verify-pin');
          }
      }
  };

  const toggleFaceId = async () => {
      if (!faceIdEnabled) {
          // Check for support first
          const supported = await isBiometricsSupported();
          if (!supported) {
              alert("Biometrics are not available or not configured on this device.");
              return;
          }

          // Enabling: Require biometric registration
          const success = await registerBiometrics();
          if (!success) {
              alert("Biometric setup failed or was cancelled.");
              return;
          }
      }
      const newState = !faceIdEnabled;
      setFaceIdEnabled(newState);
      localStorage.setItem('payme_face_id_enabled', String(newState));
      if (newState) {
          sendNotification('Security Update', 'Face ID Login has been enabled.', 'info');
      }
  };

  const toggleBiometricsPayment = async () => {
      if (!biometricsPaymentEnabled) {
          // Check for support first
          const supported = await isBiometricsSupported();
          if (!supported) {
              alert("Biometrics are not available or not configured on this device.");
              return;
          }

          // Enabling: Require biometric registration
          const success = await registerBiometrics();
          if (!success) {
              alert("Biometric setup failed or was cancelled.");
              return;
          }
      }
      const newState = !biometricsPaymentEnabled;
      setBiometricsPaymentEnabled(newState);
      localStorage.setItem('payme_biometrics_payment_enabled', String(newState));
      if (newState) {
          sendNotification('Security Update', 'Biometric verification enabled for payments.', 'success');
      }
  };

  const toggle2FA = async () => {
      if (!user) return;
      
      // Check if user has transaction_pin set (not just checking is_2fa_enabled)
      // PIN should be set during onboarding, but let's verify
      const hasPIN = user.transaction_pin !== null && user.transaction_pin !== undefined && user.transaction_pin !== '';
      
      if (!user.is_2fa_enabled && !hasPIN) {
          alert("Please set a Transaction PIN first.");
          setCurrentView('change-pin');
          return;
      }

      const newState = !user.is_2fa_enabled;
      
      // Optimistic update handled by updateProfile re-fetch
      const { error } = await updateProfile({ is_2fa_enabled: newState });
      
      if (!error) {
          if (newState) sendNotification('Security Update', '2-Factor Authentication is now enabled for transactions.', 'success');
      } else {
          alert("Failed to update 2FA setting");
      }
  };

  const toggleDiscovery = async () => {
      if (!user) return;
      // We toggle based on the computed 'isDiscoverable' which defaults to true
      const newState = !isDiscoverable;
      
      const { error } = await updateProfile({ is_discoverable: newState });
      
      if (error) {
          alert("Failed to update discovery setting");
      }
  };

  // --- File Upload ---

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 150 * 1024) {
          alert("Image is too large. Please upload an image smaller than 150KB.");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setTempAvatar(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAvatar = async () => {
      const { error } = await updateProfile({ avatar_url: tempAvatar });
      if (!error) {
          setIsEditingAvatar(false);
          await sendNotification('Profile Updated', 'Your profile picture has been updated successfully.', 'success');
      } else {
          alert("Failed to update profile picture.");
      }
  };

  const saveProfileDetails = async () => {
      const { error } = await updateProfile({ 
          full_name: editName,
          occupation: editOccupation
      });

      if (!error) {
          setIsEditing(false);
          await sendNotification('Profile Updated', 'Your account details have been updated.', 'success');
      } else {
          alert('Failed to update details');
      }
  };

  // --- RENDERERS ---

  const renderHeader = (title: string, onBack?: () => void) => (
    <div className="flex items-center gap-4 mb-6 px-2">
      <button 
        onClick={onBack || (() => setCurrentView('main'))}
        className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-90"
      >
        <ChevronLeft size={20} className="text-gray-900 dark:text-white" />
      </button>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
    </div>
  );

  const renderMainView = () => {
    const settingItems = [
        { id: 'currency', icon: <Banknote size={20} />, label: 'Currency', color: 'text-blue-500 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-400/20' },
        { id: 'security', icon: <Shield size={20} />, label: 'Security & Privacy', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-400/20' },
        { id: 'appearance', icon: <Smartphone size={20} />, label: 'App Appearance', color: 'text-[#673AB7]', bgColor: 'bg-[#673AB7]/20' },
        { id: 'help', icon: <HelpCircle size={20} />, label: 'Help & Support', color: 'text-pink-500 dark:text-pink-400', bgColor: 'bg-pink-100 dark:bg-pink-400/20' },
    ];

    const hasAvatar = !!user?.avatar_url;
    const initial = user?.full_name ? user.full_name[0].toUpperCase() : 'U';

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="px-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>

            {/* Profile Card */}
            <GlassCard onClick={() => setCurrentView('account')} className="flex items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98]">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#673AB7] p-[2px]">
                    {hasAvatar ? (
                         <img src={user.avatar_url!} alt="User" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-[#0f0b1e]" />
                    ) : (
                         <div className="w-full h-full rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center border-2 border-white dark:border-[#0f0b1e]">
                             <span className="text-xl font-bold text-gray-500 dark:text-white/50">{initial}</span>
                         </div>
                    )}
                </div>
                <div className="flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{user?.full_name || 'PayMe User'}</h3>
                    <p className="text-gray-500 dark:text-white/50 text-sm">{user?.occupation || 'No Occupation Set'}</p>
                    <span className="inline-flex items-center gap-1 text-[#FF5722] text-xs font-medium mt-1">
                        Verified User
                    </span>
                </div>
                <ChevronRight size={20} className="text-gray-400 dark:text-white/20" />
            </GlassCard>

            {/* Settings List */}
            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 ml-2 uppercase tracking-wider">General</h3>
                {settingItems.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => setCurrentView(item.id as SettingsView)}
                        className="flex items-center justify-between p-4 rounded-[24px] bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 active:bg-gray-100 dark:active:bg-white/10 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm dark:shadow-none"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center ${item.color}`}>
                                {item.icon}
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-medium text-gray-900 dark:text-white/90">{item.label}</span>
                                {item.id === 'currency' && (
                                    <span className="text-xs text-gray-500 dark:text-white/50">{selectedCurrency.flag} {selectedCurrency.code}</span>
                                )}
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-400 dark:text-white/20" />
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 mt-2">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 ml-2 uppercase tracking-wider">System</h3>
                
                {deferredPrompt && (
                    <div 
                        onClick={handleInstallClick}
                        className="flex items-center justify-between p-4 rounded-[24px] bg-gradient-to-r from-[#FF5722]/10 to-[#673AB7]/10 border border-[#FF5722]/20 cursor-pointer hover:bg-white/10 shadow-sm dark:shadow-none transition-colors active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#FF5722] flex items-center justify-center text-white">
                                <Download size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-900 dark:text-white/90">Install App</span>
                                <span className="text-xs text-[#FF5722] font-medium">Add to Home Screen</span>
                            </div>
                        </div>
                    </div>
                )}

                <div 
                    onClick={() => signOut()}
                    className="flex items-center justify-between p-4 rounded-[24px] bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm dark:shadow-none transition-colors active:bg-gray-100 dark:active:bg-white/10"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-white">
                            <LogOut size={20} />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white/90">Log Out</span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-white/30">v1.2.1</span>
                </div>
            </div>
        </div>
    );
  };

  const renderCurrency = () => (
    <div className="animate-fade-in flex flex-col gap-6">
        {renderHeader('Display Currency')}
        
        <GlassCard noPadding className="flex flex-col">
            {availableCurrencies.map((currency, i, arr) => (
                <div 
                    key={currency.code}
                    onClick={() => onCurrencyChange(currency)}
                    className={`p-5 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors ${i !== arr.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''}`}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-2xl">{currency.flag}</span>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white/90">{currency.name}</span>
                            <span className="text-xs text-gray-500 dark:text-white/40">
                                {currency.code} • {currency.symbol}
                                {currency.code !== 'USD' && currency.code !== 'USDC' && ` • 1 USDC ≈ ${currency.rate.toLocaleString()}`}
                            </span>
                        </div>
                    </div>
                    {selectedCurrency.code === currency.code && (
                        <CheckCircleIcon size={20} className="text-[#FF5722]" />
                    )}
                </div>
            ))}
        </GlassCard>
    </div>
  );

  const renderAccountInfo = () => {
    const hasAvatar = !!user?.avatar_url;
    const initial = user?.full_name ? user.full_name[0].toUpperCase() : 'U';
    
    return (
    <div className="animate-fade-in flex flex-col gap-6">
        <div className="flex items-center justify-between mb-4 px-2">
             <div className="flex items-center gap-4">
                 <button 
                    onClick={() => setCurrentView('main')}
                    className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-90"
                >
                    <ChevronLeft size={20} className="text-gray-900 dark:text-white" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Info</h1>
             </div>
             
             <button 
                onClick={() => {
                    if (isEditing) {
                        saveProfileDetails();
                    } else {
                        setEditName(user?.full_name || '');
                        setEditOccupation(user?.occupation || '');
                        setIsEditing(true);
                    }
                }}
                className="text-[#FF5722] font-semibold text-sm px-3 py-1 rounded-full hover:bg-[#FF5722]/10 transition-colors"
             >
                {isEditing ? 'Save' : 'Edit'}
             </button>
        </div>

        <div className="flex flex-col items-center mb-4 transition-all">
            <div className="relative group">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#673AB7] p-1 mb-4 shadow-2xl shadow-purple-500/20">
                     {isEditingAvatar ? (
                        <img src={tempAvatar} alt="User" className="w-full h-full rounded-full object-cover border-4 border-[#F2F2F7] dark:border-[#0f0b1e]" />
                     ) : hasAvatar ? (
                        <img src={user!.avatar_url!} alt="User" className="w-full h-full rounded-full object-cover border-4 border-[#F2F2F7] dark:border-[#0f0b1e]" />
                     ) : (
                        <div className="w-full h-full rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center border-4 border-[#F2F2F7] dark:border-[#0f0b1e]">
                             <span className="text-4xl font-bold text-gray-500 dark:text-white/50">{initial}</span>
                        </div>
                     )}
                </div>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
            />

            {isEditingAvatar ? (
                <div className="flex flex-col items-center gap-3 w-full max-w-xs animate-fade-in">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                    >
                        <ImageIcon size={18} /> Upload from Gallery
                    </button>

                    <div className="flex gap-2 w-full">
                        <button 
                            onClick={() => setIsEditingAvatar(false)}
                            className="flex-1 py-2 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white text-sm font-semibold"
                        >
                            Cancel
                        </button>
                         <button 
                            onClick={saveAvatar}
                            className="flex-1 py-2 rounded-xl bg-[#FF5722] text-white text-sm font-semibold shadow-lg shadow-orange-500/20"
                        >
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => {
                        setTempAvatar(user?.avatar_url || '');
                        setIsEditingAvatar(true);
                    }}
                    className="text-[#FF5722] text-sm font-semibold hover:text-orange-600 transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[#FF5722]/10"
                >
                    <Camera size={16} /> Change Profile Photo
                </button>
            )}
        </div>

        <GlassCard className="flex flex-col gap-0" noPadding>
             <div className="p-5 flex items-center justify-between border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-4 w-full">
                    <div className="text-gray-400 dark:text-white/40"><User size={18} /></div>
                    <div className="flex flex-col w-full">
                        <span className="text-xs text-gray-500 dark:text-white/40">Full Name</span>
                        {isEditing ? (
                            <input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="font-medium text-gray-900 dark:text-white bg-transparent border-b border-[#FF5722] focus:outline-none py-1 w-full"
                                placeholder="Enter full name"
                            />
                        ) : (
                            <span className="font-medium text-gray-900 dark:text-white">{user?.full_name || 'Not set'}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-5 flex items-center justify-between border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-4 w-full">
                    <div className="text-gray-400 dark:text-white/40"><Briefcase size={18} /></div>
                    <div className="flex flex-col w-full">
                        <span className="text-xs text-gray-500 dark:text-white/40">Occupation</span>
                        {isEditing ? (
                            <input 
                                type="text" 
                                value={editOccupation}
                                onChange={(e) => setEditOccupation(e.target.value)}
                                className="font-medium text-gray-900 dark:text-white bg-transparent border-b border-[#FF5722] focus:outline-none py-1 w-full"
                                placeholder="e.g. Designer, Engineer"
                            />
                        ) : (
                            <span className="font-medium text-gray-900 dark:text-white">{user?.occupation || 'Not set'}</span>
                        )}
                    </div>
                </div>
            </div>

            {[
                { label: 'PayMe ID', value: '@' + (user?.username || 'claim_now'), icon: <AtSign size={18} /> },
                { label: 'Email', value: user?.email || '', icon: <Mail size={18} /> },
            ].map((item, i, arr) => (
                <div key={i} className={`p-5 flex items-center justify-between ${i !== arr.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''}`}>
                    <div className="flex items-center gap-4">
                        <div className="text-gray-400 dark:text-white/40">{item.icon}</div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-white/40">{item.label}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                        </div>
                    </div>
                </div>
            ))}
        </GlassCard>
    </div>
  )};

  const renderChangePin = () => (
      <div className="animate-fade-in flex flex-col gap-6 h-full relative">
          {renderHeader('Change PIN', () => setCurrentView('security'))}

          <div className="flex flex-col items-center justify-center flex-1 pb-20">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                  <KeyRound size={32} className="text-blue-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {pinStep === 'success' ? 'Success!' : pinStep === 'confirm' ? 'Confirm PIN' : 'Enter New PIN'}
              </h2>
              <p className="text-gray-500 dark:text-white/50 text-center text-sm mb-8 px-8">
                  {pinStep === 'success' 
                    ? 'Your transaction PIN has been updated.' 
                    : pinStep === 'confirm' 
                    ? 'Re-enter your 4-digit PIN to confirm.' 
                    : 'Create a 4-digit PIN for securing transactions.'}
              </p>

              {pinStep === 'success' ? (
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
                      <Check size={32} className="text-white" />
                  </div>
              ) : (
                  <>
                      {/* Native Numeric Input Overlay */}
                      <div className="relative mb-8">
                        <input 
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={pinStep === 'enter' ? newPin : confirmPin}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                if (pinStep === 'enter') setNewPin(val);
                                else setConfirmPin(val);
                            }}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            autoFocus
                        />
                        <div className="flex gap-4 justify-center">
                            {[0, 1, 2, 3].map((i) => {
                                const val = pinStep === 'enter' ? newPin : confirmPin;
                                return (
                                    <div 
                                        key={i} 
                                        className={`w-12 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all
                                            ${val[i] 
                                                ? 'border-[#FF5722] bg-[#FF5722]/10 text-[#FF5722]' 
                                                : 'border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/20'}`}
                                    >
                                        {val[i] ? '•' : ''}
                                    </div>
                                );
                            })}
                        </div>
                      </div>

                      {pinError && (
                          <div className="mb-4 text-red-500 text-sm font-medium animate-pulse">
                              {pinError}
                          </div>
                      )}

                      <button 
                          onClick={handlePinSubmit}
                          className="w-full max-w-xs py-4 rounded-[24px] bg-[#FF5722] text-white font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
                      >
                          {pinStep === 'confirm' ? 'Save PIN' : 'Continue'}
                      </button>
                  </>
              )}
          </div>
      </div>
  );

  const renderSecurity = () => (
    <div className="animate-fade-in flex flex-col gap-6">
        {renderHeader('Security', () => setCurrentView('main'))}

        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 ml-2 uppercase tracking-wider">Authentication</h3>
            <GlassCard noPadding className="flex flex-col">
                 <div 
                    onClick={toggleFaceId}
                    className="p-5 flex items-center justify-between border-b border-black/5 dark:border-white/5 cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
                            <Fingerprint size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">Face ID Login</span>
                            <span className="text-xs text-gray-500 dark:text-white/40">Require biometric unlock on launch</span>
                        </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors duration-300 ${faceIdEnabled ? 'bg-[#FF5722] justify-end' : 'bg-gray-200 dark:bg-white/10 justify-start'}`}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-sm"></div>
                    </div>
                 </div>

                 {/* Biometrics for Payment */}
                 <div 
                    onClick={toggleBiometricsPayment}
                    className="p-5 flex items-center justify-between border-b border-black/5 dark:border-white/5 cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <ScanFace size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">Biometric Payments</span>
                            <span className="text-xs text-gray-500 dark:text-white/40">Verify before sending money</span>
                        </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors duration-300 ${biometricsPaymentEnabled ? 'bg-[#FF5722] justify-end' : 'bg-gray-200 dark:bg-white/10 justify-start'}`}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-sm"></div>
                    </div>
                 </div>

                 <div 
                    onClick={toggle2FA}
                    className="p-5 flex items-center justify-between cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Lock size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">2-Factor Auth</span>
                            <span className="text-xs text-gray-500 dark:text-white/40">Use PIN for transactions</span>
                        </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors duration-300 ${user?.is_2fa_enabled ? 'bg-[#FF5722] justify-end' : 'bg-gray-200 dark:bg-white/10 justify-start'}`}>
                        <div className="w-5 h-5 rounded-full bg-white dark:bg-white/40 shadow-sm"></div>
                    </div>
                 </div>
            </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 ml-2 uppercase tracking-wider">Access</h3>
            <GlassCard noPadding className="flex flex-col">
                 <div 
                    onClick={() => setCurrentView('change-pin')}
                    className="p-5 flex items-center justify-between border-b border-black/5 dark:border-white/5 cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-white">
                            <KeyRound size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">Change PIN</span>
                            <span className="text-xs text-gray-500 dark:text-white/40">Update transaction PIN</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 dark:text-white/20" />
                 </div>
                  <div 
                    onClick={toggleDiscovery}
                    className="p-5 flex items-center justify-between border-b border-black/5 dark:border-white/5 cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-white">
                            <Eye size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">Discoverability</span>
                            <span className="text-xs text-gray-500 dark:text-white/40">Allow others to find you</span>
                        </div>
                    </div>
                     <div className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors duration-300 ${isDiscoverable ? 'bg-[#FF5722] justify-end' : 'bg-gray-200 dark:bg-white/10 justify-start'}`}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-sm"></div>
                    </div>
                 </div>
                 <div 
                    onClick={() => setCurrentView('export-wallet')}
                    className="p-5 flex items-center justify-between border-b border-black/5 dark:border-white/5 cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Key size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">Export Wallet</span>
                            <span className="text-xs text-gray-500 dark:text-white/40">Backup private keys</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 dark:text-white/20" />
                 </div>
            </GlassCard>
        </div>

        <div className="flex flex-col gap-2 mt-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 ml-2 uppercase tracking-wider">Danger Zone</h3>
            <GlassCard noPadding className="flex flex-col">
                 <div 
                    onClick={() => setCurrentView('delete-account')}
                    className="p-5 flex items-center justify-between cursor-pointer active:bg-red-50 dark:active:bg-red-500/10 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
                            <Trash2 size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-red-600 dark:text-red-400">Delete Account</span>
                            <span className="text-xs text-gray-500 dark:text-white/40">Disable for 30 days</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 dark:text-white/20" />
                 </div>
            </GlassCard>
        </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="animate-fade-in flex flex-col gap-6">
        {renderHeader('Appearance')}

        <div className="grid grid-cols-3 gap-4">
             <button onClick={() => onThemeChange('system')} className="flex flex-col items-center gap-3 group">
                 <div className={`w-full aspect-[9/16] rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden group-active:scale-95 transition-all ${theme === 'system' ? 'border-[#FF5722] ring-2 ring-[#FF5722]/20' : 'bg-gray-200 dark:bg-white/10 border-transparent'}`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#ccc] to-[#333] opacity-50"></div>
                    <div className="z-10 text-xs text-white font-bold drop-shadow-md">Auto</div>
                    {theme === 'system' && (
                         <div className="w-6 h-6 rounded-full bg-[#FF5722] flex items-center justify-center mb-1 z-10 shadow-lg absolute bottom-8">
                            <CheckIcon /> 
                        </div>
                    )}
                 </div>
                 <span className={`text-sm font-medium ${theme === 'system' ? 'text-[#FF5722]' : 'text-gray-500 dark:text-white/40'}`}>System</span>
             </button>

             <button onClick={() => onThemeChange('light')} className="flex flex-col items-center gap-3 group">
                 <div className={`w-full aspect-[9/16] rounded-2xl bg-[#f5f5f7] border flex flex-col items-center justify-center relative overflow-hidden group-active:scale-95 transition-all ${theme === 'light' ? 'border-[#FF5722] ring-2 ring-[#FF5722]/20' : 'border-transparent'}`}>
                    <Sun size={24} className="text-gray-400 mb-1" />
                    {theme === 'light' && (
                         <div className="w-6 h-6 rounded-full bg-[#FF5722] flex items-center justify-center mb-1 z-10 shadow-lg absolute bottom-8">
                            <CheckIcon /> 
                        </div>
                    )}
                 </div>
                 <span className={`text-sm font-medium ${theme === 'light' ? 'text-[#FF5722]' : 'text-gray-500 dark:text-white/40'}`}>Light</span>
             </button>

             <button onClick={() => onThemeChange('dark')} className="flex flex-col items-center gap-3 group">
                 <div className={`w-full aspect-[9/16] rounded-2xl bg-[#0f0b1e] border flex flex-col items-center justify-center relative overflow-hidden shadow-lg shadow-orange-500/10 group-active:scale-95 transition-all ${theme === 'dark' ? 'border-[#FF5722] ring-2 ring-[#FF5722]/20' : 'border-gray-800'}`}>
                    <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-[#FF5722]/20 to-transparent"></div>
                    <Moon size={24} className="text-white z-10 mb-1" />
                    {theme === 'dark' && (
                         <div className="w-6 h-6 rounded-full bg-[#FF5722] flex items-center justify-center mb-1 z-10 shadow-lg absolute bottom-8">
                            <CheckIcon /> 
                        </div>
                    )}
                 </div>
                 <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#FF5722]' : 'text-gray-500 dark:text-white/40'}`}>Dark</span>
             </button>
        </div>

        <GlassCard className="mt-4">
            <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Theme Preference</h3>
            <p className="text-sm text-gray-500 dark:text-white/60 leading-relaxed">
                Choose how PayMe looks on your device. "System" will automatically adjust based on your device settings.
            </p>
        </GlassCard>
    </div>
  );

  const renderPrivacyPolicy = () => (
    <div className="animate-fade-in flex flex-col gap-6">
        {renderHeader('Privacy Policy', () => setCurrentView('help'))}
        
        <GlassCard className="prose dark:prose-invert">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Privacy & Funds</h2>
            <div className="flex flex-col gap-4 text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                <p>
                    <strong className="text-gray-900 dark:text-white">We are not a bank.</strong> PayMe Protocol acts solely as a user interface (UI) and medium for moving cryptocurrency. We do not have custody of your funds at any time.
                </p>
                <p>
                    When you use PayMe, you are interacting directly with the blockchain. Your funds are secured by your private keys (handled securely on your device), not by our servers. We cannot access, freeze, or reverse your transactions.
                </p>
                <p>
                    We designed PayMe to feel like a personalized wallet for your local area, making crypto feel familiar and easy to use. However, the underlying responsibility for fund security lies with you, the user.
                </p>
                <p>
                    We do not sell your personal data. Your transaction history is public on the blockchain, but your identity on our platform is kept private according to industry standards.
                </p>
            </div>
        </GlassCard>
    </div>
  );

  const renderTermsOfService = () => (
    <div className="animate-fade-in flex flex-col gap-6">
        {renderHeader('Terms of Service', () => setCurrentView('help'))}
        
        <GlassCard className="prose dark:prose-invert">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Terms & Conditions</h2>
            <div className="flex flex-col gap-4 text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                <p>
                    By signing up and using PayMe Protocol, you agree to the following terms:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong>Non-Custodial Service:</strong> You understand that PayMe Protocol is a non-custodial software provider. We do not store, manage, or insure your funds.
                    </li>
                    <li>
                        <strong>Self-Responsibility:</strong> You maintain full control over your assets. Loss of access credentials (passwords, keys) may result in permanent loss of funds, which PayMe cannot recover.
                    </li>
                    <li>
                        <strong>Not a Banking Institution:</strong> PayMe is not a bank, and funds held in your wallet are not insured by the FDIC or any other government agency.
                    </li>
                    <li>
                        <strong>Regulatory Compliance:</strong> You agree to use the platform in compliance with all local laws and regulations regarding cryptocurrency in your jurisdiction.
                    </li>
                </ul>
                <p className="mt-2">
                    Acceptance of these terms is mandatory for creating an account and using our services.
                </p>
            </div>
        </GlassCard>
    </div>
  );

  const renderHelp = () => (
    <div className="animate-fade-in flex flex-col gap-6">
        {renderHeader('Help & Support')}

        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 ml-2 uppercase tracking-wider">Contact</h3>
            <GlassCard noPadding className="flex flex-col">
                 <div 
                    onClick={() => handleUnderDevelopment("Live Chat Support")}
                    className="p-5 flex items-center justify-between cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center text-pink-500 dark:text-pink-400">
                            <MessageCircle size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">Chat with Support</span>
                            <span className="text-xs text-gray-500 dark:text-white/40">Average wait: 2 mins</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 dark:text-white/20" />
                 </div>
            </GlassCard>
        </div>

        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 ml-2 uppercase tracking-wider">Legal</h3>
            <GlassCard noPadding className="flex flex-col">
                 <div 
                    onClick={() => setCurrentView('privacy')}
                    className="p-5 flex items-center justify-between border-b border-black/5 dark:border-white/5 cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-white">
                            <Shield size={20} />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">Privacy Policy</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 dark:text-white/20" />
                 </div>
                 <div 
                    onClick={() => setCurrentView('terms')}
                    className="p-5 flex items-center justify-between cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-white">
                            <Scale size={20} />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">Terms of Service</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 dark:text-white/20" />
                 </div>
            </GlassCard>
        </div>

        <div className="text-center mt-4">
            <span className="text-xs text-gray-400 dark:text-white/30">
                PayMe Protocol v1.2.2 (Secure PIN)
            </span>
        </div>
    </div>
  );

  const renderExportWallet = () => (
      <div className="animate-fade-in flex flex-col gap-6 h-full relative">
          {renderHeader('Export Wallet', () => setCurrentView('security'))}

          <div className="flex flex-col items-center justify-center flex-1 pb-20">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                  <Key size={32} className="text-blue-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {showPrivateKey ? 'Your Private Key' : 'Export Wallet'}
              </h2>
              <p className="text-gray-500 dark:text-white/50 text-center text-sm mb-8 px-8">
                  {showPrivateKey 
                    ? 'Keep this safe! Anyone with this key can access your funds.' 
                    : 'Enter your PIN to reveal your private key for backup.'}
              </p>

              {showPrivateKey ? (
                  <>
                      <div className="w-full max-w-md bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-6">
                          <div className="flex items-start gap-3">
                              <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                              <div className="flex flex-col gap-1">
                                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Security Warning</p>
                                  <p className="text-xs text-yellow-600 dark:text-yellow-400 leading-relaxed">
                                      Never share your private key with anyone. Store it securely offline. PayMe will never ask for your private key.
                                  </p>
                              </div>
                          </div>
                      </div>

                      <div className="w-full max-w-md bg-white dark:bg-white/5 rounded-2xl p-6 border border-black/5 dark:border-white/10 mb-6">
                          <div className="flex flex-col gap-3">
                              <span className="text-xs text-gray-500 dark:text-white/40 uppercase tracking-wide">Private Key</span>
                              <div className="font-mono text-sm text-gray-900 dark:text-white break-all bg-gray-100 dark:bg-white/5 p-4 rounded-xl">
                                  {privateKeyData}
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-3 w-full max-w-md">
                          <button 
                              onClick={() => {
                                  navigator.clipboard.writeText(privateKeyData);
                                  alert('Private key copied to clipboard!');
                              }}
                              className="flex-1 py-4 rounded-[24px] bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                          >
                              Copy Key
                          </button>
                          <button 
                              onClick={() => {
                                  setShowPrivateKey(false);
                                  setPrivateKeyData('');
                                  setExportPin('');
                                  setCurrentView('security');
                              }}
                              className="flex-1 py-4 rounded-[24px] bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white font-bold text-lg active:scale-[0.98] transition-all"
                          >
                              Done
                          </button>
                      </div>
                  </>
              ) : (
                  <>
                      <div className="relative mb-8">
                        <input 
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={exportPin}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setExportPin(val);
                            }}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            autoFocus
                        />
                        <div className="flex gap-4 justify-center">
                            {[0, 1, 2, 3].map((i) => (
                                <div 
                                    key={i} 
                                    className={`w-12 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all
                                        ${exportPin[i] 
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-500' 
                                            : 'border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/20'}`}
                                >
                                    {exportPin[i] ? '•' : ''}
                                </div>
                            ))}
                        </div>
                      </div>

                      {exportError && (
                          <div className="mb-4 text-red-500 text-sm font-medium animate-pulse">
                              {exportError}
                          </div>
                      )}

                      <button 
                          onClick={handleExportWallet}
                          disabled={exportPin.length !== 4}
                          className="w-full max-w-xs py-4 rounded-[24px] bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 text-white font-bold text-lg shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                      >
                          Export Wallet
                      </button>
                  </>
              )}
          </div>
      </div>
  );

  const renderDeleteAccount = () => (
      <div className="animate-fade-in flex flex-col gap-6 h-full relative">
          {renderHeader('Delete Account', () => setCurrentView('security'))}

          <div className="flex flex-col items-center justify-center flex-1 pb-20">
              {deleteStep === 'success' ? (
                  <>
                      <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-6 animate-bounce">
                          <Check size={32} className="text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Disabled</h2>
                      <p className="text-gray-500 dark:text-white/50 text-center text-sm mb-8 px-8">
                          Your account has been disabled. You have 30 days to reinstate it before permanent deletion.
                      </p>
                  </>
              ) : (
                  <>
                      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                          <Trash2 size={32} className="text-red-500" />
                      </div>
                      
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {deleteStep === 'confirm' ? 'Delete Account?' : 'Verify PIN'}
                      </h2>
                      <p className="text-gray-500 dark:text-white/50 text-center text-sm mb-8 px-8">
                          {deleteStep === 'confirm' 
                            ? 'Your account will be disabled for 30 days. You can reinstate within this period.' 
                            : deleteStep === 'processing'
                            ? 'Processing your request...'
                            : 'Enter your PIN to confirm account deletion.'}
                      </p>

                      {deleteStep === 'confirm' && (
                          <>
                              <div className="w-full max-w-md bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
                                  <div className="flex items-start gap-3">
                                      <AlertTriangle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                      <div className="flex flex-col gap-2">
                                          <p className="text-sm font-semibold text-red-700 dark:text-red-300">Important Information</p>
                                          <ul className="text-xs text-red-600 dark:text-red-400 leading-relaxed space-y-1">
                                              <li>• Account disabled for 30 days</li>
                                              <li>• You can reinstate within 30 days</li>
                                              <li>• 2-hour cooldown after reinstatement</li>
                                              <li>• Account goes offline (not discoverable)</li>
                                              <li>• Permanent deletion after 30 days</li>
                                          </ul>
                                      </div>
                                  </div>
                              </div>

                              <div className="w-full max-w-md mb-6">
                                  <input 
                                      type="text"
                                      value={deleteConfirmText}
                                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                                      placeholder='Type "delete" to confirm'
                                      className="w-full bg-white dark:bg-white/5 border border-red-500/20 rounded-2xl py-4 px-4 text-gray-900 dark:text-white outline-none focus:border-red-500 transition-colors text-center"
                                      autoFocus
                                  />
                              </div>

                              {deleteError && (
                                  <div className="mb-4 text-red-500 text-sm font-medium animate-pulse">
                                      {deleteError}
                                  </div>
                              )}

                              <button 
                                  onClick={handleDeleteAccount}
                                  className="w-full max-w-xs py-4 rounded-[24px] bg-red-500 text-white font-bold text-lg shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all"
                              >
                                  Continue
                              </button>
                          </>
                      )}

                      {deleteStep === 'verify-pin' && (
                          <>
                              <div className="relative mb-8">
                                <input 
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={4}
                                    value={deletePin}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setDeletePin(val);
                                    }}
                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                    autoFocus
                                />
                                <div className="flex gap-4 justify-center">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div 
                                            key={i} 
                                            className={`w-12 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all
                                                ${deletePin[i] 
                                                    ? 'border-red-500 bg-red-500/10 text-red-500' 
                                                    : 'border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/20'}`}
                                        >
                                            {deletePin[i] ? '•' : ''}
                                        </div>
                                    ))}
                                </div>
                              </div>

                              {deleteError && (
                                  <div className="mb-4 text-red-500 text-sm font-medium animate-pulse">
                                      {deleteError}
                                  </div>
                              )}

                              <button 
                                  onClick={handleDeleteAccount}
                                  disabled={deletePin.length !== 4}
                                  className="w-full max-w-xs py-4 rounded-[24px] bg-red-500 disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 text-white font-bold text-lg shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all"
                              >
                                  Delete Account
                              </button>
                          </>
                      )}

                      {deleteStep === 'processing' && (
                          <div className="flex items-center gap-2">
                              <Loader2 className="animate-spin text-gray-400" />
                              <span className="text-gray-500 dark:text-white/50">Processing...</span>
                          </div>
                      )}
                  </>
              )}
          </div>
      </div>
  );

  return (
    <div className="px-4 pt-4 pb-32 h-full overflow-y-auto no-scrollbar">
        {currentView === 'main' && renderMainView()}
        {currentView === 'currency' && renderCurrency()}
        {currentView === 'account' && renderAccountInfo()}
        {currentView === 'security' && renderSecurity()}
        {currentView === 'change-pin' && renderChangePin()}
        {currentView === 'export-wallet' && renderExportWallet()}
        {currentView === 'delete-account' && renderDeleteAccount()}
        {currentView === 'appearance' && renderAppearance()}
        {currentView === 'help' && renderHelp()}
        {currentView === 'privacy' && renderPrivacyPolicy()}
        {currentView === 'terms' && renderTermsOfService()}
    </div>
  );
};

export default Settings;