import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface SummaryCardsProps {
  income: number;
  expense: number;
  balance: number;
  onRefresh?: () => void;
}

// メモ化されたサマリーカードコンポーネント
export const SummaryCards = memo(({ 
  income, 
  expense, 
  balance, 
  onRefresh 
}: SummaryCardsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">今月の収支</h2>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            更新
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 収入カード */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">収入</p>
                  <p className="text-2xl font-bold text-green-700">
                    ¥{income.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 支出カード */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">支出</p>
                  <p className="text-2xl font-bold text-red-700">
                    ¥{expense.toLocaleString()}
                  </p>
                </div>
                <div className="bg-red-500 p-3 rounded-full">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 残高カード */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`bg-gradient-to-br ${
            balance >= 0 
              ? 'from-blue-50 to-blue-100 border-blue-200' 
              : 'from-orange-50 to-orange-100 border-orange-200'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">残高</p>
                  <p className={`text-2xl font-bold ${
                    balance >= 0 ? 'text-blue-700' : 'text-orange-700'
                  }`}>
                    ¥{balance.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  balance >= 0 ? 'bg-blue-500' : 'bg-orange-500'
                }`}>
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
});

SummaryCards.displayName = 'SummaryCards';