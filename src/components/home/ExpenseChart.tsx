import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ExpenseChartProps {
  categoryData: Array<{ category: string; amount: number }>;
  dailyData: Array<{ date: string; amount: number }>;
}

// メモ化された支出チャートコンポーネント
export const ExpenseChart = memo(({ categoryData, dailyData }: ExpenseChartProps) => {
  // メモ化: カテゴリー別の割合計算
  const categoryPercentages = useMemo(() => {
    const total = categoryData.reduce((sum, item) => sum + item.amount, 0);
    return categoryData.map(item => ({
      ...item,
      percentage: total > 0 ? (item.amount / total) * 100 : 0
    }));
  }, [categoryData]);

  // メモ化: 日別データの集計
  const chartData = useMemo(() => {
    return dailyData.map(item => ({
      ...item,
      isExpense: item.amount < 0,
      absAmount: Math.abs(item.amount)
    }));
  }, [dailyData]);

  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">支出分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            支出データがありません
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* カテゴリー別支出 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">カテゴリー別支出</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryPercentages.map((item, index) => (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="min-w-[60px] text-center">
                      {item.category}
                    </Badge>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ delay: 0.2 + index * 0.1, duration: 0.8 }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700 min-w-[80px] text-right">
                    ¥{item.amount.toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 日別収支チャート */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">日別収支</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chartData.slice(-7).map((item, index) => (
                <motion.div
                  key={item.date}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 min-w-[80px]">
                      {new Date(item.date).getDate()}日
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <motion.div
                        className={`h-3 rounded-full ${
                          item.isExpense ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.min((item.absAmount / 10000) * 100, 100)}%` 
                        }}
                        transition={{ delay: 0.5 + index * 0.05, duration: 0.6 }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${
                    item.isExpense ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {item.isExpense ? '-' : '+'}¥{item.absAmount.toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
});

ExpenseChart.displayName = 'ExpenseChart';