import { useEffect, useState } from 'react';
import { useSavingsStore } from '@/store/useSavingsStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wishlist } from './Wishlist';
import { format } from 'date-fns';

export const SavingsPage = () => {
  const { savingsAmount, setSavingsAmount, fetchSavingsAmount, loading } = useSavingsStore();
  const { transactions } = useTransactionStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState(savingsAmount.toString());
  const [showMock, setShowMock] = useState(false);

  useEffect(() => {
    fetchSavingsAmount();
  }, [fetchSavingsAmount]);

  useEffect(() => {
    setInputValue(savingsAmount.toString());
  }, [savingsAmount]);

  // 月ごとの貯金額（収入-支出）を集計（isMockで切り替え）
  const monthlySavings = transactions.filter(t => showMock ? true : !t.isMock).reduce((acc, t) => {
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

  // 1年分の貯金機会合計（isMockで切り替え）
  const yearlySavingsOpportunity = monthlySavingsList.reduce((total, { savings }) => {
    return total + Math.max(0, savings); // プラスの月のみを合計
  }, 0);

  // 過去1年分のデータを取得（最新12ヶ月）
  const last12Months = monthlySavingsList.slice(-12);

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
          {/* 実際/予定切り替えセグメントコントロール */}
          <div className="flex flex-col items-center space-y-1 mb-4">
            <div className="flex w-full max-w-xs bg-gray-100 rounded-full p-1">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-full font-bold transition-all
                  ${!showMock ? 'bg-blue-500 text-white shadow' : 'bg-white text-gray-500'}`}
                onClick={() => setShowMock(false)}
                aria-pressed={!showMock}
              >
                <span className="text-lg">💰</span> 実際の貯金額
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-full font-bold transition-all
                  ${showMock ? 'bg-orange-400 text-white shadow' : 'bg-white text-gray-500'}`}
                onClick={() => setShowMock(true)}
                aria-pressed={showMock}
              >
                <span className="text-lg">🕒</span> 予定の貯金額
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              <span className="font-bold text-blue-500">実際の貯金額</span>は確定した記録、<span className="font-bold text-orange-400">予定の貯金額</span>は将来の予定や仮の記録です
            </div>
          </div>
          {/* 1年分の貯金機会合計 */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">過去1年分の貯金機会合計</span>
              <span className="text-lg font-bold text-blue-600">
                ¥{yearlySavingsOpportunity.toLocaleString('ja-JP')}
              </span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              プラスの月のみを合計（{last12Months.filter(m => m.savings > 0).length}ヶ月分）
            </div>
          </div>
          <div className="space-y-2">
            {monthlySavingsList.length === 0 ? (
              <div className="text-gray-500">記録がありません</div>
            ) : (
              last12Months.map(({ ym, savings }) => (
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
      <Wishlist />
    </div>
  );
}; 