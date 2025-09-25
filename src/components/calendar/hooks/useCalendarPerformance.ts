import { useMemo, useState } from 'react';
import { Transaction } from '@/types';
import { 
  filterMonthTransactions, 
  getDayTotal, 
  calculateMonthlySummary 
} from '../utils/calendarUtils';
import { 
  DayTotal, 
  MonthlySummary, 
  UseCalendarPerformanceReturn 
} from '../types/calendar.types';
import { startOfMonth, endOfMonth, addDays, format } from 'date-fns';

export const useCalendarPerformance = (
  transactions: Transaction[],
  currentMonth: Date,
  showMock: boolean
): UseCalendarPerformanceReturn => {
  const [isLoading, setIsLoading] = useState(false);

  // メモ化された月次トランザクション
  const monthTransactions = useMemo(() => {
    
    return filterMonthTransactions(transactions, currentMonth, showMock);
  }, [transactions, currentMonth, showMock]);

  // メモ化された日次集計マップ
  const dayTotalsMap = useMemo(() => {
    setIsLoading(true);
    
    const map = new Map<string, DayTotal>();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // 月内の全日付について事前計算
    for (let date = new Date(monthStart); date <= monthEnd; date = addDays(date, 1)) {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayTotal = getDayTotal(transactions, date, showMock);
      map.set(dateKey, dayTotal);
    }
    
    setIsLoading(false);
    return map;
  }, [transactions, currentMonth, showMock]);

  // メモ化された月次サマリー
  const monthlySummary = useMemo((): MonthlySummary => {
    return calculateMonthlySummary(monthTransactions);
  }, [monthTransactions]);


  return {
    monthTransactions,
    dayTotalsMap,
    monthlySummary,
    isLoading,
  };
};