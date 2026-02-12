import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

// Transaction status types
export type TransactionStatus = 'pending' | 'confirming' | 'confirmed' | 'failed';

// Pending transaction interface
export interface PendingTransaction {
    id: string;
    amount: number;
    type: 'send' | 'receive';
    status: TransactionStatus;
    timestamp: number;
    signature?: string;
}

interface BalanceContextType {
    balance: number;
    confirmedBalance: number; // Actual blockchain balance
    pendingBalance: number; // Balance including pending transactions
    isLoading: boolean;
    pendingTransactions: PendingTransaction[];
    addPendingTransaction: (tx: PendingTransaction) => void;
    updateTransactionStatus: (id: string, status: TransactionStatus) => void;
    refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [confirmedBalance, setConfirmedBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);

    // Calculate pending balance (confirmed + pending transactions)
    const pendingBalance = confirmedBalance + pendingTransactions.reduce((sum, tx) => {
        if (tx.status === 'failed') return sum;
        return sum + (tx.type === 'receive' ? tx.amount : -tx.amount);
    }, 0);

    // Display balance (show pending balance for better UX)
    const balance = pendingBalance;

    // Fetch confirmed balance from blockchain
    const refreshBalance = useCallback(async () => {
        if (!user) return;

        try {
            const response = await apiClient.getBalance();
            
            if (response.success && response.data) {
                let balanceValue = 0;
                
                // Handle different response formats (backend inconsistency)
                if (typeof response.data.balance === 'object' && response.data.balance !== null) {
                    balanceValue = response.data.balance.balance || 0;
                } else if (typeof response.data.balance === 'number') {
                    balanceValue = response.data.balance;
                } else if (typeof response.data === 'number') {
                    balanceValue = response.data;
                }
                
                setConfirmedBalance(balanceValue);
                setIsLoading(false);

                // Check if any pending transactions are now confirmed
                setPendingTransactions(prev => prev.map(tx => {
                    if (tx.status === 'confirming') {
                        // If balance changed, transaction is likely confirmed
                        // This is a simple heuristic - in production, check transaction signature
                        return { ...tx, status: 'confirmed' as TransactionStatus };
                    }
                    return tx;
                }));

                // Remove confirmed transactions after 5 seconds
                setTimeout(() => {
                    setPendingTransactions(prev => prev.filter(tx => tx.status !== 'confirmed'));
                }, 5000);
            }
        } catch (error) {
            console.error('Failed to fetch balance:', error);
            setIsLoading(false);
        }
    }, [user]);

    // Add a new pending transaction (optimistic update)
    const addPendingTransaction = useCallback((tx: PendingTransaction) => {
        setPendingTransactions(prev => [...prev, tx]);
        
        // Auto-update status to confirming after 2 seconds
        setTimeout(() => {
            updateTransactionStatus(tx.id, 'confirming');
        }, 2000);
    }, []);

    // Update transaction status
    const updateTransactionStatus = useCallback((id: string, status: TransactionStatus) => {
        setPendingTransactions(prev => prev.map(tx => 
            tx.id === id ? { ...tx, status } : tx
        ));

        // If failed, remove after 3 seconds
        if (status === 'failed') {
            setTimeout(() => {
                setPendingTransactions(prev => prev.filter(tx => tx.id !== id));
            }, 3000);
        }
    }, []);

    // Initial fetch and polling
    useEffect(() => {
        if (!user) return;

        // Initial fetch
        refreshBalance();

        // Poll every 5 seconds for real-time updates
        const interval = setInterval(refreshBalance, 5000);

        return () => clearInterval(interval);
    }, [user, refreshBalance]);

    return (
        <BalanceContext.Provider
            value={{
                balance,
                confirmedBalance,
                pendingBalance,
                isLoading,
                pendingTransactions,
                addPendingTransaction,
                updateTransactionStatus,
                refreshBalance,
            }}
        >
            {children}
        </BalanceContext.Provider>
    );
};

export const useBalance = () => {
    const context = useContext(BalanceContext);
    if (!context) {
        throw new Error('useBalance must be used within BalanceProvider');
    }
    return context;
};
