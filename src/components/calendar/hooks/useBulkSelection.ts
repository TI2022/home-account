import { useState, useCallback } from 'react';
import { Transaction } from '@/types';

export interface BulkSelectionState {
  isBulkSelectMode: boolean;
  selectedIds: string[];
  isConfirmDialogOpen: boolean;
}

export interface BulkSelectionActions {
  setIsBulkSelectMode: (mode: boolean) => void;
  setSelectedIds: (ids: string[]) => void;
  setIsConfirmDialogOpen: (open: boolean) => void;
  toggleSelection: (id: string) => void;
  selectAll: (transactions: Transaction[]) => void;
  clearSelection: () => void;
  toggleBulkMode: () => void;
}

export const useBulkSelection = () => {
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(ids => 
      ids.includes(id) 
        ? ids.filter(existingId => existingId !== id)
        : [...ids, id]
    );
  }, []);

  const selectAll = useCallback((transactions: Transaction[]) => {
    setSelectedIds(transactions.map(t => t.id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setIsBulkSelectMode(false);
  }, []);

  const toggleBulkMode = useCallback(() => {
    setIsBulkSelectMode(mode => {
      if (mode) {
        // 一括選択モードを終了する場合、選択をクリア
        setSelectedIds([]);
      }
      return !mode;
    });
  }, []);

  const state: BulkSelectionState = {
    isBulkSelectMode,
    selectedIds,
    isConfirmDialogOpen,
  };

  const actions: BulkSelectionActions = {
    setIsBulkSelectMode,
    setSelectedIds,
    setIsConfirmDialogOpen,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleBulkMode,
  };

  return { state, actions };
};