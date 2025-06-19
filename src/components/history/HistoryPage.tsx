import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MonthSelector } from './MonthSelector';
import { TransactionList } from './TransactionList';
import { useTransactionStore } from '@/store/useTransactionStore';

export const HistoryPage = () => {
  const { fetchTransactions, loading } = useTransactionStore();

  useEffect(() => {
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
        className="mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MonthSelector />
      </motion.div>
      
      {loading ? (
        <motion.div 
          className="flex justify-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TransactionList />
        </motion.div>
      )}
    </motion.div>
  );
};