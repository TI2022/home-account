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
import { INCOME_CATEGORIES } from '@/types';
import type { RecurringIncome } from '@/types';
import { Plus, Edit, Trash2, Receipt, Calendar, Clock, CheckSquare, Square } from 'lucide-react';
import { ScenarioSelector } from '@/components/ui/scenario-selector';
import { format } from 'date-fns';

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
    reflectSingleRecurringIncomeForPeriod
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
  // 一括反映・ダイアログ関連のstateは不要になったので削除
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIncomeIds, setSelectedIncomeIds] = useState<string[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [isScenarioDialogOpen, setIsScenarioDialogOpen] = useState(false);

  useEffect(() => {
    fetchRecurringIncomes();
  }, [fetchRecurringIncomes]);

  // 無効化されたものは選択リストから外す
  useEffect(() => {
    if (isSelectMode) {
      setSelectedIncomeIds(ids => ids.filter(id => {
        const income = recurringIncomes.find(i => i.id === id);
        return income && income.is_active;
      }));
    }
  }, [recurringIncomes, isSelectMode]);

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

  // Group incomes by frequency for better organization
  const groupedIncomes = recurringIncomes.reduce((groups, income) => {
    const frequency = income.payment_schedule.length > 0 ? 'monthly' : 'custom';
    if (!groups[frequency]) {
      groups[frequency] = [];
    }
    groups[frequency].push(income);
    return groups;
  }, {} as Record<string, typeof recurringIncomes>);
  
  const frequencyLabels = {
    monthly: '毎月の収入',
    custom: 'その他の収入'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
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
        {/* 上部のisSelectModeトグルボタンを削除 */}
        {isSelectMode && (
          <div className="flex w-full gap-2 items-start flex-wrap sm:flex-nowrap">
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
                onClick={() => setIsScenarioDialogOpen(true)}
                disabled={selectedIncomeIds.length === 0}
              >
                一括反映
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
        )}
      </div>
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
          Object.entries(groupedIncomes).map(([frequency, incomes]) => (
            <div key={frequency}>
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <h4 className="text-sm font-medium text-gray-700">
                  {frequencyLabels[frequency as keyof typeof frequencyLabels]}
                </h4>
              </div>
              <div className="space-y-2">
                {incomes.map((income) => (
                  <Card key={income.id} className={income.is_active ? '' : 'opacity-60'}>
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
                ))}
              </div>
            </div>
          ))
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
                      .reduce((sum, income) => sum + income.amount * 12, 0)
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
      {/* シナリオ選択モーダル */}
      <Dialog open={isScenarioDialogOpen} onOpenChange={setIsScenarioDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>一括反映するシナリオを選択</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <ScenarioSelector value={selectedScenarioId} onValueChange={setSelectedScenarioId} />
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow mt-4"
              onClick={async () => {
                setLoading(true);
                const today = format(new Date(), 'yyyy-MM-dd');
                try {
                  for (const id of selectedIncomeIds) {
                    await reflectSingleRecurringIncomeForPeriod(id, today, today, undefined, selectedScenarioId);
                  }
                  showSnackbar('選択した定期収入を反映しました');
                  setSelectedIncomeIds([]);
                  setIsSelectMode(false);
                  setIsScenarioDialogOpen(false);
                } catch {
                  showSnackbar('反映に失敗しました', 'destructive');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !selectedScenarioId}
            >
              このシナリオで一括反映
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};