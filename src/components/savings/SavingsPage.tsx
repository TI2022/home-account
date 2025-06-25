import { useEffect, useState } from 'react';
import { useSavingsStore } from '@/store/useSavingsStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wishlist } from './Wishlist';
import { SavingsPlan } from './SavingsPlan';
import { format } from 'date-fns';

export const SavingsPage = () => {
  const { savingsAmount, setSavingsAmount, fetchSavingsAmount, loading } = useSavingsStore();
  const { transactions } = useTransactionStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState(savingsAmount.toString());

  useEffect(() => {
    fetchSavingsAmount();
  }, [fetchSavingsAmount]);

  useEffect(() => {
    setInputValue(savingsAmount.toString());
  }, [savingsAmount]);

  // 月ごとの貯金額（収入-支出）を集計
  const monthlySavings = transactions.reduce((acc, t) => {
    const ym = t.date.slice(0, 7); // YYYY-MM
    if (!acc[ym]) acc[ym] = { income: 0, expense: 0 };
    if (t.type === 'income') acc[ym].income += t.amount;
    if (t.type === 'expense') acc[ym].expense += t.amount;
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);
  const monthlySavingsList = Object.entries(monthlySavings)
    .map(([ym, { income, expense }]) => ({
      ym,
      savings: income - expense,
    }))
    .sort((a, b) => a.ym.localeCompare(b.ym));

  const handleSave = async () => {
    const value = Number(inputValue);
    if (!isNaN(value) && value >= 0) {
      await setSavingsAmount(value);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="pb-20">
      <Card>
        <CardHeader>
          <CardTitle>現在の貯金額</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-3xl font-bold text-blue-600 mb-4">
            {loading ? '...' : `¥${savingsAmount.toLocaleString('ja-JP')}`}
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-500 text-white">
            貯金額を更新
          </Button>
        </CardContent>
      </Card>

      {/* 月ごとの貯金額リスト */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>月ごとの貯金額</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {monthlySavingsList.length === 0 ? (
              <div className="text-gray-500">記録がありません</div>
            ) : (
              monthlySavingsList.map(({ ym, savings }) => (
                <div key={ym} className="flex justify-between border-b pb-1">
                  <span>{format(new Date(ym + '-01'), 'yyyy年M月')}</span>
                  <span className={savings >= 0 ? 'text-blue-600' : 'text-red-600'}>
                    {savings >= 0 ? '+' : ''}¥{savings.toLocaleString('ja-JP')}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* モーダル */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-bold mb-4">貯金額を入力</h2>
            <input
              type="number"
              min={0}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4 text-lg bg-white"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSave} className="bg-blue-500 text-white">
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
      <SavingsPlan />
      <Wishlist />
    </div>
  );
}; 