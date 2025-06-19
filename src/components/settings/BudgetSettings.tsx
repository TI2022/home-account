import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_CATEGORIES } from '@/types';

export const BudgetSettings = () => {
  const { budgets, fetchBudgets, updateBudget } = useTransactionStore();
  const { selectedMonth } = useAppStore();
  const { toast } = useToast();
  const [budgetValues, setBudgetValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  useEffect(() => {
    // Initialize budget values for current month
    const currentBudgets = budgets.filter(b => b.month === selectedMonth);
    const values: Record<string, string> = {};
    
    EXPENSE_CATEGORIES.forEach(category => {
      const budget = currentBudgets.find(b => b.category === category);
      values[category] = budget ? budget.amount.toString() : '';
    });
    
    setBudgetValues(values);
  }, [budgets, selectedMonth]);

  const handleBudgetChange = (category: string, value: string) => {
    setBudgetValues(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSaveBudget = async (category: string) => {
    const amount = parseInt(budgetValues[category]);
    
    if (isNaN(amount) || amount < 0) {
      toast({
        title: 'エラー',
        description: '正しい金額を入力してください',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await updateBudget(category, amount, selectedMonth);
      toast({
        title: '保存完了',
        description: `${category}の予算を更新しました`,
      });
    } catch (error) {
      toast({
        title: 'エラー',
        description: '予算の保存に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {formatMonth(selectedMonth)}の予算設定
        </h3>
      </div>

      {EXPENSE_CATEGORIES.map((category) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="0"
                  value={budgetValues[category] || ''}
                  onChange={(e) => handleBudgetChange(category, e.target.value)}
                  min="0"
                />
              </div>
              <Button
                onClick={() => handleSaveBudget(category)}
                disabled={loading}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                保存
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};