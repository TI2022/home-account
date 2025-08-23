import { useEffect, useState } from 'react';
import { useSavingsStore } from '@/store/useSavingsStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wishlist } from './Wishlist';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export const SavingsPage = () => {
  const { savingsAmount, setSavingsAmount, fetchSavingsAmount } = useSavingsStore();
  const { transactions } = useTransactionStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState(savingsAmount.toString());
  const [showMock, setShowMock] = useState(false);
  const [displayPeriod, setDisplayPeriod] = useState('currentYear');

  useEffect(() => {
    fetchSavingsAmount();
  }, [fetchSavingsAmount]);

  useEffect(() => {
    setInputValue(savingsAmount.toString());
  }, [savingsAmount]);


  // 月ごとの貯金額（収入-支出）を集計
  const filteredTransactions = transactions.filter(t => {
    if (showMock) {
      // 予定データの場合は未来のデータも含める
      return t.isMock;
    } else {
      // 実際のデータの場合は未来の日付のデータは除外
      const today = new Date();
      const transactionDate = new Date(t.date);
      const isFuture = transactionDate > today;
      
      if (isFuture) {
        return false; // 未来のデータは除外
      }
      
      return !t.isMock;
    }
  });


  
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
    .map(([ym, { income, expense }]) => {
      const savings = income - expense;
      
      
      return {
        ym,
        savings,
      };
    })
    .sort((a, b) => a.ym.localeCompare(b.ym));

  // 全期間の累積貯金額リストを作成（最初から累積計算）
  const cumulativeSavingsList = monthlySavingsList.reduce<{ ym: string; cumulative: number }[]>((acc, { ym, savings }, idx) => {
    const prevCumulative = idx > 0 ? acc[idx - 1].cumulative : 0;
    acc.push({ ym, cumulative: prevCumulative + savings });
    return acc;
  }, []);


  // 表示期間によるフィルタリング
  const getFilteredData = () => {
    const currentYear = new Date().getFullYear().toString();
    
    switch (displayPeriod) {
      case 'currentYear': {
        const currentYearMonths = monthlySavingsList.filter(({ ym }) => ym.startsWith(currentYear));
        const currentYearCumulative = cumulativeSavingsList.filter(({ ym }) => ym.startsWith(currentYear));
        return { months: currentYearMonths, cumulative: currentYearCumulative };
      }
      case 'last12Months': {
        const last12Months = monthlySavingsList.slice(-12);
        const last12Cumulative = cumulativeSavingsList.slice(-12);
        return { months: last12Months, cumulative: last12Cumulative };
      }
      case 'all': {
        return { months: monthlySavingsList, cumulative: cumulativeSavingsList };
      }
      default: {
        const currentYearMonths = monthlySavingsList.filter(({ ym }) => ym.startsWith(currentYear));
        const currentYearCumulative = cumulativeSavingsList.filter(({ ym }) => ym.startsWith(currentYear));
        return { months: currentYearMonths, cumulative: currentYearCumulative };
      }
    }
  };

  const { months: filteredMonths, cumulative: filteredCumulative } = getFilteredData();
  
  // 表示期間の貯金合計
  const totalSavings = filteredMonths.reduce((total, { savings }) => total + savings, 0);

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
          <CardTitle className="flex justify-between items-center">
            <span>貯金額の推移</span>
            <Select value={displayPeriod} onValueChange={setDisplayPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="currentYear">今年</SelectItem>
                <SelectItem value="last12Months">過去12ヶ月</SelectItem>
                <SelectItem value="all">全期間</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 実際/予定切り替えボタン */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <Button
              type="button"
              variant={!showMock ? 'default' : 'outline'}
              className={`font-bold ${!showMock ? 'bg-blue-500 text-white' : ''}`}
              onClick={() => setShowMock(false)}
            >
              💰 実際の貯金額
            </Button>
            <Button
              type="button"
              variant={showMock ? 'default' : 'outline'}
              className={`font-bold ${showMock ? 'bg-orange-400 text-white' : ''}`}
              onClick={() => setShowMock(true)}
            >
              🕒 予定の貯金額
            </Button>
          </div>

          <Tabs defaultValue="cumulative" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="cumulative">累積貯金額</TabsTrigger>
              <TabsTrigger value="monthly">月ごとの貯金額</TabsTrigger>
            </TabsList>
            <TabsContent value="monthly">
              <div className={`space-y-2 ${filteredMonths.length > 12 ? 'max-h-96 overflow-y-auto' : ''}`}>
                {filteredMonths.length === 0 ? (
                  <div className="text-gray-500">記録がありません</div>
                ) : (
                  filteredMonths.map(({ ym, savings }) => (
                    <div key={ym} className="flex justify-between border-b pb-1">
                      <span>{format(new Date(ym + '-01'), 'yyyy年M月')}</span>
                      <span className={savings >= 0 ? 'text-blue-600' : 'text-red-600'}>
                        {savings >= 0 ? '+' : ''}¥{savings.toLocaleString('ja-JP')}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {/* 表示期間の貯金合計 */}
              {filteredMonths.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-700">
                      {displayPeriod === 'currentYear' ? '今年の貯金合計' :
                       displayPeriod === 'last12Months' ? '過去12ヶ月の貯金合計' : '全期間の貯金合計'}
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      ¥{totalSavings.toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    表示期間内のすべての月の合計
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="cumulative">
              <div className={`space-y-2 ${filteredCumulative.length > 12 ? 'max-h-96 overflow-y-auto' : ''}`}>
                {filteredCumulative.length === 0 ? (
                  <div className="text-gray-500">記録がありません</div>
                ) : (
                  filteredCumulative.map(({ ym, cumulative }) => (
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
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 max-h-[calc(100vh-5rem)] overflow-y-auto">
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