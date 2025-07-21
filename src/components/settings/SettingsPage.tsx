import { motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 遅延読み込みでパフォーマンスを改善
const RecurringIncomeSettings = lazy(() => import('./RecurringIncomeSettings').then(module => ({ default: module.RecurringIncomeSettings })));
const RecurringExpenseSettings = lazy(() => import('./RecurringExpenseSettings').then(module => ({ default: module.RecurringExpenseSettings })));

// ローディングコンポーネント
const SettingsLoading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

export const SettingsPage = () => {
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
        <Tabs defaultValue="expense" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">定期支出</TabsTrigger>
            <TabsTrigger value="income">定期収入</TabsTrigger>
          </TabsList>
          
          <TabsContent value="income" className="space-y-4">
            <Suspense fallback={<SettingsLoading />}>
              <RecurringIncomeSettings />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="expense" className="space-y-4">
            <Suspense fallback={<SettingsLoading />}>
              <RecurringExpenseSettings />
            </Suspense>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};