import { useState, useCallback } from 'react';
import { Transaction } from '@/types';

export type DialogMode = 'add' | 'edit' | 'copy';

export interface TransactionDialogState {
  editingTransaction: Transaction | null;
  copyingTransaction: Transaction | null;
  dialogMode: DialogMode;
  showAllTransactions: boolean;
}

export interface TransactionDialogActions {
  setEditingTransaction: (transaction: Transaction | null) => void;
  setCopyingTransaction: (transaction: Transaction | null) => void;
  setDialogMode: (mode: DialogMode) => void;
  setShowAllTransactions: (show: boolean) => void;
  startEdit: (transaction: Transaction) => void;
  startCopy: (transaction: Transaction) => void;
  resetDialog: () => void;
}

export const useTransactionDialog = () => {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [copyingTransaction, setCopyingTransaction] = useState<Transaction | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>('add');
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const startEdit = useCallback((transaction: Transaction) => {
    setDialogMode('edit');
    setEditingTransaction(transaction);
    setCopyingTransaction(null);
  }, []);

  const startCopy = useCallback((transaction: Transaction) => {
    setDialogMode('copy');
    setCopyingTransaction(transaction);
    setEditingTransaction(null);
  }, []);

  const resetDialog = useCallback(() => {
    setEditingTransaction(null);
    setCopyingTransaction(null);
    setDialogMode('add');
  }, []);

  const state: TransactionDialogState = {
    editingTransaction,
    copyingTransaction,
    dialogMode,
    showAllTransactions,
  };

  const actions: TransactionDialogActions = {
    setEditingTransaction,
    setCopyingTransaction,
    setDialogMode,
    setShowAllTransactions,
    startEdit,
    startCopy,
    resetDialog,
  };

  return { state, actions };
};