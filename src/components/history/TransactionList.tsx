import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAppStore } from '@/store/useAppStore';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';

export const TransactionList = () => {
  const { transactions, deleteTransaction, updateTransaction } = useTransactionStore();
  const { selectedMonth } = useAppStore();
  const { toast } = useToast();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    memo: '',
    date: '',
  });

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
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      memo: transaction.memo || '',
      date: transaction.date,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (transaction: Transaction) => {
    if (window.confirm('この収支を削除してもよろしいですか？')) {
      try {
        await deleteTransaction(transaction.id);
        toast({
          title: '削除完了',
          description: '収支を削除しました',
        });
      } catch {
        toast({
          title: 'エラー',
          description: '削除に失敗しました',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !editingTransaction || !formData.date) {
      toast({
        title: 'エラー',
        description: '金額・カテゴリー・日付を入力してください',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateTransaction({
        ...editingTransaction,
        type: formData.type,
        amount: Number(formData.amount),
        category: formData.category,
        memo: formData.memo,
        date: formData.date,
      });
      
      toast({
        title: '更新完了',
        description: '収支を更新しました',
      });
      
      setIsDialogOpen(false);
      setEditingTransaction(null);
    } catch {
      toast({
        title: 'エラー',
        description: '更新に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingTransaction(null);
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
      {Object.entries(groupedTransactions)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, dayTransactions]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-gray-600 mb-2 px-1">
              {formatDate(date)}
            </h3>
            <div className="space-y-2">
              {dayTransactions.map((transaction) => (
                <Card key={transaction.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
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
                            <p className="text-sm text-gray-500 mt-1">
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

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