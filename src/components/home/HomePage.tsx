import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameDashboard } from '@/components/gamification/GameDashboard';
import { AnimatedButton } from '@/components/ui/animated-button';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAppStore } from '@/store/useAppStore';

export const HomePage = () => {
  const { fetchTransactions, loading, autoReflectRecurring } = useTransactionStore();
  const { setCurrentTab } = useAppStore();

  useEffect(() => {
    fetchTransactions();
    autoReflectRecurring();
  }, [fetchTransactions, autoReflectRecurring]);

  return (
    <div className="pb-20 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full"
      >
        <GameDashboard />
      </motion.div>
      <motion.div 
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      >
        <AnimatedButton
          onClick={() => setCurrentTab('add')}
          className="px-8 py-3 rounded-full shadow-lg bg-gradient-to-r from-pink-400 via-pink-500 to-rose-500 hover:from-pink-500 hover:via-pink-600 hover:to-rose-600 text-white"
          size="lg"
          sparkle
        >
          支出を記録
        </AnimatedButton>
      </motion.div>
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      )}
    </div>
  );
};