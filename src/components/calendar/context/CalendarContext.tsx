import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useCalendarState } from '../hooks/useCalendarState';
import { useTransactionDialog } from '../hooks/useTransactionDialog';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { useCalendarPerformance } from '../hooks/useCalendarPerformance';
import { useCalendarError } from '../hooks/useCalendarError';
import { CalendarContextValue } from '../types/calendar.types';

const CalendarContext = createContext<CalendarContextValue | null>(null);

export interface CalendarProviderProps {
  children: React.ReactNode;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  // カスタムフック
  const { state: calendarState, actions: calendarActions } = useCalendarState();
  const { state: dialogState, actions: dialogActions } = useTransactionDialog();
  const { state: bulkState, actions: bulkActions } = useBulkSelection();
  const { error, handleError, clearError } = useCalendarError();
  
  // トランザクションストア
  const { transactions, fetchTransactions } = useTransactionStore();
  
  // パフォーマンス最適化フック
  const performance = useCalendarPerformance(
    transactions,
    calendarState.currentMonth,
    calendarState.showMock
  );

  // 初期化処理
  useEffect(() => {
    const initializeCalendar = async () => {
      try {
        await fetchTransactions();
        
        // ガイド表示判定
        if (localStorage.getItem('calendarGuideShown') !== '1') {
          calendarActions.setShowGuide(true);
        }
      } catch (error) {
        handleError(error, 'Calendar initialization', 'TRANSACTION_LOAD_ERROR');
      }
    };

    initializeCalendar();
  }, [fetchTransactions, calendarActions, handleError]);

  // ダイアログ状態管理の副作用
  useEffect(() => {
    if (calendarState.isDialogOpen) {
      dialogActions.setShowAllTransactions(true);
    }
  }, [calendarState.isDialogOpen, dialogActions]);

  // 一括選択モードの副作用
  useEffect(() => {
    if (!calendarState.isDialogOpen) {
      bulkActions.clearSelection();
    }
  }, [calendarState.isDialogOpen, bulkActions]);

  // コンテキスト値のメモ化
  const contextValue = useMemo<CalendarContextValue>(() => ({
    // 状態
    calendarState,
    dialogState,
    bulkState,
    
    // アクション
    calendarActions,
    dialogActions,
    bulkActions,
    
    // 計算値
    performance,
    
    // エラーハンドリング
    error,
    clearError,
  }), [
    calendarState,
    dialogState,
    bulkState,
    calendarActions,
    dialogActions,
    bulkActions,
    performance,
    error,
    clearError,
  ]);

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCalendarContext = (): CalendarContextValue => {
  const context = useContext(CalendarContext);
  
  if (!context) {
    throw new Error('useCalendarContext must be used within CalendarProvider');
  }
  
  return context;
};