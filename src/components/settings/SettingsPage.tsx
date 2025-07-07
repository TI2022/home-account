import { motion } from 'framer-motion';
import { RecurringIncomeSettings } from './RecurringIncomeSettings';
import { RecurringExpenseSettings } from './RecurringExpenseSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
            <RecurringIncomeSettings />
          </TabsContent>
          
          <TabsContent value="expense" className="space-y-4">
            <RecurringExpenseSettings />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};