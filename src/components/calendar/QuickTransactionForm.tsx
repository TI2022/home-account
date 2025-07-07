import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSnackbar } from '@/hooks/use-toast';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { format } from 'date-fns';
import { Transaction } from '@/types';
import { ScenarioSelector } from '@/components/ui/scenario-selector';

interface QuickTransactionFormProps {
  selectedDate: Date;
  editingTransaction?: Transaction | null;
  onEditCancel?: () => void;
  copyingTransaction?: Transaction | null;
  onCopyFinish?: () => void;
}

export const QuickTransactionForm = ({ 
  selectedDate, 
  editingTransaction: externalEditingTransaction = null,
  onEditCancel,
  copyingTransaction = null,
  onCopyFinish
}: QuickTransactionFormProps) => {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { showSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    memo: '',
    isMock: false,
    date: format(selectedDate, 'yyyy-MM-dd'),
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<{
    date: string;
    type: 'income' | 'expense';
    amount: string;
    category: string;
    memo: string;
  } | null>(null);
  const [successToastOpen, setSuccessToastOpen] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'add' | 'update' | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');

  // 外部からeditingTransactionが渡されたら内部stateに反映
  useEffect(() => {
    console.log('QuickTransactionForm: externalEditingTransaction changed:', externalEditingTransaction);
    if (externalEditingTransaction) {
      setEditingTransaction(externalEditingTransaction);
    }
  }, [externalEditingTransaction]);

  // externalEditingTransactionがnullになったらフォームをリセット
  useEffect(() => {
    console.log('QuickTransactionForm: externalEditingTransaction is null, resetting form');
    if (externalEditingTransaction === null) {
      setEditingTransaction(null);
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        memo: '',
        isMock: false,
        date: format(selectedDate, 'yyyy-MM-dd'),
      });
    }
  }, [externalEditingTransaction, selectedDate]);

  // 編集モードの場合、フォームに既存のデータをセット
  useEffect(() => {
    console.log('QuickTransactionForm: editingTransaction changed:', editingTransaction);
    if (editingTransaction) {
      console.log('QuickTransactionForm: Setting form data for editing:', editingTransaction);
      setFormData({
        type: editingTransaction.type,
        amount: editingTransaction.amount.toString(),
        category: editingTransaction.category,
        memo: editingTransaction.memo || '',
        isMock: !!editingTransaction.isMock,
        date: editingTransaction.date,
      });
      setSelectedScenarioId(editingTransaction.scenario_id || '');
    }
  }, [editingTransaction]);

  // コピー用トランザクションが渡されたらフォームにセット（新規追加モード）
  useEffect(() => {
    if (copyingTransaction) {
      setEditingTransaction(null);
      setFormData({
        type: copyingTransaction.type,
        amount: copyingTransaction.amount.toString(),
        category: copyingTransaction.category,
        memo: copyingTransaction.memo || '',
        isMock: !!copyingTransaction.isMock,
        date: format(selectedDate, 'yyyy-MM-dd'), // コピー時は選択中日付に
      });
      setSelectedScenarioId(copyingTransaction.scenario_id || '');
      if (onCopyFinish) onCopyFinish();
    }
  }, [copyingTransaction, selectedDate, onCopyFinish]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.amount || !formData.category) {
      showSnackbar('エラー', 'destructive');
      return;
    }
    const submitData = {
      date: editingTransaction ? formData.date : format(selectedDate, 'yyyy-MM-dd'),
      type: formData.type,
      amount: formData.amount,
      category: formData.category,
      memo: formData.memo,
      isMock: formData.isMock,
      scenario_id: formData.isMock ? selectedScenarioId : undefined,
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
        console.log('Editing transaction:', {
          original: editingTransaction,
          formData,
          type: editingTransaction.type
        });
        await updateTransaction({
          ...editingTransaction,
          type: formData.type,
          amount: Number(formData.amount),
          category: formData.category,
          memo: formData.memo,
          isMock: formData.isMock,
          date: formData.date,
          scenario_id: formData.isMock ? selectedScenarioId : undefined,
        });
        setLastAction('update');
        setSuccessToastOpen(true);
        toastTimeoutRef.current = setTimeout(() => {
          setSuccessToastOpen(false);
          setLastAction(null);
        }, 1000);
      } else {
        await addTransaction({
          date: submitData.date,
          type: submitData.type,
          amount: Number(submitData.amount),
          category: submitData.category,
          memo: submitData.memo,
          isMock: submitData.isMock,
          scenario_id: submitData.scenario_id,
        });
        setLastAction('add');
        setSuccessToastOpen(true);
        toastTimeoutRef.current = setTimeout(() => {
          setSuccessToastOpen(false);
          setLastAction(null);
        }, 1000);
      }
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        memo: '',
        isMock: false,
        date: format(selectedDate, 'yyyy-MM-dd'),
      });
      setEditingTransaction(null);
      setSelectedScenarioId('');
    } catch (error: unknown) {
      console.error('Transaction operation failed:', error);
      let message = '操作に失敗しました';
      if (error && typeof error === 'object') {
        const errObj = error as { message?: string; error_description?: string };
        if ('message' in errObj && typeof errObj.message === 'string') message += `: ${errObj.message}`;
        else if ('error_description' in errObj && typeof errObj.error_description === 'string') message += `: ${errObj.error_description}`;
      }
      setErrorToast(message);
      setTimeout(() => setErrorToast(null), 3000);
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
      isMock: false,
      date: format(selectedDate, 'yyyy-MM-dd'),
    });
    if (onEditCancel) onEditCancel();
  };

  return (
    <div className={`space-y-4 p-4 rounded shadow transition-all duration-200 ${editingTransaction ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-white border border-gray-200'}`}>
      {successToastOpen && lastAction && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200]">
          <div className="bg-green-500 text-white px-6 py-2 rounded shadow font-bold animate-fade-in-out">
            {lastAction === 'update' ? '更新完了' : lastAction === 'add' ? '追加完了' : ''}
          </div>
        </div>
      )}
      {/* エラートースト */}
      {errorToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[201]">
          <div className="bg-red-500 text-white px-6 py-2 rounded shadow font-bold animate-fade-in-out">
            {errorToast}
          </div>
        </div>
      )}
      {/* フォーム */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 支出/収入ラジオボタン */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as 'income' | 'expense' })}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem className="bg-white" value="expense" id="expense" />
                <Label htmlFor="expense">支出</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem className="bg-white" value="income" id="income" />
                <Label htmlFor="income">収入</Label>
              </div>
            </RadioGroup>
            {editingTransaction && (
              <span className="ml-4 px-2 py-1 rounded text-xs font-medium bg-yellow-50 text-yellow-700 flex items-center">
                <span className="mr-1">📝</span>編集モード
              </span>
            )}
          </div>
        </div>

        {/* 編集モードの時に日付変更フィールドを表示 */}
        {editingTransaction && (
          <div className="space-y-2">
            <Label>日付</Label>
            <Input
              className="bg-white"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        )}

        <div className="flex flex-col items-center space-y-1">
          <div className="text-xs text-gray-500 mt-1">
            <span className="font-bold text-blue-500">実際の収支</span>は確定した記録、<span className="font-bold text-orange-400">予定の収支</span>は将来の予定や仮の記録です
          </div>
          <div className="flex w-full max-w-xs bg-gray-100 rounded-full p-1">
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-full font-bold transition-all
                ${!formData.isMock ? 'bg-blue-500 text-white shadow' : 'bg-white text-gray-500'}`}
              onClick={() => setFormData({ ...formData, isMock: false })}
              aria-pressed={!formData.isMock}
            >
              実際の収支
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-full font-bold transition-all
                ${formData.isMock ? 'bg-orange-400 text-white shadow' : 'bg-white text-gray-500'}`}
              onClick={() => setFormData({ ...formData, isMock: true })}
              aria-pressed={formData.isMock}
            >
              予定の収支
            </button>
          </div>
        </div>
        

        <div className="space-y-2">
          <Label>金額</Label>
          <Input
            className="bg-white"
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
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="カテゴリーを選択" />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                console.log('Rendering category select - type:', formData.type, 'category:', formData.category);
                return null;
              })()}
              {(formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <div className="space-y-2">
          <Label>メモ</Label>
          <Textarea
            className="bg-white"
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