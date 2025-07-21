import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SummaryCards } from './SummaryCards';
import { ExpenseChart } from './ExpenseChart';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAppStore } from '@/store/useAppStore';

// メモ化されたホームページコンポーネント
const MemoizedHomePage = () => {
  const { transactions, fetchTransactions } = useTransactionStore();
  const { selectedMonth } = useAppStore();

  // メモ化: 選択された月のトランザクション
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // メモ化: 収入と支出の計算
  const { income, expense, balance } = useMemo(() => {
    const income = monthlyTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthlyTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [monthlyTransactions]);

  // メモ化: カテゴリー別の集計
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    monthlyTransactions
      .filter(t => t.amount < 0 && t.category)
      .forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + Math.abs(t.amount));
      });
    
    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // 上位5カテゴリー
  }, [monthlyTransactions]);

  // メモ化: 日別の集計
  const dailyData = useMemo(() => {
    const dailyMap = new Map<string, number>();
    
    monthlyTransactions.forEach(t => {
      const date = t.date;
      const current = dailyMap.get(date) || 0;
      dailyMap.set(date, current + t.amount);
    });
    
    return Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [monthlyTransactions]);

  // コールバック関数のメモ化
  const handleRefresh = useCallback(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <motion.div 
      className="pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SummaryCards 
          income={income}
          expense={expense}
          balance={balance}
          onRefresh={handleRefresh}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <ExpenseChart 
          categoryData={categoryData}
          dailyData={dailyData}
        />
      </motion.div>
    </motion.div>
  );
};

export { MemoizedHomePage as HomePage };