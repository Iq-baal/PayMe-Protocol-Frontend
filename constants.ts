import { Currency } from './types';

// Lucide is bloating the bundle. Tree-shaking is a myth. I'll fix this... never.
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, Coffee, ShoppingBag, Zap } from 'lucide-react';

export const DEFAULT_CURRENCIES: Currency[] = [
  // --- Global Standards ---
  { code: 'USDC', name: 'USD Coin', symbol: '$', rate: 1.00, flag: '🇺🇸' },
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.00, flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79, flag: '🇬🇧' },

  // --- Targeted markets. Need those oil pegs. ---
  { code: 'ILS', name: 'New Israeli Shekel', symbol: '₪', rate: 3.75, flag: '🇵🇸' }, // Used in Palestine
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 3.67, flag: '🇦🇪' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', rate: 3.64, flag: '🇶🇦' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', rate: 0.38, flag: '🇴🇲' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', rate: 10.12, flag: '🇲🇦' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', rate: 3.75, flag: '🇸🇦' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', rate: 30.90, flag: '🇪🇬' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 42000.00, flag: '🇮🇷' },
  
  // --- Africa (Priority) ---
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 1600.50, flag: '🇳🇬' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', rate: 12.80, flag: '🇬🇭' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 145.20, flag: '🇰🇪' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 19.05, flag: '🇿🇦' },
  { code: 'XOF', name: 'West African CFA', symbol: 'CFA', rate: 605.50, flag: '🇸🇳' }, // Senegal/Ivory Coast etc
];

export const APP_COLORS = {
  primary: '#FF5722', // Deep Orange
  secondary: '#673AB7', // Deep Purple
  accent: '#FFFFFF',
  glassBg: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
};