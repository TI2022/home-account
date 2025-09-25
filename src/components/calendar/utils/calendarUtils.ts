import { Transaction } from '@/types';
import { isSameDay, startOfMonth, endOfMonth } from 'date-fns';

export interface DayTotal {
  income: number;
  expense: number;
  net: number;
}

/**
 * 指定した日付のトランザクション合計を計算
 */
export const getDayTotal = (
  transactions: Transaction[], 
  date: Date, 
  showMock: boolean
): DayTotal => {
  const dayTransactions = transactions.filter(t => {
    if (showMock) {
      if (!t.isMock) return false;
    } else {
      if (t.isMock) return false;
    }
    return isSameDay(new Date(t.date), date);
  });
  
  const income = dayTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = dayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return { income, expense, net: income - expense };
};

/**
 * 金額をロケール形式でフォーマット
 */
export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('ja-JP');
};

/**
 * 指定した月のトランザクションをフィルタリング
 */
export const filterMonthTransactions = (
  transactions: Transaction[],
  currentMonth: Date,
  showMock: boolean
): Transaction[] => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    if (showMock) {
      // 予定タブ: isMock=trueのみ
      if (!t.isMock) return false;
    } else {
      // 実際タブ: isMock=falseのみ
      if (t.isMock) return false;
    }
    
    return transactionDate >= monthStart && transactionDate <= monthEnd;
  });
};

/**
 * 指定した日付のトランザクションをフィルタリング
 */
export const filterDateTransactions = (
  transactions: Transaction[],
  selectedDate: Date,
  showMock: boolean
): Transaction[] => {
  return transactions.filter(t => {
    if (showMock) {
      if (!t.isMock) return false;
    } else {
      if (t.isMock) return false;
    }
    return isSameDay(new Date(t.date), selectedDate);
  });
};

/**
 * 月次サマリーを計算
 */
export const calculateMonthlySummary = (monthTransactions: Transaction[]) => {
  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;
  
  return { income, expense, balance };
};