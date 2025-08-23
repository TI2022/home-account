import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSavingsStore } from '@/store/useSavingsStore';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';

export const GraphPage = () => {
  const { transactions } = useTransactionStore();
  const { savingsAmount } = useSavingsStore();

  // 予定/実際切り替え用の状態
  const [showMock, setShowMock] = useState<'actual' | 'mock'>('actual');

  // 予定/実際切り替えに応じたトランザクションフィルタ
  const filteredTransactions = useMemo(() => {
    if (showMock === 'mock') {
      return transactions.filter(t => t.isMock);
    } else {
      return transactions.filter(t => !t.isMock);
    }
  }, [transactions, showMock]);

  // 月ごとのリストを作成
  const months = useMemo(() => {
    const set = new Set<string>();
    filteredTransactions.forEach((t) => {
      const date = typeof t.date === 'string' ? parseISO(t.date) : t.date;
      set.add(format(date, 'yyyy-MM'));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a)); // 新しい順
  }, [filteredTransactions]);

  // 選択中の月
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // データが読み込まれた後、現在の月をデフォルトに設定
  useEffect(() => {
    if (months.length > 0 && selectedMonth === '') {
      const currentMonth = format(new Date(), 'yyyy-MM');
      // 現在の月がデータに存在すればそれを、なければ最新のデータ月を使用
      const defaultMonth = months.includes(currentMonth) ? currentMonth : months[0];
      setSelectedMonth(defaultMonth);
    }
  }, [months, selectedMonth]);

  // 月別収支データ
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; income: number; expense: number; balance: number }> = {};
    filteredTransactions.forEach((t) => {
      const date = typeof t.date === 'string' ? parseISO(t.date) : t.date;
      const key = format(date, 'yyyy-MM');
      if (!map[key]) {
        map[key] = { month: format(date, 'yyyy年M月'), income: 0, expense: 0, balance: 0 };
      }
      if (t.type === 'income') {
        map[key].income += t.amount;
      } else if (t.type === 'expense') {
        map[key].expense += t.amount;
      }
      map[key].balance = map[key].income - map[key].expense;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions]);

  // 選択月のカテゴリ別収支データ
  const selectedMonthCategoryData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    filteredTransactions.forEach((t) => {
      const date = typeof t.date === 'string' ? parseISO(t.date) : t.date;
      const key = format(date, 'yyyy-MM');
      if (key !== selectedMonth) return;
      if (!map[t.category]) {
        map[t.category] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        map[t.category].income += t.amount;
      } else if (t.type === 'expense') {
        map[t.category].expense += t.amount;
      }
    });
    // 収入・支出両方が0のカテゴリは除外
    return Object.entries(map)
      .map(([category, { income, expense }]) => ({
        category,
        income,
        expense: Math.abs(expense),
      }))
      .filter(item => item.income !== 0 || item.expense !== 0);
  }, [filteredTransactions, selectedMonth]);

  const COLORS = [
    '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
  ];

  // 貯蓄残高の推移データ（各月末時点の残高を計算）
  const savingsHistory = useMemo(() => {
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    filteredTransactions.forEach((t) => {
      const date = typeof t.date === 'string' ? parseISO(t.date) : t.date;
      const key = format(date, 'yyyy-MM');
      if (!map[key]) {
        map[key] = { month: format(date, 'yyyy年M月'), income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        map[key].income += t.amount;
      } else if (t.type === 'expense') {
        map[key].expense += t.amount;
      }
    });
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    let balance = 0;
    const result = sorted.map(([, { month, income, expense }]) => {
      balance += income - expense;
      return { month, balance };
    });
    if (result.length > 0 && savingsAmount !== undefined) {
      const last = result[result.length - 1];
      if (last.balance !== savingsAmount) {
        const now = new Date();
        result.push({
          month: format(now, 'yyyy年M月'),
          balance: savingsAmount,
        });
      }
    }
    return result;
  }, [filteredTransactions, savingsAmount]);

  // 期間指定集計用の状態
  const [period, setPeriod] = useState<'month' | 'year' | 'week'>('month');

  // 期間ごとの集計データ
  const periodData = useMemo(() => {
    const map: Record<string, { label: string; income: number; expense: number; balance: number }> = {};
    filteredTransactions.forEach((t) => {
      const date = typeof t.date === 'string' ? parseISO(t.date) : t.date;
      let key = '';
      let label = '';
      if (period === 'year') {
        key = format(date, 'yyyy');
        label = `${key}年`;
      } else if (period === 'month') {
        key = format(date, 'yyyy-MM');
        label = format(date, 'yyyy年M月');
      } else if (period === 'week') {
        // 週番号で集計（年-週番号）
        const week = Number(format(date, 'I')); // ISO week number
        key = `${format(date, 'yyyy')}-W${week}`;
        label = `${format(date, 'yyyy年M月')}第${week}週`;
      }
      if (!map[key]) {
        map[key] = { label, income: 0, expense: 0, balance: 0 };
      }
      if (t.type === 'income') {
        map[key].income += t.amount;
      } else if (t.type === 'expense') {
        map[key].expense += t.amount;
      }
      map[key].balance = map[key].income - map[key].expense;
    });
    // ラベル順に並べる
    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredTransactions, period]);

  // 収支の増減に応じて色分け・アニメーションを付与する関数
  const getBalanceBarColor = (balance: number) => {
    if (balance > 0) return '#3B82F6'; // 青
    if (balance < 0) return '#EF4444'; // 赤
    return '#A3A3A3'; // グレー
  };

  // 棒グラフのアニメーション設定例
  const barAnimation = {
    isAnimationActive: true,
    animationDuration: 1200,
  };

  return (
    <div className="pb-20 space-y-8">
      {/* 予定/実際切り替えボタン（この位置でsticky固定） */}
      <div className="sticky top-0 z-20 bg-white/90 border-b border-gray-200 flex items-center justify-center py-3 mb-4 shadow-sm">
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded font-bold transition-colors duration-150 ${showMock === 'actual' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
            onClick={() => setShowMock('actual')}
          >
            実際の収支
          </button>
          <button
            className={`px-4 py-2 rounded font-bold transition-colors duration-150 ${showMock === 'mock' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-pink-100'}`}
            onClick={() => setShowMock('mock')}
          >
            予定の収支
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>月別カテゴリ別収支割合</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4">
            <select
              id="month-select"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="border-2 border-blue-300 rounded px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm"
              style={{ minWidth: '140px' }}
            >
              {months.map(month => (
                <option key={month} value={month}>
                  {format(parseISO(month + '-01'), 'yyyy年M月')}
                </option>
              ))}
            </select>
          </div>
          {selectedMonthCategoryData.length === 0 ? (
            <div className="text-center text-gray-500">データがありません</div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 bg-red-50 rounded-xl p-4">
                <div className="font-bold mb-2 flex items-center justify-between">
                  <span>支出割合</span>
                  <span className="text-red-600 text-base font-semibold ml-2">合計：¥{selectedMonthCategoryData.reduce((sum, d) => sum + d.expense, 0).toLocaleString()}</span>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={selectedMonthCategoryData.filter(d => d.expense > 0)}
                      dataKey="expense"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ category, percent }) =>
                        percent > 0.05 ? `${category} ${(percent * 100).toFixed(0)}%` : ''
                      }
                      labelLine={false}
                      className="text-[9px]"
                    >
                      {selectedMonthCategoryData.filter(d => d.expense > 0).map((entry, idx) => (
                        <Cell key={entry.category} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 bg-green-50 rounded-xl p-4">
                <div className="font-bold mb-2 flex items-center justify-between">
                  <span>収入割合</span>
                  <span className="text-green-600 text-base font-semibold ml-2">合計：¥{selectedMonthCategoryData.reduce((sum, d) => sum + d.income, 0).toLocaleString()}</span>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={selectedMonthCategoryData.filter(d => d.income > 0)}
                      dataKey="income"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ category, percent }) =>
                        percent > 0.05 ? `${category} ${(percent * 100).toFixed(0)}%` : ''
                      }
                      labelLine={false}
                      className="text-[9px]"
                    >
                      {selectedMonthCategoryData.filter(d => d.income > 0).map((entry, idx) => (
                        <Cell key={entry.category} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>月別収支推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" fill="#22C55E" name="収入" />
              <Bar dataKey="expense" fill="#EF4444" name="支出" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22C55E" name="収入" />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" name="支出" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 収入・支出の比較グラフ（積み上げ棒グラフ）に色分け・アニメーション */}
      <Card>
        <CardHeader>
          <CardTitle>収入・支出の比較（積み上げグラフ）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" stackId="a" fill="#22C55E" name="収入" {...barAnimation} />
              <Bar dataKey="expense" stackId="a" fill="#EF4444" name="支出" {...barAnimation} />
              {/* 収支バーは月ごとに色分け */}
              <Bar
                dataKey="balance"
                name="収支"
                {...barAnimation}
                fill="#A3A3A3"
                // カスタム色分け
                >
                {monthlyData.map((entry, idx) => (
                  <Cell key={`cell-balance-${idx}`} fill={getBalanceBarColor(entry.balance)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="text-gray-500 mt-2">
            ※「収支」は収入−支出の差額です。プラスなら青、マイナスなら赤で表示されます。
          </div>
        </CardContent>
      </Card>

      {/* 貯蓄残高の推移グラフ（折れ線グラフ） */}
      <Card>
        <CardHeader>
          <CardTitle>貯蓄残高の推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={savingsHistory}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="balance" stroke="#22C55E" name="貯蓄残高" />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-gray-500 mt-2">
            ※各月末時点の貯蓄残高を表示しています。
          </div>
        </CardContent>
      </Card>

      {/* 期間指定集計グラフにも色分け・アニメーション */}
      <Card>
        <CardHeader>
          <CardTitle>期間指定集計グラフ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <span>集計単位：</span>
            <button
              className={`px-3 py-1 rounded ${period === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              onClick={() => setPeriod('week')}
            >
              週
            </button>
            <button
              className={`px-3 py-1 rounded ${period === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              onClick={() => setPeriod('month')}
            >
              月
            </button>
            <button
              className={`px-3 py-1 rounded ${period === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              onClick={() => setPeriod('year')}
            >
              年
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={periodData}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" fill="#22C55E" name="収入" {...barAnimation} />
              <Bar dataKey="expense" fill="#EF4444" name="支出" {...barAnimation} />
              <Bar
                dataKey="balance"
                name="収支"
                {...barAnimation}
                fill="#A3A3A3"
              >
                {periodData.map((entry, idx) => (
                  <Cell key={`cell-period-balance-${idx}`} fill={getBalanceBarColor(entry.balance)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="text-gray-500 mt-2">
            ※週・月・年ごとの収入・支出・収支を切り替えて比較できます。収支は増減で色分けされます。
          </div>
        </CardContent>
      </Card>
    </div>
  );
};