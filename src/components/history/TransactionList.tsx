import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAppStore } from '@/store/useAppStore';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, Pencil, Trash2 } from 'lucide-react';
import { useSnackbar } from '@/hooks/use-toast';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { ScenarioSelector } from '@/components/ui/scenario-selector';

export const TransactionList = () => {
  const { transactions, deleteTransaction, updateTransaction, deleteTransactions } = useTransactionStore();
  const { selectedMonth } = useAppStore();
  const { showSnackbar } = useSnackbar();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    memo: '',
    date: '',
    isMock: false,
  });
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');

  const filteredTransactions = transactions.filter(t => 
    t.date.startsWith(selectedMonth)
  );

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'M月d日(E)', { locale: ja });
  };

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      ...transaction,
      amount: transaction.amount.toString(),
      isMock: !!transaction.isMock,
    });
    setSelectedScenarioId(transaction.scenario_id || '');
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDelete = async (transaction: Transaction) => {
    if (window.confirm('この収支を削除してもよろしいですか？')) {
      try {
        await deleteTransaction(transaction.id);
        showSnackbar('収支を削除しました');
      } catch {
        showSnackbar('削除に失敗しました', 'destructive');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !editingTransaction || !formData.date) {
      showSnackbar('エラー', 'destructive');
      return;
    }

    try {
      const updateData = {
        ...formData,
        amount: parseInt(formData.amount),
        scenario_id: formData.isMock ? selectedScenarioId : undefined,
      };
      await updateTransaction({
        ...editingTransaction,
        type: updateData.type,
        amount: updateData.amount,
        category: updateData.category,
        memo: updateData.memo,
        date: updateData.date,
        scenario_id: updateData.scenario_id,
      });
      
      showSnackbar('収支を更新しました');
      
      setIsDialogOpen(false);
      setEditingTransaction(null);
    } catch {
      showSnackbar('更新に失敗しました', 'destructive');
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleBulkDelete = async () => {
    setIsConfirmDialogOpen(false);
    try {
      await deleteTransactions(selectedIds);
      setSelectedIds([]);
      setIsBulkSelectMode(false);
      showSnackbar('選択した収支を削除しました', 'default');
    } catch {
      showSnackbar('一括削除に失敗しました', 'destructive');
    }
  };

  if (filteredTransactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>この月の記録はありません</p>
      </div>
    );
  }

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        {!isBulkSelectMode ? (
          <Button variant="outline" size="sm" onClick={() => setIsBulkSelectMode(true)}>
            一括選択モード
          </Button>
        ) : (
          <Button variant="destructive" size="sm" onClick={() => { setIsBulkSelectMode(false); setSelectedIds([]); }}>
            一括選択解除
          </Button>
        )}
      </div>
      {Object.entries(groupedTransactions)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, dayTransactions]) => (
          <div key={date}>
            <h3 className="font-medium text-gray-600 mb-2 px-1">
              {formatDate(date)}
            </h3>
            <div className="space-y-2">
              {dayTransactions.map((transaction) => (
                <Card key={transaction.id} className={`shadow-sm ${isBulkSelectMode && selectedIds.includes(transaction.id) ? 'ring-2 ring-blue-400' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isBulkSelectMode && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(transaction.id)}
                            onChange={e => {
                              setSelectedIds(ids =>
                                e.target.checked
                                  ? [...ids, transaction.id]
                                  : ids.filter(id => id !== transaction.id)
                              );
                            }}
                            className="mr-2 w-6 h-6 min-w-[1.5rem] min-h-[1.5rem] accent-blue-500 rounded border-gray-300 focus:ring-2 focus:ring-blue-400"
                            style={{ boxSizing: 'border-box' }}
                          />
                        )}
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'income' 
                            ? 'bg-green-100' 
                            : 'bg-red-100'
                        }`}>
                          {transaction.type === 'income' ? (
                            <ArrowUpCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.category}
                          </p>
                          {transaction.memo && (
                            <p className="text-gray-500 mt-1">
                              {transaction.memo}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className={`font-bold ${
                          transaction.type === 'income' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}¥{formatAmount(transaction.amount)}
                        </p>
                        {!isBulkSelectMode && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(transaction)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      {isBulkSelectMode && (
        <div className="fixed right-6 z-[100] flex flex-col items-end space-y-2" style={{ bottom: '5rem' }}>
          <Button
            variant="destructive"
            size="lg"
            disabled={selectedIds.length === 0}
            onClick={() => setIsConfirmDialogOpen(true)}
          >
            {selectedIds.length}件を削除
          </Button>
        </div>
      )}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>本当に削除しますか？</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-700">
            <div>選択件数: <b>{selectedIds.length}</b></div>
            {selectedIds.length > 0 && (
              <div>
                <span>期間: </span>
                <b>
                  {(() => {
                    const sel = filteredTransactions.filter(t => selectedIds.includes(t.id));
                    if (sel.length === 0) return '-';
                    const dates = sel.map(t => t.date).sort();
                    return dates[0] === dates[dates.length-1]
                      ? dates[0]
                      : `${dates[0]} ~ ${dates[dates.length-1]}`;
                  })()}
                </b>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* 編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction && format(new Date(editingTransaction.date), 'M月d日(E)', { locale: ja })}の記録を編集
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>種類</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as 'income' | 'expense' })}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense">支出</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income">収入</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>金額</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="金額を入力"
              />
            </div>

            <div className="space-y-2">
              <Label>カテゴリー</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {(formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>メモ</Label>
              <Textarea
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="メモを入力（任意）"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">日付</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            {formData.isMock && (
              <div className="space-y-2">
                <Label htmlFor="scenario">シナリオ</Label>
                <ScenarioSelector
                  value={selectedScenarioId}
                  onValueChange={setSelectedScenarioId}
                  placeholder="シナリオを選択してください"
                  className="bg-white"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                キャンセル
              </Button>
              <Button type="submit">
                更新
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};