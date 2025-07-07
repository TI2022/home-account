import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSnackbar } from '@/hooks/use-toast';
import { EXPENSE_CATEGORIES } from '@/types';
import type { RecurringExpense } from '@/types';
import { Plus, Edit, Trash2, Receipt, Calendar, Clock, CheckSquare, Square } from 'lucide-react';
import { ScenarioSelector } from '@/components/ui/scenario-selector';

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
    reflectRecurringExpensesForPeriod,
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
  const [periodStartDate, setPeriodStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [periodEndDate, setPeriodEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().slice(0, 10);
  });
  const [reflectLoading, setReflectLoading] = useState(false);
  const [isReflectDialogOpen, setIsReflectDialogOpen] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');

  useEffect(() => {
    fetchRecurringExpenses();
  }, [fetchRecurringExpenses]);

  // 無効化されたものは選択リストから外す
  useEffect(() => {
    if (isSelectMode) {
      setSelectedExpenseIds(ids => ids.filter(id => {
        const expense = recurringExpenses.find(e => e.id === id);
        return expense && expense.is_active;
      }));
    }
  }, [recurringExpenses, isSelectMode]);

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

  // Group expenses by frequency for better organization
  const groupedExpenses = recurringExpenses.reduce((groups, expense) => {
    const frequency = expense.payment_schedule.length > 0 ? 'monthly' : 'custom';
    if (!groups[frequency]) {
      groups[frequency] = [];
    }
    groups[frequency].push(expense);
    return groups;
  }, {} as Record<string, typeof recurringExpenses>);

  const frequencyLabels = {
    monthly: '毎月の支出',
    custom: 'その他の支出'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Button className="bg-red-500 hover:bg-red-600" onClick={() => setIsReflectDialogOpen(true)}>
          支出一括反映
        </Button>
        <Button
          variant={isSelectMode ? 'default' : 'outline'}
          className={isSelectMode ? 'bg-blue-500 text-white' : ''}
          onClick={() => {
            setIsSelectMode(v => !v);
            setSelectedExpenseIds([]);
          }}
        >
          {isSelectMode ? <CheckSquare className="w-4 h-4 mr-1" /> : <Square className="w-4 h-4 mr-1" />}
          {isSelectMode ? '選択解除' : '選択モード'}
        </Button>
        <Dialog open={isReflectDialogOpen} onOpenChange={setIsReflectDialogOpen}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>定期支出の一括反映</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <div>
                <Label>反映開始日</Label>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={periodStartDate}
                  onChange={e => setPeriodStartDate(e.target.value)}
                  max={periodEndDate}
                />
              </div>
              <div>
                <Label>反映終了日</Label>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={periodEndDate}
                  onChange={e => setPeriodEndDate(e.target.value)}
                  min={periodStartDate}
                />
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Label>反映種別</Label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="reflectType"
                    checked={!isMock}
                    onChange={() => setIsMock(false)}
                  />
                  <span>本番データ</span>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="reflectType"
                    checked={isMock}
                    onChange={() => setIsMock(true)}
                  />
                  <span>仮データ</span>
                </label>
              </div>
              <div>
                <Label>シナリオ</Label>
                <ScenarioSelector value={selectedScenarioId} onValueChange={setSelectedScenarioId} />
              </div>
              <Button
                className="bg-red-500 hover:bg-red-600 mt-2"
                disabled={reflectLoading || periodEndDate < periodStartDate}
                onClick={async () => {
                  setReflectLoading(true);
                  try {
                    await reflectRecurringExpensesForPeriod(periodStartDate, periodEndDate, isMock, selectedScenarioId);
                    showSnackbar('指定期間の定期支出を反映しました');
                    setIsReflectDialogOpen(false);
                  } catch (error) {
                    console.error('一括反映エラー:', error);
                    showSnackbar('一括反映に失敗しました', 'destructive');
                  } finally {
                    setReflectLoading(false);
                  }
                }}
              >
                {reflectLoading ? '反映中...' : '定期支出を反映'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
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
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          placeholder="日"
                          value={schedule ? schedule.day : ''}
                          onChange={e => {
                            const day = parseInt(e.target.value);
                            setFormData(prev => {
                              const newSchedule = prev.payment_schedule ? [...prev.payment_schedule] : [];
                              const i = newSchedule.findIndex(s => s.month === idx + 1);
                              if (i !== -1 && !isNaN(day)) {
                                newSchedule[i].day = day;
                              }
                              return { ...prev, payment_schedule: newSchedule };
                            });
                          }}
                          className="w-16"
                          disabled={!schedule}
                        />
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
          Object.entries(groupedExpenses).map(([frequency, expenses]) => (
            <div key={frequency}>
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <h4 className="text-sm font-medium text-gray-700">
                  {frequencyLabels[frequency as keyof typeof frequencyLabels]}
                </h4>
              </div>
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <Card key={expense.id} className={expense.is_active ? '' : 'opacity-60'}>
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
                ))}
              </div>
            </div>
          ))
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
                      .reduce((sum, expense) => sum + expense.amount * 12, 0)
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
      {/* 選択モード時の一括反映ボタン */}
      {isSelectMode && selectedExpenseIds.length > 0 && (
        <div className="fixed bottom-20 left-0 w-full flex justify-center z-50 pointer-events-none">
          <ScenarioSelector value={selectedScenarioId} onValueChange={setSelectedScenarioId} className="mr-2 w-48" />
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg px-8 py-3 pointer-events-auto"
            onClick={async () => {
              setLoading(true);
              try {
                for (const id of selectedExpenseIds) {
                  await reflectSingleRecurringExpenseForPeriod(id, periodStartDate, periodEndDate, isMock, selectedScenarioId);
                }
                showSnackbar('選択した定期支出を反映しました');
                setSelectedExpenseIds([]);
                setIsSelectMode(false);
              } catch {
                showSnackbar('反映に失敗しました', 'destructive');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            選択した定期支出を反映
          </Button>
        </div>
      )}
    </div>
  );
};