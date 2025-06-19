import { CuteCard } from '@/components/ui/cute-card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAppStore } from '@/store/useAppStore';

export const SummaryCards = () => {
  const { transactions } = useTransactionStore();
  const { selectedMonth } = useAppStore();

  const monthTransactions = transactions.filter(t => 
    t.date.startsWith(selectedMonth)
  );

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP');
  };

  return (
    <div className="grid grid-cols-1 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      >
        <CuteCard variant="green" hover glow>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-emerald-800">今月の収入</CardTitle>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
          </motion.div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-900">
            ¥{formatAmount(totalIncome)}
          </div>
        </CardContent>
        </CuteCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      >
        <CuteCard variant="pink" hover glow>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-rose-800">今月の支出</CardTitle>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1, ease: "easeInOut" }}
          >
            <ArrowDownCircle className="h-4 w-4 text-rose-600" />
          </motion.div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-900">
            ¥{formatAmount(totalExpense)}
          </div>
        </CardContent>
        </CuteCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      >
        <CuteCard 
          variant={balance >= 0 ? 'blue' : 'purple'} 
          hover 
          glow
        >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${
            balance >= 0 ? 'text-blue-800' : 'text-purple-800'
          }`}>
            残高
          </CardTitle>
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Wallet className={`h-4 w-4 ${
              balance >= 0 ? 'text-blue-600' : 'text-purple-600'
            }`} />
          </motion.div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            balance >= 0 ? 'text-blue-900' : 'text-purple-900'
          }`}>
            ¥{formatAmount(balance)}
          </div>
        </CardContent>
        </CuteCard>
      </motion.div>
    </div>
  );
};