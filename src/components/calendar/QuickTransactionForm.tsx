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
import { CoinAnimation } from '@/components/ui/coin-animation';

interface QuickTransactionFormProps {
  selectedDate: Date;
  onTransactionAdded: () => void;
  editingTransaction?: Transaction | null;
  onEditCancel?: () => void;
}

export const QuickTransactionForm = ({ 
  selectedDate, 
  onTransactionAdded,
  editingTransaction: externalEditingTransaction = null,
  onEditCancel
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
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<{
    date: string;
    type: 'income' | 'expense';
    amount: string;
    category: string;
    memo: string;
  } | null>(null);

  // 外部からeditingTransactionが渡されたら内部stateに反映
  useEffect(() => {
    if (externalEditingTransaction) {
      setEditingTransaction(externalEditingTransaction);
    }
  }, [externalEditingTransaction]);

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
    if (isSubmitting) return;
    if (!formData.amount || !formData.category) {
      toast({
        title: 'エラー',
        description: '金額とカテゴリーを入力してください',
        variant: 'destructive',
      });
      return;
    }
    const submitData = {
      date: format(selectedDate, 'yyyy-MM-dd'),
      type: formData.type,
      amount: formData.amount,
      category: formData.category,
      memo: formData.memo,
    };
    if (
      lastSubmitted &&
      lastSubmitted.date === submitData.date &&
      lastSubmitted.type === submitData.type &&
      lastSubmitted.amount === submitData.amount &&
      lastSubmitted.category === submitData.category &&
      lastSubmitted.memo === submitData.memo
    ) {
      // 直前と同じ内容なら無視
      return;
    }
    setIsSubmitting(true);
    setLastSubmitted(submitData);
    try {
      if (editingTransaction) {
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
        await addTransaction({
          date: submitData.date,
          type: submitData.type,
          amount: Number(submitData.amount),
          category: submitData.category,
          memo: submitData.memo,
        });
        toast({
          title: '追加完了',
          description: '収支を追加しました',
        });
        setShowCoinAnimation(true);
      }
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
    } finally {
      setIsSubmitting(false);
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
    if (onEditCancel) onEditCancel();
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded shadow">
      <CoinAnimation
        trigger={showCoinAnimation}
        onComplete={() => setShowCoinAnimation(false)}
      />
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
          <Button type="submit" disabled={isSubmitting}>
            {editingTransaction ? '更新' : '追加'}
          </Button>
        </div>
      </form>
    </div>
  );
};