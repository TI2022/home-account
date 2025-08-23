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
import { INCOME_CATEGORIES } from '@/types';
import type { RecurringIncome } from '@/types';
import { Plus, Edit, Trash2, Receipt, Calendar, CheckSquare, Square } from 'lucide-react';
// import { ScenarioSelector } from '@/components/ui/scenario-selector';
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

export const RecurringIncomeSettings = () => {
  const { 
    recurringIncomes, 
    fetchRecurringIncomes, 
    addRecurringIncome, 
    updateRecurringIncome, 
    deleteRecurringIncome,
  } = useTransactionStore();
  const { showSnackbar } = useSnackbar();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    payment_schedule: [{ month: 1, day: 25 }] as { month: number; day: number }[],
    description: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [allMonthsChecked, setAllMonthsChecked] = useState(false);
  const [allMonthsDay, setAllMonthsDay] = useState(25);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIncomeIds, setSelectedIncomeIds] = useState<string[]>([]);
  const [incomeOrder, setIncomeOrder] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSortMode, setIsSortMode] = useState(false);
  const [failedReflects, setFailedReflects] = useState<{id: string; name: string; error: string}[]>([]);
  const [skippedReflects, setSkippedReflects] = useState<{id: string; name: string; reason: string}[]>([]);
  const [isFailedDialogOpen, setIsFailedDialogOpen] = useState(false);
  
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
    fetchRecurringIncomes();
  }, [fetchRecurringIncomes]);

  useEffect(() => {
    // 初期並び順はID順
    setIncomeOrder(recurringIncomes.map(i => i.id));
  }, [recurringIncomes]);

  // 無効化されたものは選択リストから外す
  useEffect(() => {
    if (isSelectMode) {
      setSelectedIncomeIds(ids => ids.filter(id => {
        const income = recurringIncomes.find(i => i.id === id);
        return income && income.is_active;
      }));
    }
  }, [recurringIncomes, isSelectMode]);

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

    if (selectedIncomeIds.length === 0) {
      showSnackbar('定期収入を選択してください', 'destructive');
      return;
    }

    console.log('反映設定:', {
      reflectStartDate,
      reflectEndDate,
      reflectIsMock,
      selectedIncomeIds: selectedIncomeIds.length
    });

    setIsReflecting(true);
    setFailedReflects([]);
    setSkippedReflects([]);

    try {
      let success = 0;
      let failed = 0;

      for (const incomeId of selectedIncomeIds) {
        const income = recurringIncomes.find(i => i.id === incomeId);
        if (!income) {
          console.warn('定期収入が見つかりません:', incomeId);
          continue;
        }

        console.log(`定期収入反映開始: ${income.name}`, {
          id: incomeId,
          amount: income.amount,
          category: income.category,
          payment_schedule: income.payment_schedule,
          is_active: income.is_active
        });

        try {
          // 定期収入の反映処理をここに実装
          const start = new Date(reflectStartDate);
          const end = new Date(reflectEndDate);
          
          const d = new Date(start);
          while (d <= end) {
            const month = d.getMonth() + 1;
            const year = d.getFullYear();
            const schedule = income.payment_schedule?.find(s => s.month === month);
            
            if (schedule) {
              // タイムゾーンに影響されない日付文字列を直接作成
              const paymentDateStr = `${year}-${month.toString().padStart(2, '0')}-${schedule.day.toString().padStart(2, '0')}`;
              const paymentDate = new Date(paymentDateStr + 'T00:00:00');
              if (paymentDate >= start && paymentDate <= end) {
                const exists = (useTransactionStore.getState().transactions || []).some(t =>
                  t.date === paymentDateStr &&
                  t.amount === income.amount &&
                  t.category === income.category &&
                  t.type === 'income' &&
                  (t.isMock ?? false) === reflectIsMock
                );
                
                if (!exists) {
                  await useTransactionStore.getState().addTransaction({
                    type: 'income',
                    amount: income.amount,
                    category: income.category,
                    date: paymentDateStr,
                    memo: income.name,
                    isMock: reflectIsMock,
                  });
                }
              }
            }
            
            d.setMonth(d.getMonth() + 1);
            d.setDate(1);
          }
          
          console.log(`定期収入反映成功: ${income.name}`);
          success++;
        } catch (error) {
          console.error(`定期収入反映失敗: ${income.name}`, error);
          setFailedReflects(prev => [...prev, {
            id: incomeId,
            name: income.name,
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
        setSelectedIncomeIds([]);
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
      payment_schedule: [{ month: 1, day: 25 }] as { month: number; day: number }[],
      description: '',
      is_active: true,
    });
    setEditingIncome(null);
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
      const months = formData.payment_schedule.map(s => s.month).sort((a, b) => a - b);
      const payment_frequency = (months.length === 12
        ? 'monthly'
        : months.length === 4
        ? 'quarterly'
        : months.length === 1
        ? 'yearly'
        : 'custom') as 'monthly' | 'quarterly' | 'yearly' | 'custom';
      const incomeData = {
        name: formData.name,
        amount: parseInt(formData.amount),
        category: formData.category,
        payment_schedule: formData.payment_schedule,
        payment_frequency,
        description: formData.description || undefined,
        is_active: formData.is_active,
      };

      console.log('Submitting income data:', incomeData);

      if (editingIncome) {
        await updateRecurringIncome(editingIncome, incomeData);
        showSnackbar('定期収入を更新しました');
      } else {
        await addRecurringIncome(incomeData);
        showSnackbar('定期収入を追加しました');
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

  const handleEdit = (income: RecurringIncome) => {
    setFormData({
      name: income.name,
      amount: income.amount.toString(),
      category: income.category,
      payment_schedule: income.payment_schedule,
      description: '',
      is_active: income.is_active,
    });
    setEditingIncome(income.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この定期収入を削除しますか？')) return;

    try {
      await deleteRecurringIncome(id);
      showSnackbar('定期収入を削除しました');
    } catch {
      showSnackbar('削除に失敗しました', 'destructive');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateRecurringIncome(id, { is_active: isActive });
      showSnackbar(`定期収入を${isActive ? '有効' : '無効'}にしました`);
    } catch {
      showSnackbar('更新に失敗しました', 'destructive');
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP');
  };

  // 並べ替え用SortableItem
  function SortableIncomeCard({ income, children }: { income: RecurringIncome; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: income.id });
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
            setIsSelectMode(v => !v);
            setSelectedIncomeIds([]);
          }}
        >
          {isSelectMode ? <CheckSquare className="w-4 h-4 mr-1" /> : <Square className="w-4 h-4 mr-1" />}
          {isSelectMode ? '選択解除' : '選択モード'}
        </Button>
      </div>
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
            className={`flex gap-2 mb-2 transition-all duration-300 ease-out ${
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
              {selectedIncomeIds.length === recurringIncomes.filter(i => i.is_active).length ? (
                <Button
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-full shadow-lg px-4 py-2"
                  onClick={() => setSelectedIncomeIds([])}
                >
                  全解除
                </Button>
              ) : (
                <Button
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-full shadow-lg px-4 py-2"
                  onClick={() => {
                    setSelectedIncomeIds(recurringIncomes.filter(i => i.is_active).map(i => i.id));
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
                  console.log('一括反映ボタンクリック', { selectedIncomeIds });
                  setIsReflectDialogOpen(true);
                }}
                disabled={selectedIncomeIds.length === 0 || isReflecting}
              >
                {isReflecting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    反映中...
                  </div>
                ) : (
                  `一括反映 (${selectedIncomeIds.length})`
                )}
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-lg px-4 py-2 w-full"
                onClick={async () => {
                  if (!window.confirm('選択した定期収入を削除しますか？')) return;
                  setLoading(true);
                  try {
                    for (const id of selectedIncomeIds) {
                      await deleteRecurringIncome(id);
                    }
                    showSnackbar('選択した定期収入を削除しました');
                    setSelectedIncomeIds([]);
                    setIsSelectMode(false);
                  } catch {
                    showSnackbar('削除に失敗しました', 'destructive');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={selectedIncomeIds.length === 0}
              >
                一括削除
              </Button>
            </div>
          </div>
        </>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">定期収入設定</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600">
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIncome ? '定期収入を編集' : '定期収入を追加'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">収入名</Label>
                <Input
                  id="name"
                  placeholder="例: 給与、副業収入"
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
                    {INCOME_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_schedule">支払いスケジュール</Label>
                <div className="flex items-center space-x-2">
                  <Label>月ごとの入金日</Label>
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
                  placeholder="収入の詳細や注意事項"
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
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {loading ? '保存中...' : (editingIncome ? '更新' : '追加')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {recurringIncomes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">定期収入が設定されていません</p>
              <p>給与や副業収入などの定期的な収入を管理しましょう</p>
              <p className="mt-2 text-gray-400">
                給与、ボーナス、副業収入など
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
                setIncomeOrder(items => arrayMove(items, items.indexOf(active.id as string), items.indexOf(over.id as string)));
              }
            }}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext items={incomeOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {incomeOrder.map(id => {
                  const income = recurringIncomes.find(i => i.id === id);
                  if (!income) return null;
                  return (
                    <SortableIncomeCard key={income.id} income={income}>
                      {/* 既存のCard描画ロジックをここに */}
                      <Card className={income.is_active ? '' : 'opacity-60'}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-start space-x-2 mb-1">
                                {isSelectMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedIncomeIds.includes(income.id)}
                                    disabled={!income.is_active}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setSelectedIncomeIds(ids => [...ids, income.id]);
                                      } else {
                                        setSelectedIncomeIds(ids => ids.filter(id => id !== income.id));
                                      }
                                    }}
                                    className="w-5 h-5 accent-blue-500 mr-2 disabled:opacity-50"
                                  />
                                )}
                                <h5 className="font-medium text-gray-900 text-left self-start">{income.name}</h5>
                              </div>
                              <div className="flex items-start space-x-4 text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {income.payment_schedule && income.payment_schedule.length > 0 ? (
                                      income.payment_schedule.length === 12 ? (
                                        // 毎月
                                        `毎月${income.payment_schedule[0].day}日`
                                      ) : (
                                        // 四半期・年1回・カスタム
                                        income.payment_schedule
                                          .sort((a, b) => a.month - b.month)
                                          .map(s => `${s.month}/${s.day}`).join('、')
                                      )
                                    ) : ''}
                                  </span>
                                </div>
                              </div>
                              {income.description && (
                                <p className="text-gray-500 mt-1">{income.description}</p>
                              )}
                              <p className="text-lg font-bold text-green-600 mt-1">
                                ¥{formatAmount(income.amount)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex flex-col gap-2 items-end">
                                <div className="flex items-center gap-2 w-full justify-end mb-2">
                                  <Switch
                                    checked={income.is_active}
                                    onCheckedChange={(checked) => handleToggleActive(income.id, checked)}
                                    id={`active-switch-${income.id}`}
                                  />
                                  <Label htmlFor={`active-switch-${income.id}`} className="text-xs text-gray-600 select-none">
                                    {income.is_active ? '有効' : '無効'}
                                  </Label>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(income)}
                                >
                                  <Edit className="h-4 w-4" />
                                  編集
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(income.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  削除
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </SortableIncomeCard>
                  );
                })}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                (() => {
                  const income = recurringIncomes.find(i => i.id === activeId);
                  if (!income) return null;
                  return (
                    <Card className="opacity-80">
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <h5 className="font-medium text-gray-900">{income.name}</h5>
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

      {/* 年間定期収入合計カード */}
      {recurringIncomes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-green-700 font-medium mb-1">年間定期収入合計</p>
                <p className="text-2xl font-bold text-green-600">
                  ¥{formatAmount(
                    recurringIncomes
                      .filter(income => income.is_active)
                      .reduce((sum, income) => {
                        const count = Array.isArray(income.payment_schedule)
                          ? income.payment_schedule.length
                          : 12;
                        return sum + income.amount * count;
                      }, 0)
                  )}
                </p>
                <p className="text-green-600 mt-1">
                  有効な定期収入: {recurringIncomes.filter(i => i.is_active).length}件
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
            <DialogTitle>定期収入の一括反映</DialogTitle>
            <DialogDescription>
              選択した定期収入を指定期間に一括反映します。
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
                反映対象: {selectedIncomeIds.length}件の定期収入
              </p>
              <div className="mt-2 max-h-20 overflow-y-auto">
                {selectedIncomeIds.map(id => {
                  const income = recurringIncomes.find(i => i.id === id);
                  return income ? (
                    <div key={id} className="text-xs text-gray-600">
                      • {income.name} (¥{formatAmount(income.amount)})
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
      {/* 失敗詳細ダイアログ */}
      <Dialog open={isFailedDialogOpen} onOpenChange={setIsFailedDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>一部の定期収入で反映できませんでした</DialogTitle>
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
    </div>
  );
};

export default RecurringIncomeSettings;