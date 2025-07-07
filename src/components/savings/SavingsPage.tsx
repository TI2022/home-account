import { useEffect, useState } from 'react';
import { useSavingsStore } from '@/store/useSavingsStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useScenarioStore } from '@/store/useScenarioStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wishlist } from './Wishlist';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScenarioSelector } from '@/components/ui/scenario-selector';

export const SavingsPage = () => {
  const { savingsAmount, setSavingsAmount, fetchSavingsAmount } = useSavingsStore();
  const { transactions } = useTransactionStore();
  const { scenarios, fetchScenarios, getDefaultScenario } = useScenarioStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState(savingsAmount.toString());
  const [showMock, setShowMock] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');

  useEffect(() => {
    fetchSavingsAmount();
    fetchScenarios();
  }, [fetchSavingsAmount, fetchScenarios]);

  useEffect(() => {
    setInputValue(savingsAmount.toString());
  }, [savingsAmount]);

  // デフォルトシナリオを自動選択
  useEffect(() => {
    if (showMock && scenarios.length > 0 && !selectedScenarioId) {
      const defaultScenario = getDefaultScenario();
      if (defaultScenario) {
        setSelectedScenarioId(defaultScenario.id);
      }
    }
  }, [showMock, scenarios, selectedScenarioId, getDefaultScenario]);

  // 月ごとの貯金額（収入-支出）を集計（isMockで切り替え）
  const filteredTransactions = transactions.filter(t => {
    if (!showMock && t.isMock) return false;
    if (showMock && t.isMock && selectedScenarioId && t.scenario_id !== selectedScenarioId) return false;
    return true;
  });
  
  const monthlySavings = filteredTransactions.reduce((acc, t) => {
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

  // 過去1年分のデータを取得（最新12ヶ月）
  const last12Months = monthlySavingsList.slice(-12);

  // 1年分の貯金合計（isMockで切り替え）
  const yearlySavingsOpportunity = last12Months.reduce((total, { savings }) => total + savings, 0);

  // 累積貯金額リストを作成
  const cumulativeSavingsList = last12Months.reduce<{ ym: string; cumulative: number }[]>((acc, { ym, savings }, idx) => {
    const prev = acc[idx - 1]?.cumulative ?? 0;
    acc.push({ ym, cumulative: prev + savings });
    return acc;
  }, []);

  const handleSave = async () => {
    const value = Number(inputValue);
    if (!isNaN(value) && value >= 0) {
      await setSavingsAmount(value);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="pb-20">
      {/* タブUIで切り替え */}
      <Card>
        <CardHeader>
          <CardTitle>貯金額の推移</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 実際/予定切り替えセグメントコントロール */}
          <div className="flex flex-col items-center space-y-1 mb-4">
            <div className="flex w-full max-w-xs bg-gray-100 rounded-full p-1">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-full font-bold transition-all
                  ${!showMock ? 'bg-blue-500 text-white shadow' : 'bg-white text-gray-500'}`}
                onClick={() => {
                  setShowMock(false);
                  setSelectedScenarioId(''); // 実際収支に切り替え時はシナリオをリセット
                }}
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
          </div>

          {/* シナリオ選択（予定収支の場合のみ表示） */}
          {showMock && (
            <div className="mb-4">
              <ScenarioSelector
                value={selectedScenarioId}
                onValueChange={setSelectedScenarioId}
                placeholder="シナリオを選択"
                className="bg-white"
              />
            </div>
          )}

          <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="monthly">月ごとの貯金額</TabsTrigger>
              <TabsTrigger value="cumulative">累積貯金額</TabsTrigger>
            </TabsList>
            <TabsContent value="monthly">
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
              {/* 1年分の貯金合計 */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">過去1年分の貯金合計</span>
                  <span className="text-lg font-bold text-blue-600">
                    ¥{yearlySavingsOpportunity.toLocaleString('ja-JP')}
                  </span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  過去12ヶ月分すべての月の合計
                </div>
              </div>
            </TabsContent>
            <TabsContent value="cumulative">
              <div className="space-y-2">
                {cumulativeSavingsList.length === 0 ? (
                  <div className="text-gray-500">記録がありません</div>
                ) : (
                  cumulativeSavingsList.map(({ ym, cumulative }) => (
                    <div key={ym} className="flex justify-between border-b pb-1">
                      <span>{format(new Date(ym + '-01'), 'yyyy年M月')}</span>
                      <span className={cumulative >= 0 ? 'text-blue-600' : 'text-red-600'}>
                        ¥{cumulative.toLocaleString('ja-JP')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
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