import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSnackbar } from '@/hooks/use-toast';
import { EXPENSE_CATEGORIES } from '@/types';
import type { RecurringExpense } from '@/types';
import { Plus, Edit, Trash2, Receipt, Calendar, CheckSquare, Square } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

export const RecurringExpenseSettings = () => {
  const { 
    recurringExpenses, 
    fetchRecurringExpenses, 
    addRecurringExpense, 
    updateRecurringExpense, 
    deleteRecurringExpense,
    reflectSingleRecurringExpenseForPeriod,
  } = useTransactionStore();
  const { showSnackbar } = useSnackbar();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    payment_schedule: [] as { month: number; day: number }[],
    description: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [allMonthsChecked, setAllMonthsChecked] = useState(false);
  const [allMonthsDay, setAllMonthsDay] = useState(27);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [expenseOrder, setExpenseOrder] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSortMode, setIsSortMode] = useState(false);
  const [failedReflects, setFailedReflects] = useState<{id: string; name: string; error: string}[]>([]);
  const [skippedReflects, setSkippedReflects] = useState<{id: string; name: string; reason: string}[]>([]);
  const [isFailedDialogOpen, setIsFailedDialogOpen] = useState(false);
  const [rakutenImportDialogOpen, setRakutenImportDialogOpen] = useState(false);
  const [rakutenImportFile, setRakutenImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<string>('');
  const [rakutenPaymentDate, setRakutenPaymentDate] = useState(() => {
    // デフォルトは翌月27日
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(27);
    return nextMonth.toISOString().slice(0, 10);
  });
  
  // 一括反映用の状態
  const [isReflectDialogOpen, setIsReflectDialogOpen] = useState(false);
  const [reflectStartDate, setReflectStartDate] = useState('');
  const [reflectEndDate, setReflectEndDate] = useState('');
  const [reflectIsMock, setReflectIsMock] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);

  // スクロール固定用の状態
  const [isButtonsFixed, setIsButtonsFixed] = useState(false);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const [buttonsOriginalTop, setButtonsOriginalTop] = useState(0);
  const [buttonsOriginalRect, setButtonsOriginalRect] = useState<{
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    fetchRecurringExpenses();
  }, [fetchRecurringExpenses]);

  // スクロールハンドラーをuseCallbackでメモ化
  const handleScroll = useCallback(() => {
    if (!buttonsContainerRef.current || buttonsOriginalTop === 0) return;
    
    const scrollY = window.scrollY;
    const shouldFix = scrollY > buttonsOriginalTop;
    
    // 状態が実際に変わる場合のみ更新
    if (shouldFix && !isButtonsFixed) {
      setIsButtonsFixed(true);
    } else if (!shouldFix && isButtonsFixed) {
      setIsButtonsFixed(false);
    }
  }, [buttonsOriginalTop, isButtonsFixed]);

  // 選択モード開始時の初期設定
  useEffect(() => {
    if (!isSelectMode) return;

    // 初期位置を設定
    const setInitialPosition = () => {
      if (buttonsContainerRef.current) {
        const rect = buttonsContainerRef.current.getBoundingClientRect();
        setButtonsOriginalTop(window.scrollY + rect.top);
        setButtonsOriginalRect({
          left: rect.left,
          width: rect.width,
        });
      }
    };

    // 少し遅延させてDOM が安定してから初期位置を設定
    const timeoutId = setTimeout(setInitialPosition, 100);
    
    return () => clearTimeout(timeoutId);
  }, [isSelectMode]);

  // スクロールイベントリスナーの登録
  useEffect(() => {
    if (!isSelectMode || buttonsOriginalTop === 0) return;

    // スロットリング用の変数
    let ticking = false;
    
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, [isSelectMode, buttonsOriginalTop, handleScroll]);

  // 選択モード終了時に固定状態をリセット
  useEffect(() => {
    if (!isSelectMode) {
      setIsButtonsFixed(false);
      setButtonsOriginalTop(0);
      setButtonsOriginalRect(null);
    }
  }, [isSelectMode]);

  // 一括反映処理
  const handleBulkReflect = async () => {
    console.log('=== 一括反映処理開始 ===');
    
    if (!reflectStartDate || !reflectEndDate) {
      showSnackbar('開始日と終了日を入力してください', 'destructive');
      return;
    }

    if (selectedExpenseIds.length === 0) {
      showSnackbar('定期支出を選択してください', 'destructive');
      return;
    }

    console.log('反映設定:', {
      reflectStartDate,
      reflectEndDate,
      reflectIsMock,
      selectedExpenseIds: selectedExpenseIds.length
    });

    setIsReflecting(true);
    setFailedReflects([]);
    setSkippedReflects([]);

    try {
      let success = 0;
      let failed = 0;

      for (const expenseId of selectedExpenseIds) {
        const expense = recurringExpenses.find(e => e.id === expenseId);
        if (!expense) {
          console.warn('定期支出が見つかりません:', expenseId);
          continue;
        }

        console.log(`定期支出反映開始: ${expense.name}`, {
          id: expenseId,
          amount: expense.amount,
          category: expense.category,
          payment_schedule: expense.payment_schedule,
          is_active: expense.is_active
        });

        try {
          await reflectSingleRecurringExpenseForPeriod(
            expenseId, 
            reflectStartDate, 
            reflectEndDate, 
            reflectIsMock
          );
          console.log(`定期支出反映成功: ${expense.name}`);
          success++;
        } catch (error) {
          console.error(`定期支出反映失敗: ${expense.name}`, error);
          setFailedReflects(prev => [...prev, {
            id: expenseId,
            name: expense.name,
            error: error instanceof Error ? error.message : '不明なエラー'
          }]);
          failed++;
        }
      }

      console.log('=== 一括反映処理完了 ===', { success, failed });

      showSnackbar(
        `反映完了: ${success}件成功${failed > 0 ? `, ${failed}件失敗` : ''}`,
        failed === 0 ? 'default' : 'destructive'
      );

      if (failed === 0) {
        setIsReflectDialogOpen(false);
        setSelectedExpenseIds([]);
        setIsSelectMode(false);
      } else {
        setIsFailedDialogOpen(true);
      }
    } catch (error) {
      console.error('Bulk reflect error:', error);
      showSnackbar('一括反映処理に失敗しました', 'destructive');
    } finally {
      setIsReflecting(false);
    }
  };

  useEffect(() => {
    setExpenseOrder(recurringExpenses.map(e => e.id));
  }, [recurringExpenses]);

  // 無効化されたものは選択リストから外す
  useEffect(() => {
    if (isSelectMode) {
      setSelectedExpenseIds(ids => ids.filter(id => {
        const expense = recurringExpenses.find(e => e.id === id);
        return expense && expense.is_active;
      }));
    }
  }, [recurringExpenses, isSelectMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      payment_schedule: [],
      description: '',
      is_active: true,
    });
    setEditingExpense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.category) {
      showSnackbar('必須項目を入力してください', 'destructive');
      return;
    }

    if (formData.payment_schedule.length === 0) {
      showSnackbar('支払月を少なくとも1つ選択してください', 'destructive');
      return;
    }

    setLoading(true);
    try {
      // payment_scheduleからfrequencyを自動算出
      const months = formData.payment_schedule.map(s => s.month).sort((a, b) => a - b);
      const payment_frequency = (months.length === 12
        ? 'monthly'
        : months.length === 4
        ? 'quarterly'
        : months.length === 1
        ? 'yearly'
        : 'custom') as 'monthly' | 'quarterly' | 'yearly' | 'custom';
      const expenseData = {
        name: formData.name,
        amount: parseInt(formData.amount),
        category: formData.category,
        payment_schedule: formData.payment_schedule,
        payment_frequency,
        description: formData.description || undefined,
        is_active: formData.is_active,
      };

      console.log('Submitting expense data:', expenseData);

      if (editingExpense) {
        await updateRecurringExpense(editingExpense, expenseData);
        showSnackbar('定期支出を更新しました');
      } else {
        await addRecurringExpense(expenseData);
        showSnackbar('定期支出を追加しました');
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Form submission error:', error);
      showSnackbar('保存に失敗しました', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense: RecurringExpense) => {
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
      payment_schedule: expense.payment_schedule || [],
      description: expense.description || '',
      is_active: expense.is_active,
    });
    setEditingExpense(expense.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この定期支出を削除しますか？')) return;

    try {
      await deleteRecurringExpense(id);
      showSnackbar('定期支出を削除しました');
    } catch {
      showSnackbar('削除に失敗しました', 'destructive');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateRecurringExpense(id, { is_active: isActive });
      showSnackbar(`定期支出を${isActive ? '有効' : '無効'}にしました`);
    } catch {
      showSnackbar('更新に失敗しました', 'destructive');
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP');
  };

  function SortableExpenseCard({ expense, children }: { expense: RecurringExpense; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: expense.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : undefined,
      opacity: isDragging ? 0.5 : 1,
      cursor: isSortMode ? 'grab' : undefined,
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...(isSortMode ? listeners : {})}>
        {children}
      </div>
    );
  }

  const handleRakutenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRakutenImportFile(file);
      setRakutenImportDialogOpen(true);
    }
  };

  const handleRakutenImport = async () => {
    if (!rakutenPaymentDate) {
      showSnackbar('支払日を選択してください', 'destructive');
      return;
    }

    console.log('楽天インポート開始:', { rakutenPaymentDate, rakutenImportFile });
    setLoading(true);
    setImportProgress('ファイルを読み込み中...');
    try {
      if (!rakutenImportFile) {
        showSnackbar('ファイルが選択されていません', 'destructive');
        return;
      }
      const text = await rakutenImportFile.text(); // ファイルオブジェクトを直接使用
      console.log('ファイル内容:', text.slice(0, 200)); // 最初の200文字のみ表示
      setImportProgress('データを解析中...');
      const lines = text.split('\n');
      const header = lines[0].split(',');
      console.log('CSVヘッダー:', header);
      const dateIndex = header.indexOf('利用日');
      const amountIndex = header.indexOf('利用金額');
      const storeIndex = header.indexOf('利用店名・商品名');
      const memoIndex = storeIndex; // 店名をメモとして使用

      const transactions: { date: string; card_used_date: string; amount: number; category: string; memo: string }[] = [];
      console.log('インデックス確認:', { dateIndex, amountIndex, storeIndex, memoIndex });
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const columns = line.split(',');
          if (columns.length > Math.max(dateIndex, amountIndex, storeIndex)) {
            let cardUsedDateStr = columns[dateIndex]?.trim() || '';
            const amountStr = columns[amountIndex]?.trim() || '';
            const memo = columns[storeIndex]?.trim() || '';
            
            // 楽天の日付形式 (2025/08/03) をISO形式 (2025-08-03) に変換
            if (cardUsedDateStr.includes('/')) {
              cardUsedDateStr = cardUsedDateStr.replace(/\//g, '-');
            }
            
            const amount = parseFloat(amountStr);
            
            console.log('データ処理:', { cardUsedDateStr, amount, memo, paymentDate: rakutenPaymentDate, line: line.slice(0, 100) });
            
            if (!isNaN(amount) && amount > 0 && cardUsedDateStr && memo) {
              transactions.push({ 
                date: rakutenPaymentDate, // 支払日
                card_used_date: cardUsedDateStr, // 利用日
                amount, 
                category: 'その他', // デフォルトカテゴリ
                memo 
              });
            }
          }
        }
      }
      
      console.log('解析されたトランザクション:', transactions);

      const failed: { id: string; name: string; error: string }[] = [];
      const skipped: { id: string; name: string; reason: string }[] = [];
      let successCount = 0;

      setImportProgress(`${transactions.length}件のトランザクションを登録中...`);
      
      // 楽天CSVの各トランザクションを直接追加
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        setImportProgress(`トランザクションを登録中... (${i + 1}/${transactions.length})`);
        try {
          // 既存トランザクションとの重複チェック
          const existing = (useTransactionStore.getState().transactions || []).find(trans =>
            trans.date === transaction.date &&
            trans.card_used_date === transaction.card_used_date &&
            trans.amount === transaction.amount &&
            trans.memo === transaction.memo &&
            trans.type === 'expense'
          );
          
          if (existing) {
            skipped.push({ 
              id: `transaction-${transaction.card_used_date}-${transaction.amount}`, 
              name: transaction.memo, 
              reason: `利用日${transaction.card_used_date}：既に同じ内容のトランザクションが存在します` 
            });
            continue;
          }

          console.log('トランザクション追加:', {
            type: 'expense',
            amount: transaction.amount,
            category: transaction.category,
            date: transaction.date,
            card_used_date: transaction.card_used_date,
            memo: transaction.memo,
            isMock: false
          });
          
          await useTransactionStore.getState().addTransaction({
            type: 'expense',
            amount: transaction.amount,
            category: transaction.category,
            date: transaction.date,
            card_used_date: transaction.card_used_date,
            memo: transaction.memo,
            isMock: false, // 楽天明細は予定ではないため
          });
          
          successCount++;
        } catch (error) {
          console.error('トランザクション追加エラー:', error);
          failed.push({ 
            id: `transaction-${transaction.date}-${transaction.amount}`, 
            name: transaction.memo, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      if (failed.length === 0 && skipped.length === 0) {
        showSnackbar(`楽天明細をインポートしました（${successCount}件）`);
      } else {
        setFailedReflects(failed);
        setSkippedReflects(skipped);
        setIsFailedDialogOpen(true);
        const message = successCount > 0 
          ? `${successCount}件インポート済み、${failed.length + skipped.length}件をスキップまたはエラー`
          : `楽天明細のインポートに失敗しました`;
        showSnackbar(message, successCount > 0 ? 'default' : 'destructive');
      }
      setRakutenImportDialogOpen(false);
      setRakutenImportFile(null);
      setImportProgress('');
    } catch (e: unknown) {
      let errorMsg = '';
      if (e instanceof Error) {
        errorMsg = e.message;
      } else if (typeof e === 'string') {
        errorMsg = e;
      } else {
        errorMsg = JSON.stringify(e);
      }
      showSnackbar(`楽天明細のインポートに失敗しました: ${errorMsg}`, 'destructive');
    } finally {
      setLoading(false);
      setImportProgress('');
    }
  };

  return (
    <div className="space-y-4">
      {/* 並べ替えモードトグルボタン */}
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant={isSortMode ? 'default' : 'outline'}
          className={isSortMode ? 'bg-green-600 text-white' : ''}
          onClick={() => setIsSortMode(v => !v)}
        >
          {isSortMode ? '並べ替え終了' : '並べ替えモード'}
        </Button>
        {/* 既存の選択モードボタン等 */}
        <Button
          variant={isSelectMode ? 'default' : 'outline'}
          className={isSelectMode ? 'bg-blue-500 text-white' : ''}
          onClick={() => {
            console.log('選択モードボタンクリック', { currentMode: isSelectMode });
            setIsSelectMode(v => !v);
            setSelectedExpenseIds([]);
          }}
        >
          {isSelectMode ? <CheckSquare className="w-4 h-4 mr-1" /> : <Square className="w-4 h-4 mr-1" />}
          {isSelectMode ? '選択解除' : '選択モード'}
        </Button>
        {/* 楽天明細インポートボタンを追加 */}
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <Button
            asChild
            className="bg-white border border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 font-semibold rounded-md px-2 py-2 shadow min-w-0"
            title="楽天明細インポート"
          >
            <span className="flex items-center">
              {/* ファイル＋下向き矢印＋楽天文字のSVGアイコン */}
              <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 8v10" stroke="#BF0000" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 14l4 4 4-4" stroke="#BF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="14" y="28" textAnchor="middle" fill="#BF0000" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif" dy=".3em">楽天</text>
              </svg>
            </span>
          </Button>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleRakutenFileChange}
          />
        </label>
      </div>
      {/* 楽天明細インポート用の反映月選択ダイアログ */}
      <Dialog open={rakutenImportDialogOpen} onOpenChange={setRakutenImportDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>楽天明細インポート設定</DialogTitle>
            <DialogDescription>
              支払日を設定してください。利用日はCSVから自動取得し、card_used_dateに登録されます。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-sm font-medium">支払日</Label>
              <Input
                type="date"
                value={rakutenPaymentDate}
                onChange={e => setRakutenPaymentDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                クレジットカードの実際の支払日を入力してください
              </p>
            </div>
            <Button 
              onClick={handleRakutenImport}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span className="text-sm">
                    {importProgress || 'インポート中...'}
                  </span>
                </div>
              ) : (
                'インポート実行'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {isSelectMode && (
        <>
          {/* 固定用のスペーサー（固定時のみ表示） */}
          <div 
            className="transition-all duration-300 ease-in-out"
            style={{ 
              height: isButtonsFixed ? '80px' : '0px',
              opacity: isButtonsFixed ? 1 : 0 
            }} 
          />
          
          <div
            ref={buttonsContainerRef}
            className={`flex gap-2 items-start flex-wrap sm:flex-nowrap transition-all duration-300 ease-out ${
              isButtonsFixed 
                ? 'fixed top-2 z-50 bg-white shadow-lg border rounded-lg p-3' 
                : 'w-full'
            }`}
            style={isButtonsFixed && buttonsOriginalRect ? { 
              left: buttonsOriginalRect.left,
              width: buttonsOriginalRect.width,
            } : undefined}
          >
            {/* 左側: 全選択/全解除（縦並び） */}
            <div className="flex flex-col gap-2 min-w-[100px]">
              {selectedExpenseIds.length === recurringExpenses.filter(e => e.is_active).length ? (
                <Button
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-full shadow-lg px-4 py-2"
                  onClick={() => setSelectedExpenseIds([])}
                >
                  全解除
                </Button>
              ) : (
                <Button
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-full shadow-lg px-4 py-2"
                  onClick={() => {
                    setSelectedExpenseIds(recurringExpenses.filter(e => e.is_active).map(e => e.id));
                  }}
                >
                  全選択
                </Button>
              )}
            </div>
            {/* 右側: 一括反映・一括削除（横並び） */}
            <div className="flex gap-2 flex-1">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg px-4 py-2 w-full"
                onClick={() => {
                  console.log('一括反映ボタンクリック', { selectedExpenseIds });
                  setIsReflectDialogOpen(true);
                }}
                disabled={selectedExpenseIds.length === 0 || isReflecting}
              >
                {isReflecting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    反映中...
                  </div>
                ) : (
                  `一括反映 (${selectedExpenseIds.length})`
                )}
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-lg px-4 py-2 w-full"
                onClick={async () => {
                  if (!window.confirm('選択した定期支出を削除しますか？')) return;
                  setLoading(true);
                  try {
                    for (const id of selectedExpenseIds) {
                      await deleteRecurringExpense(id);
                    }
                    showSnackbar('選択した定期支出を削除しました');
                    setSelectedExpenseIds([]);
                    setIsSelectMode(false);
                  } catch {
                    showSnackbar('削除に失敗しました', 'destructive');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={selectedExpenseIds.length === 0}
              >
                一括削除
              </Button>
            </div>
          </div>
        </>
      )}
      {/* 失敗詳細ダイアログ */}
      <Dialog open={isFailedDialogOpen} onOpenChange={setIsFailedDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>一部の定期支出で反映できませんでした</DialogTitle>
            <DialogDescription>
              下記のエラーやスキップ理由を確認してください。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto">
            {failedReflects.length > 0 && <div className="mb-2 font-bold text-red-600">エラー</div>}
            {failedReflects.map(f => (
              <div key={f.id + f.error} className="mb-2">
                <div className="font-bold text-red-600">{f.name}</div>
                <div className="text-xs text-gray-600 break-all">{f.error}</div>
              </div>
            ))}
            {skippedReflects.length > 0 && <div className="mb-2 font-bold text-yellow-600">スキップ理由</div>}
            {skippedReflects.map(s => (
              <div key={s.id + s.reason} className="mb-2">
                <div className="font-bold text-yellow-700">{s.name}</div>
                <div className="text-xs text-gray-600 break-all">{s.reason}</div>
              </div>
            ))}
          </div>
          <Button className="mt-4 w-full" onClick={() => setIsFailedDialogOpen(false)}>
            閉じる
          </Button>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">定期支出設定</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-red-500 hover:bg-red-600">
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? '定期支出を編集' : '定期支出を追加'}
              </DialogTitle>
              <DialogDescription>
                {editingExpense ? '定期支出の情報を編集します。' : '新しい定期支出を追加します。'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">支出名</Label>
                <Input
                  id="name"
                  placeholder="例: 住民税、事務所家賃"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">金額 (円)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label>月ごとの支払日</Label>
                  <Checkbox
                    id="all-months-check"
                    checked={allMonthsChecked}
                    onCheckedChange={checked => {
                      setAllMonthsChecked(checked as boolean);
                      setFormData(prev => {
                        if (checked) {
                          // 全月ON: 選択した日付で全月分をセット
                          const newSchedule = [...Array(12)].map((_, idx) => ({ month: idx + 1, day: allMonthsDay }));
                          return { ...prev, payment_schedule: newSchedule };
                        } else {
                          // 全月OFF: 全て解除
                          return { ...prev, payment_schedule: [] };
                        }
                      });
                    }}
                  />
                  <span className="text-gray-600">全月一括</span>
                  <Select
                    value={String(allMonthsDay)}
                    onValueChange={val => {
                      const day = Number(val);
                      setAllMonthsDay(day);
                      if (allMonthsChecked) {
                        setFormData(prev => ({
                          ...prev,
                          payment_schedule: prev.payment_schedule.map(s => ({ ...s, day }))
                        }));
                      }
                    }}
                    disabled={!allMonthsChecked}
                  >
                    <SelectTrigger className="w-20 ml-2">
                      <SelectValue placeholder="日付" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={String(day)}>{day}日</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {MONTH_NAMES.map((month, idx) => {
                    const schedule = formData.payment_schedule.find(s => s.month === idx + 1);
                    return (
                      <div key={idx} className="flex items-center space-x-2">
                        <Checkbox
                          id={`month-check-${idx + 1}`}
                          checked={!!schedule}
                          onCheckedChange={checked => {
                            setFormData(prev => {
                              const newSchedule = prev.payment_schedule ? [...prev.payment_schedule] : [];
                              const i = newSchedule.findIndex(s => s.month === idx + 1);
                              if (!checked) {
                                if (i !== -1) newSchedule.splice(i, 1);
                              } else {
                                if (i === -1) newSchedule.push({ month: idx + 1, day: 25 });
                              }
                              // 全月一括チェック状態も更新
                              setAllMonthsChecked(newSchedule.length === 12);
                              return { ...prev, payment_schedule: newSchedule };
                            });
                          }}
                        />
                        <span className="w-8">{month}</span>
                        <Select
                          value={schedule ? schedule.day.toString() : ''}
                          onValueChange={(value) => {
                            const day = parseInt(value);
                            setFormData(prev => {
                              const newSchedule = prev.payment_schedule ? [...prev.payment_schedule] : [];
                              const i = newSchedule.findIndex(s => s.month === idx + 1);
                              if (i !== -1 && !isNaN(day)) {
                                newSchedule[i].day = day;
                              }
                              return { ...prev, payment_schedule: newSchedule };
                            });
                          }}
                          disabled={!schedule}
                        >
                          <SelectTrigger className="w-16">
                            <SelectValue placeholder="日" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-gray-400">日</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明（任意）</Label>
                <Textarea
                  id="description"
                  placeholder="支払いの詳細や注意事項"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active">有効</Label>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  {loading ? '保存中...' : (editingExpense ? '更新' : '追加')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {recurringExpenses.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">定期支出が設定されていません</p>
              <p>家賃やサブスクなどの定期的な支出を管理しましょう</p>
              <p className="mt-2 text-gray-400">
                家賃、サブスク、保険料など
              </p>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={e => setActiveId(e.active.id as string)}
            onDragEnd={e => {
              setActiveId(null);
              const { active, over } = e;
              if (active.id !== over?.id && over) {
                setExpenseOrder(items => arrayMove(items, items.indexOf(active.id as string), items.indexOf(over.id as string)));
              }
            }}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext items={expenseOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {expenseOrder.map(id => {
                  const expense = recurringExpenses.find(e => e.id === id);
                  if (!expense) return null;
                  return (
                    <SortableExpenseCard key={expense.id} expense={expense}>
                      {/* 既存のCard描画ロジックをここに */}
                      <Card className={expense.is_active ? '' : 'opacity-60'}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                              <div className="flex items-start space-x-2 mb-1">
                                {isSelectMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedExpenseIds.includes(expense.id)}
                                    disabled={!expense.is_active}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setSelectedExpenseIds(ids => [...ids, expense.id]);
                                      } else {
                                        setSelectedExpenseIds(ids => ids.filter(id => id !== expense.id));
                                      }
                                    }}
                                    className="w-5 h-5 accent-blue-500 mr-2 disabled:opacity-50"
                                  />
                                )}
                                <h5 className="font-medium text-gray-900 text-left self-start">{expense.name}</h5>
                          </div>
                              <div className="flex items-start space-x-4 text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {expense.payment_schedule && expense.payment_schedule.length > 0 ? (
                                  expense.payment_schedule.length === 12 ? (
                                    `毎月${expense.payment_schedule[0].day}日`
                                  ) : (
                                    expense.payment_schedule
                                      .sort((a, b) => a.month - b.month)
                                      .map(s => `${s.month}/${s.day}`).join('、')
                                  )
                                ) : ''}
                              </span>
                            </div>
                          </div>
                          {expense.description && (
                            <p className="text-gray-500 mt-1">{expense.description}</p>
                          )}
                              <p className="text-lg font-bold text-red-600 mt-1">
                            ¥{formatAmount(expense.amount)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                              <div className="flex flex-col gap-2 items-end">
                                <div className="flex items-center gap-2 w-full justify-end mb-2">
                          <Switch
                            checked={expense.is_active}
                            onCheckedChange={(checked) => handleToggleActive(expense.id, checked)}
                                    id={`active-switch-${expense.id}`}
                          />
                                  <Label htmlFor={`active-switch-${expense.id}`} className="text-xs text-gray-600 select-none">
                                    {expense.is_active ? '有効' : '無効'}
                                  </Label>
                                </div>
                          <Button
                                  variant="outline"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit className="h-4 w-4" />
                                  編集
                          </Button>
                          <Button
                                  variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                                  削除
                          </Button>
                              </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                    </SortableExpenseCard>
                  );
                })}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                (() => {
                  const expense = recurringExpenses.find(e => e.id === activeId);
                  if (!expense) return null;
                  return (
                    <Card className="opacity-80">
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <h5 className="font-medium text-gray-900">{expense.name}</h5>
            </div>
                      </CardContent>
                    </Card>
                  );
                })()
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
      {/* 年間定期支出合計カード */}
      {recurringExpenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-red-700 font-medium mb-1">年間定期支出合計</p>
                <p className="text-2xl font-bold text-red-600">
                  ¥{formatAmount(
                    recurringExpenses
                      .filter(expense => expense.is_active)
                      .reduce((sum, expense) => {
                        const count = Array.isArray(expense.payment_schedule)
                          ? expense.payment_schedule.length
                          : 12;
                        return sum + expense.amount * count;
                      }, 0)
                  )}
                </p>
                <p className="text-red-600 mt-1">
                  有効な定期支出: {recurringExpenses.filter(e => e.is_active).length}件
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 一括反映ダイアログ */}
      <Dialog open={isReflectDialogOpen} onOpenChange={setIsReflectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>定期支出の一括反映</DialogTitle>
            <DialogDescription>
              選択した定期支出を指定期間に一括反映します。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>開始日</Label>
                <Input
                  type="date"
                  value={reflectStartDate}
                  onChange={(e) => setReflectStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>終了日</Label>
                <Input
                  type="date"
                  value={reflectEndDate}
                  onChange={(e) => setReflectEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>反映タイプ</Label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="reflectType"
                    checked={!reflectIsMock}
                    onChange={() => setReflectIsMock(false)}
                  />
                  <span>実際の収支</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="reflectType"
                    checked={reflectIsMock}
                    onChange={() => setReflectIsMock(true)}
                  />
                  <span>予定の収支</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-700">
                反映対象: {selectedExpenseIds.length}件の定期支出
              </p>
              <div className="mt-2 max-h-20 overflow-y-auto">
                {selectedExpenseIds.map(id => {
                  const expense = recurringExpenses.find(e => e.id === id);
                  return expense ? (
                    <div key={id} className="text-xs text-gray-600">
                      • {expense.name} (¥{formatAmount(expense.amount)})
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsReflectDialogOpen(false)}
                disabled={isReflecting}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleBulkReflect}
                disabled={isReflecting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isReflecting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    反映中...
                  </div>
                ) : (
                  '反映実行'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecurringExpenseSettings;