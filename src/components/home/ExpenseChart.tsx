import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAppStore } from '@/store/useAppStore';
import { CategorySummary } from '@/types';
import { useState } from 'react';

const COLORS = [
  '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
];

export const ExpenseChart = () => {
  const { transactions } = useTransactionStore();
  const { selectedMonth } = useAppStore();

  // ポップアップ状態
  const [popup, setPopup] = useState<{category: string, amount: number, x: number, y: number} | null>(null);

  const monthExpenses = transactions.filter(t => 
    t.type === 'expense' && t.date.startsWith(selectedMonth)
  );

  const categoryData: CategorySummary[] = monthExpenses.reduce((acc, transaction) => {
    const existingCategory = acc.find(item => item.category === transaction.category);
    if (existingCategory) {
      existingCategory.amount += transaction.amount;
    } else {
      acc.push({
        category: transaction.category,
        amount: transaction.amount,
        color: COLORS[acc.length % COLORS.length]
      });
    }
    return acc;
  }, [] as CategorySummary[]);

  const formatAmount = (value: number) => {
    return `¥${value.toLocaleString('ja-JP')}`;
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: CategorySummary }[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-medium">{data.category}</p>
          <p className="text-gray-600">{formatAmount(data.amount)}</p>
        </div>
      );
    }
    return null;
  };

  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">支出内訳</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>今月の支出データがありません</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">支出内訳</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="amount"
                label={() => null}
                labelLine={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {categoryData.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
              onClick={e => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setPopup({
                  category: item.category,
                  amount: item.amount,
                  x: rect.left + rect.width / 2,
                  y: rect.top
                });
              }}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.category}</span>
              </div>
              <span className="font-medium">{formatAmount(item.amount)}</span>
            </div>
          ))}
          {/* ポップアップ */}
          {popup && (
            <div
              className="fixed z-50 bg-white border shadow-lg rounded-lg px-4 py-2 text-sm font-medium animate-fade-in"
              style={{ left: popup.x, top: popup.y - 48, transform: 'translate(-50%, -100%)' }}
              onClick={() => setPopup(null)}
            >
              <div className="text-gray-700">{popup.category}</div>
              <div className="text-gray-500">{formatAmount(popup.amount)}</div>
              <div className="text-xs text-blue-500 mt-1">タップで閉じる</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};