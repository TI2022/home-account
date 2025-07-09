import { useEffect, useState } from 'react';
import { useSavingsStore } from '@/store/useSavingsStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useScenarioStore } from '@/store/useScenarioStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wishlist } from './Wishlist';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
    if (showMock) {
      // 予定のみ、かつシナリオ一致
      return t.isMock && (!selectedScenarioId || t.scenario_id === selectedScenarioId);
    } else {
      // 実際のみ
      return !t.isMock;
    }
  });

  // デバッグ用：悲観シナリオの計算過程を確認
  if (showMock && selectedScenarioId) {
    console.log('=== 悲観シナリオ計算デバッグ ===');
    console.log('選択されたシナリオID:', selectedScenarioId);
    console.log('全取引数:', transactions.length);
    console.log('フィルタ後取引数:', filteredTransactions.length);
    
    // 悲観シナリオの取引を月別に集計して表示
    const debugMonthlyData = filteredTransactions.reduce((acc, t) => {
      const ym = t.date.slice(0, 7);
      if (!acc[ym]) acc[ym] = { income: 0, expense: 0, transactions: [] };
      if (t.type === 'income') acc[ym].income += t.amount;
      if (t.type === 'expense') acc[ym].expense += t.amount;
      acc[ym].transactions.push({
        date: t.date,
        type: t.type,
        amount: t.amount,
        category: t.category,
        memo: t.memo || '',
        scenario_id: t.scenario_id || '',
        isMock: t.isMock || false
      });
      return acc;
    }, {} as Record<string, { income: number; expense: number; transactions: Array<{
      date: string;
      type: 'income' | 'expense';
      amount: number;
      category: string;
      memo: string;
      scenario_id: string;
      isMock: boolean;
    }> }>);

    console.log('月別集計データ:', debugMonthlyData);
    
    // データの期間範囲を確認
    const months = Object.keys(debugMonthlyData).sort();
    console.log('データ期間範囲:', months[0], '〜', months[months.length - 1]);
    console.log('データ月数:', months.length);
    
    // 2025年6月のデータを特に詳しく確認
    const june2025 = debugMonthlyData['2025-06'];
    if (june2025) {
      console.log('2025年6月の詳細:', june2025);
      console.log('2025年6月の収入:', june2025.income);
      console.log('2025年6月の支出:', june2025.expense);
      console.log('2025年6月の貯金額:', june2025.income - june2025.expense);
      
      // 2025年6月の各取引を詳細表示
      console.log('=== 2025年6月の取引詳細 ===');
      june2025.transactions.forEach(t => {
        console.log(`${t.date}: ${t.type} ${t.amount.toLocaleString()}円 (${t.category}) - ${t.memo || 'メモなし'}`);
      });
    }
  }
  
  // 全期間の月次データを集計
  const monthlySavings = filteredTransactions.reduce((acc, t) => {
    const ym = t.date.slice(0, 7); // YYYY-MM
    if (!acc[ym]) acc[ym] = { income: 0, expense: 0 };
    if (t.type === 'income') acc[ym].income += t.amount;
    if (t.type === 'expense') acc[ym].expense += t.amount;
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);
  
  // 全期間の月次貯金額リストを作成（時系列順）
  const monthlySavingsList = Object.entries(monthlySavings)
    .map(([ym, { income, expense }]) => ({
      ym,
      savings: income - expense,
    }))
    .sort((a, b) => a.ym.localeCompare(b.ym));

  // 全期間の累積貯金額リストを作成（最初から累積計算）
  const cumulativeSavingsList = monthlySavingsList.reduce<{ ym: string; cumulative: number }[]>((acc, { ym, savings }, idx) => {
    const prevCumulative = idx > 0 ? acc[idx - 1].cumulative : 0;
    acc.push({ ym, cumulative: prevCumulative + savings });
    return acc;
  }, []);

  // デバッグ用：累積計算の過程を確認
  if (showMock && selectedScenarioId) {
    console.log('月次貯金額リスト:', monthlySavingsList);
    console.log('累積貯金額リスト:', cumulativeSavingsList);
    
    // 各月の詳細を表示
    console.log('=== 各月の詳細 ===');
    monthlySavingsList.forEach((item, index) => {
      console.log(`${item.ym}: 月次貯金額 ${item.savings.toLocaleString()}円, 累積貯金額 ${cumulativeSavingsList[index].cumulative.toLocaleString()}円`);
    });
    
    // 2025年6月の累積値を確認
    const june2025Cumulative = cumulativeSavingsList.find(item => item.ym === '2025-06');
    if (june2025Cumulative) {
      console.log('2025年6月の累積貯金額:', june2025Cumulative.cumulative);
    }
  }

  // 表示用：最新12ヶ月分を抽出
  const last12Months = monthlySavingsList.slice(-12);
  const last12Cumulative = cumulativeSavingsList.slice(-12);
  
  // 1年分の貯金合計（過去12ヶ月分の合計）
  const yearlySavingsOpportunity = last12Months.reduce((total, { savings }) => total + savings, 0);

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
          {/* 実際/予定切り替えセグメントコントロールを廃止し、ボタン群に置換 */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <Button
              type="button"
              variant={!showMock ? 'default' : 'outline'}
              className={`font-bold ${!showMock ? 'bg-blue-500 text-white' : ''}`}
              onClick={() => {
                setShowMock(false);
                setSelectedScenarioId('');
              }}
            >
              💰 実際の貯金額
            </Button>
            {scenarios.map(scenario => (
              <Button
                key={scenario.id}
                type="button"
                variant={showMock && selectedScenarioId === scenario.id ? 'default' : 'outline'}
                className={`font-bold ${showMock && selectedScenarioId === scenario.id ? 'bg-orange-400 text-white' : ''}`}
                onClick={() => {
                  setShowMock(true);
                  setSelectedScenarioId(scenario.id);
                }}
              >
                🕒 {scenario.name}
              </Button>
            ))}
          </div>

          {/* シナリオセレクターは不要なので削除 */}

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
                {last12Cumulative.length === 0 ? (
                  <div className="text-gray-500">記録がありません</div>
                ) : (
                  last12Cumulative.map(({ ym, cumulative }) => (
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