import { useTransactionStore } from '@/store/useTransactionStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const SavingsPage = () => {
  const { transactions } = useTransactionStore();

  // 収入合計・支出合計・貯蓄額
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const savings = totalIncome - totalExpense;

  return (
    <div className="pb-20">
      <Card>
        <CardHeader>
          <CardTitle>現在の貯蓄額</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-3xl font-bold text-blue-600">
            ¥{savings.toLocaleString('ja-JP')}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            収入合計: ¥{totalIncome.toLocaleString('ja-JP')}<br />
            支出合計: ¥{totalExpense.toLocaleString('ja-JP')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 