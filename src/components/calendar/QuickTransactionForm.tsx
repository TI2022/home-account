import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { format } from 'date-fns';
import { Transaction } from '@/types';

interface QuickTransactionFormProps {
  selectedDate: Date;
  onTransactionAdded: () => void;
}

export const QuickTransactionForm = ({ 
  selectedDate, 
  onTransactionAdded
}: QuickTransactionFormProps) => {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    memo: '',
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // 編集モードの場合、フォームに既存のデータをセット
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        amount: editingTransaction.amount.toString(),
        category: editingTransaction.category,
        memo: editingTransaction.memo || '',
      });
    }
  }, [editingTransaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category) {
      toast({
        title: 'エラー',
        description: '金額とカテゴリーを入力してください',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingTransaction) {
        // 既存のトランザクションを更新
        await updateTransaction({
          ...editingTransaction,
          type: formData.type,
          amount: Number(formData.amount),
          category: formData.category,
          memo: formData.memo,
        });
        toast({
          title: '更新完了',
          description: '収支を更新しました',
        });
      } else {
        // 新しいトランザクションを追加
        await addTransaction({
          date: format(selectedDate, 'yyyy-MM-dd'),
          type: formData.type,
          amount: Number(formData.amount),
          category: formData.category,
          memo: formData.memo,
        });
        toast({
          title: '追加完了',
          description: '収支を追加しました',
        });
      }

      // フォームをリセット
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        memo: '',
      });
      setEditingTransaction(null);
      onTransactionAdded();
    } catch {
      toast({
        title: 'エラー',
        description: '操作に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      memo: '',
    });
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded shadow">
      {/* フォーム */}
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

        <div className="flex justify-end space-x-2">
          {editingTransaction && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              キャンセル
            </Button>
          )}
          <Button type="submit">
            {editingTransaction ? '更新' : '追加'}
          </Button>
        </div>
      </form>
    </div>
  );
};