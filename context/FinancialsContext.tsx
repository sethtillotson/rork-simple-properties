import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  propertyId: string;
  type: TransactionType;
}

const initialTransactions: Transaction[] = [
  { id: 't1', type: 'income', description: 'Rent - 123 Main Street', amount: 1450, date: '2025-01-01', propertyId: '1' },
  { id: 't2', type: 'income', description: 'Rent - 456 Prairie Avenue', amount: 1750, date: '2025-01-01', propertyId: '2' },
  { id: 't3', type: 'expense', description: 'HVAC Repair - 456 Prairie Avenue', amount: 450, date: '2025-01-05', propertyId: '2' },
  { id: 't4', type: 'income', description: 'Rent - 321 Oak Street', amount: 1250, date: '2025-01-01', propertyId: '4' },
  { id: 't5', type: 'expense', description: 'Property Tax - All Properties', amount: 800, date: '2025-01-10', propertyId: '1' },
  { id: 't6', type: 'income', description: 'Late Fee - 123 Main Street', amount: 50, date: '2025-01-07', propertyId: '1' },
];

const STORAGE_KEY = 'transactions';

export async function deleteTransactionsByPropertyIdFromStorage(propertyId: string) {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    const list: Transaction[] = json ? (JSON.parse(json) as Transaction[]) : [];
    const filtered = list.filter(t => t.propertyId !== propertyId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log('[FinancialsContext] deleteTransactionsByPropertyIdFromStorage', { propertyId, removed: list.length - filtered.length });
  } catch (e) {
    console.error('[FinancialsContext] deleteTransactionsByPropertyIdFromStorage error', e);
  }
}

export const [FinancialsProvider, useFinancials] = createContextHook(() => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  useEffect(() => {
    const load = async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json) as unknown;
          if (Array.isArray(parsed)) {
            setTransactions(parsed as Transaction[]);
            console.log('[FinancialsContext] Loaded from storage', (parsed as unknown[]).length);
          }
        }
      } catch (e) {
        console.error('[FinancialsContext] load error', e);
      }
    };
    load();
  }, []);

  const persist = useCallback(async (items: Transaction[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      console.log('[FinancialsContext] Persisted', items.length);
    } catch (e) {
      console.error('[FinancialsContext] persist error', e);
    }
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...tx, id: Date.now().toString() };
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      void persist(updated);
      return updated;
    });
    console.log('[FinancialsContext] addTransaction', newTx);
  }, [persist]);

  const updateTransaction = useCallback((id: string, tx: Omit<Transaction, 'id'>) => {
    setTransactions(prev => {
      const updated = prev.map(item => (item.id === id ? { ...tx, id } : item));
      void persist(updated);
      return updated;
    });
    console.log('[FinancialsContext] updateTransaction', id);
  }, [persist]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const updated = prev.filter(item => item.id !== id);
      void persist(updated);
      return updated;
    });
    console.log('[FinancialsContext] deleteTransaction', id);
  }, [persist]);

  const deleteTransactionsByPropertyId = useCallback((propertyId: string) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.propertyId !== propertyId);
      void persist(updated);
      return updated;
    });
    console.log('[FinancialsContext] deleteTransactionsByPropertyId', { propertyId });
  }, [persist]);

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = income - expenses;
    return { income, expenses, net };
  }, [transactions]);

  return { transactions, addTransaction, updateTransaction, deleteTransaction, deleteTransactionsByPropertyId, totals } as const;
});