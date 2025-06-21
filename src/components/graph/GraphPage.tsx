import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSavingsStore } from '@/store/useSavingsStore';
import { useSavingsPlanStore } from '@/store/useSavingsPlanStore';
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
  const { plan } = useSavingsPlanStore();

  // 月別収支データ
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; income: number; expense: number; balance: number }> = {};
    transactions.forEach((t) => {
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
  }, [transactions]);

  // カテゴリ別支出データ
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === 'expense') {
        map[t.category] = (map[t.category] || 0) + t.amount;
      }
    });
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const COLORS = [
    '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
  ];

  // 貯蓄残高の推移データ（各月末時点の残高を計算）
  const savingsHistory = useMemo(() => {
    // 月ごとに収入・支出を集計
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    transactions.forEach((t) => {
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
    // 月順に並べて残高を累積計算
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    let balance = 0;
    const result = sorted.map(([key, { month, income, expense }]) => {
      balance += income - expense;
      return { month, balance };
    });
    // 最新の貯蓄額と一致しない場合、現在月を追加
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
  }, [transactions, savingsAmount]);

  // 目標達成率の計算
  const goal = Number(plan?.goal_amount || 0);
  const current = Number(savingsAmount || 0);
  const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  // 期間指定集計用の状態
  const [period, setPeriod] = useState<'month' | 'year' | 'week'>('month');

  // 期間ごとの集計データ
  const periodData = useMemo(() => {
    const map: Record<string, { label: string; income: number; expense: number; balance: number }> = {};
    transactions.forEach((t) => {
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
  }, [transactions, period]);

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

      <Card>
        <CardHeader>
          <CardTitle>カテゴリ別支出割合</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <div className="text-center text-gray-500">支出データがありません</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ category, percent }) =>
                    `${category} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((entry, idx) => (
                    <Cell key={entry.category} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `¥${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 space-y-1">
            {categoryData.map((item, idx) => (
              <div key={item.category} className="flex items-center space-x-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-sm">{item.category}</span>
                <span className="text-xs text-gray-500">
                  ¥{item.amount.toLocaleString()}
                </span>
              </div>
            ))}
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
          <div className="text-xs text-gray-500 mt-2">
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
          <div className="text-xs text-gray-500 mt-2">
            ※各月末時点の貯蓄残高を表示しています。
          </div>
        </CardContent>
      </Card>

      {/* 目標達成率ゲージ（進捗バー） */}
      <Card>
        <CardHeader>
          <CardTitle>目標貯蓄額の達成率</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
            <div
              className="bg-green-500 h-6 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm">
              {goal > 0
                ? `${progress.toFixed(1)}%（¥${current.toLocaleString()} / ¥${goal.toLocaleString()}）`
                : '目標未設定'}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            ※目標貯蓄額に対する現在の貯蓄額の進捗率を表示しています。
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
            <span className="text-sm">集計単位：</span>
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
          <div className="text-xs text-gray-500 mt-2">
            ※週・月・年ごとの収入・支出・収支を切り替えて比較できます。収支は増減で色分けされます。
          </div>
        </CardContent>
      </Card>
    </div>
  );
};