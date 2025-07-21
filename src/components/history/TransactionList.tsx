import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Transaction } from '@/lib/domain/Transaction';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useScenarioStore } from '@/store/useScenarioStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, TrendingUp, TrendingDown } from 'lucide-react';
import { ScenarioSelector } from '@/components/ui/scenario-selector';
import { useVirtualizer } from '@tanstack/react-virtual';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
  showScenarioSelector?: boolean;
}

// 仮想化されたトランザクションアイテム
const VirtualizedTransactionItem = ({ 
  transaction, 
  onDelete, 
  onEdit, 
  style 
}: { 
  transaction: Transaction; 
  onDelete?: (id: string) => void; 
  onEdit?: (transaction: Transaction) => void;
  style: React.CSSProperties;
}) => {
  const isExpense = transaction.amount < 0;
  const amount = Math.abs(transaction.amount);
  
  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-2 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`p-1 rounded-full ${isExpense ? 'bg-red-100' : 'bg-green-100'}`}>
                  {isExpense ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <h3 className="font-medium text-gray-900 truncate">{transaction.description}</h3>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{format(new Date(transaction.date), 'M月d日 (E)', { locale: ja })}</span>
                <div className="flex items-center space-x-2">
                  {transaction.category && (
                    <Badge variant="secondary" className="text-xs">
                      {transaction.category}
                    </Badge>
                  )}
                  {transaction.scenario_name && (
                    <Badge variant="outline" className="text-xs">
                      {transaction.scenario_name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <span className={`font-bold text-lg ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                ¥{amount.toLocaleString()}
              </span>
              
              <div className="flex space-x-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(transaction)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(transaction.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const TransactionList = ({ 
  transactions, 
  onDelete, 
  onEdit, 
  showScenarioSelector = false 
}: TransactionListProps) => {
  const { selectedScenarioId, setSelectedScenarioId } = useTransactionStore();
  const { scenarios } = useScenarioStore();
  
  // メモ化: フィルタリングされたトランザクション
  const filteredTransactions = useMemo(() => {
    if (!selectedScenarioId) return transactions;
    return transactions.filter(t => t.scenario_id === selectedScenarioId);
  }, [transactions, selectedScenarioId]);

  // メモ化: 日付ごとにグループ化
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
    filteredTransactions.forEach(transaction => {
      const dateKey = format(new Date(transaction.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, transactions]) => ({
        date,
        transactions,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0)
      }));
  }, [filteredTransactions]);

  // 仮想化の設定
  const parentRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      // 仮想化の初期化
    }
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: groupedTransactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // 各グループの推定高さ
    overscan: 5, // オーバースキャン
  });

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        トランザクションがありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showScenarioSelector && scenarios.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            シナリオで絞り込み
          </label>
          <ScenarioSelector
            value={selectedScenarioId}
            onValueChange={setSelectedScenarioId}
            placeholder="すべてのシナリオ"
          />
        </div>
      )}

      <div 
        ref={parentRef}
        className="h-[600px] overflow-auto"
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const group = groupedTransactions[virtualRow.index];
            const isExpense = group.totalAmount < 0;
            const totalAmount = Math.abs(group.totalAmount);
            
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-700">
                      {format(new Date(group.date), 'M月d日 (E)', { locale: ja })}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                        ¥{totalAmount.toLocaleString()}
                      </span>
                      <Badge variant={isExpense ? 'destructive' : 'default'}>
                        {isExpense ? '支出' : '収入'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {group.transactions.map((transaction) => (
                      <VirtualizedTransactionItem
                        key={transaction.id}
                        transaction={transaction}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        style={{ height: 'auto' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};