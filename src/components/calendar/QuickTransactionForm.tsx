import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSnackbar } from '@/hooks/use-toast';
import { useCategoryStore } from '@/store/useCategoryStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { format } from 'date-fns';
import { Transaction } from '@/types';

export interface QuickTransactionFormProps {
  mode: 'add' | 'edit' | 'copy';
  selectedDate: Date;
  editingTransaction?: Transaction | null;
  copyingTransaction?: Transaction | null;
  onEditCancel?: () => void;
  onCopyFinish?: () => void;
  // Test-specific props for direct state manipulation
  testInitialFormData?: {
    type?: 'income' | 'expense';
    amount?: string;
    category?: string;
    memo?: string;
    isMock?: boolean;
    date?: string;
  };
  testUseSimpleSelect?: boolean;
}

export const QuickTransactionForm = ({ 
  mode,
  selectedDate, 
  editingTransaction: externalEditingTransaction = null,
  copyingTransaction = null,
  onEditCancel,
  onCopyFinish,
  testInitialFormData,
  testUseSimpleSelect
}: QuickTransactionFormProps) => {
  const { addTransaction, updateTransaction, transactions } = useTransactionStore();
  const { showSnackbar } = useSnackbar();
  const { categories: userCategories, fetchCategories: fetchUserCategories } = useCategoryStore();
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
  // budget summary removed: budgets are managed independently of transactions now
  
  const [lastAction, setLastAction] = useState<'add' | 'update' | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 編集トランザクションまたは日付が変わった時にformDataを初期化
  useEffect(() => {
    console.log('QuickTransactionForm useEffect - mode:', mode, 'copyingTransaction:', copyingTransaction, 'externalEditingTransaction:', externalEditingTransaction);
    
    // Use test props if available (for testing only)
    if (testInitialFormData) {
      const newFormData = {
        type: testInitialFormData.type || 'expense',
        amount: testInitialFormData.amount || '',
        category: testInitialFormData.category || '',
        memo: testInitialFormData.memo || '',
        isMock: testInitialFormData.isMock || false,
        date: testInitialFormData.date || format(selectedDate, 'yyyy-MM-dd'),
      };
      setFormData(newFormData);
      console.log('QuickTransactionForm: setFormData (test)', newFormData);
      return;
    }
    
    if (mode === 'edit' && externalEditingTransaction) {
      setEditingTransaction(externalEditingTransaction);
      const newFormData = {
        type: externalEditingTransaction.type as 'income' | 'expense',
        amount: externalEditingTransaction.amount.toString(),
        category: externalEditingTransaction.category,
        memo: externalEditingTransaction.memo || '',
        isMock: !!externalEditingTransaction.isMock,
        date: externalEditingTransaction.date,
      };
      setFormData(newFormData);
      console.log('QuickTransactionForm: setFormData (edit)', newFormData);
    } else if (mode === 'copy' && copyingTransaction) {
      setEditingTransaction(null);
      const newFormData = {
        type: copyingTransaction.type as 'income' | 'expense',
        amount: copyingTransaction.amount.toString(),
        category: copyingTransaction.category,
        memo: copyingTransaction.memo || '',
        isMock: !!copyingTransaction.isMock,
        date: format(selectedDate, 'yyyy-MM-dd'),
      };
      setFormData(newFormData);
      console.log('QuickTransactionForm: setFormData (copy)', newFormData);
    } else if (mode === 'add' && !externalEditingTransaction && !copyingTransaction) {
      setEditingTransaction(null);
      const newFormData = {
        type: 'expense' as 'income' | 'expense',
        amount: '',
        category: '',
        memo: '',
        isMock: false,
        date: format(selectedDate, 'yyyy-MM-dd'),
      };
      setFormData(newFormData);
      console.log('QuickTransactionForm: setFormData (add)', newFormData);
    }
  }, [mode, externalEditingTransaction, copyingTransaction, testInitialFormData, selectedDate]);

  // テスト用: testInitialFormData.categoryがあれば強制的にformData.categoryを再セット（Radix UI Select対策）
  useEffect(() => {
    if (testInitialFormData && typeof testInitialFormData.category === 'string') {
      setFormData((prev) => ({ ...prev, category: testInitialFormData.category || '' }));
    }
  }, [testInitialFormData?.category, testInitialFormData]);

  // タイプ変更時のカテゴリー整合性チェック
  useEffect(() => {
    if (formData.category && formData.type) {
      // compute available categories (user-defined + built-in + transaction history)
      const fromUser = (userCategories || []).filter(c => c.type === formData.type).map(c => c.name);
      const fallbackCats = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      const fromTx = Array.from(new Set((transactions || []).filter(t => t.type === formData.type && t.category).map(t => t.category)));
      const categories = Array.from(new Set([...(fromUser || []), ...fallbackCats, ...fromTx]));
      const categoryExists = (categories as readonly string[]).includes(formData.category);

      if (!categoryExists) {
        console.log('QuickTransactionForm: カテゴリーが現在のタイプに存在しない:', {
          type: formData.type,
          category: formData.category,
          availableCategories: categories
        });
        // 編集モードでない場合かつexternalEditingTransactionがnullの場合のみカテゴリーをリセット
        if (!editingTransaction && !externalEditingTransaction) {
          setFormData(prev => ({ ...prev, category: '' }));
        }
      }
    }
  }, [formData.type, formData.category, editingTransaction, externalEditingTransaction]);

  // available categories for select UI (stable reference)
  const availableCategories = useMemo(() => {
    const fromUser = (userCategories || []).filter(c => c.type === formData.type).map(c => c.name);
    const fromBuilt = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const fromTx = Array.from(new Set((transactions || []).filter(t => t.type === formData.type && t.category).map(t => t.category)));
    return Array.from(new Set([...(fromUser || []), ...fromBuilt, ...fromTx]));
  }, [userCategories, transactions, formData.type]);

  useEffect(() => {
    console.log('QuickTransactionForm mounted');
    // load user categories once so forms prefer them
    fetchUserCategories().catch(() => {});
    return () => {
      console.log('QuickTransactionForm unmounted');
    };
  }, []);

  // budget summary effect removed

  // 外部からeditingTransactionが渡されたら内部stateに反映
  useEffect(() => {
    if (externalEditingTransaction) {
      setEditingTransaction(externalEditingTransaction);
    } else if (externalEditingTransaction === null) {
      setEditingTransaction(null);
    }
  }, [externalEditingTransaction]);

  // externalEditingTransactionがnullになったらフォームをリセット（ただしmode=editの場合は除く）
  useEffect(() => {
    console.log('QuickTransactionForm: externalEditingTransaction is null, resetting form');
    if (externalEditingTransaction === null && mode !== 'edit') {
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
  }, [externalEditingTransaction, selectedDate, mode]);

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
    }
  }, [editingTransaction]);

  // コピー用トランザクションが渡されたらフォームにセット（新規追加モード）
  useEffect(() => {
    if (copyingTransaction) {
      setEditingTransaction(null);
      setFormData({
        type: copyingTransaction.type as 'income' | 'expense',
        amount: copyingTransaction.amount.toString(),
        category: copyingTransaction.category,
        memo: copyingTransaction.memo || '',
        isMock: !!copyingTransaction.isMock,
        date: format(selectedDate, 'yyyy-MM-dd'), // コピー時は選択中日付に
      });
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
      // budget check removed — budgets are now independent of transactions
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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1400]">
          <div className="bg-green-500 text-white px-6 py-2 rounded shadow font-bold animate-fade-in-out">
            {lastAction === 'update' ? '更新完了' : lastAction === 'add' ? '追加完了' : ''}
          </div>
        </div>
      )}
      {/* エラートースト */}
      {errorToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1400]">
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
              onValueChange={(value) => {
                const newType = value as 'income' | 'expense';
                // タイプ変更時にカテゴリーをリセット（編集モード以外）
                const shouldResetCategory = !editingTransaction && !externalEditingTransaction;
                setFormData({
                  ...formData,
                  type: newType,
                  category: shouldResetCategory ? '' : formData.category
                });
              }}
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
          <>
            <div className="space-y-2">
              <Label>日付</Label>
              <Input
                className="bg-white"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>区分</Label>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="isMock"
                    value="false"
                    checked={!formData.isMock}
                    onChange={() => setFormData({ ...formData, isMock: false })}
                  />
                  <span>実際</span>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="isMock"
                    value="true"
                    checked={formData.isMock}
                    onChange={() => setFormData({ ...formData, isMock: true })}
                  />
                  <span>予定</span>
                </label>
              </div>
            </div>
          </>
        )}
        {/* 追加モードの時も区分を選択可能にする */}
        {!editingTransaction && (
          <div className="space-y-2">
            <Label>区分</Label>
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="isMock"
                  value="false"
                  checked={!formData.isMock}
                  onChange={() => setFormData({ ...formData, isMock: false })}
                />
                <span>実際</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="isMock"
                  value="true"
                  checked={formData.isMock}
                  onChange={() => setFormData({ ...formData, isMock: true })}
                />
                <span>予定</span>
              </label>
            </div>
          </div>
        )}
        

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
          {testUseSimpleSelect ? (
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              data-testid="test-category-select"
            >
              <option value="">カテゴリーを選択</option>
              {((userCategories && userCategories.length > 0) ? userCategories.filter(c => c.type === formData.type).map(c => c.name) : (formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)).map((cat) => (
                <option key={cat} value={String(cat)}>
                  {cat}
                </option>
              ))}
            </select>
          ) : (
            <Select
              key={`${formData.type}-select`}
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="カテゴリーを選択" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const categoryExists = (availableCategories as readonly string[]).includes(formData.category);
                  console.log('QuickTransactionForm: [Select debug]', {
                    type: formData.type,
                    category: formData.category,
                    categoryExists,
                    editMode: !!editingTransaction,
                    availableCategories
                  });
                  return null;
                })()}
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={String(cat)}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* Budget summary removed */}
        </div>

        {/* フォーム内のScenarioSelector部分を削除 */}

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