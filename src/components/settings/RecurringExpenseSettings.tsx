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
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_CATEGORIES } from '@/types';
import type { RecurringExpense } from '@/types';
import { Plus, Edit, Trash2, Receipt, Calendar, Clock } from 'lucide-react';

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
  } = useTransactionStore();
  const { toast } = useToast();
  
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

  useEffect(() => {
    fetchRecurringExpenses();
  }, [fetchRecurringExpenses]);

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
      toast({
        title: 'エラー',
        description: '必須項目を入力してください',
        variant: 'destructive',
      });
      return;
    }

    if (formData.payment_schedule.length === 0) {
      toast({
        title: 'エラー',
        description: '支払月を少なくとも1つ選択してください',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // payment_scheduleからday_of_month, payment_months, payment_frequencyを生成
      const months = formData.payment_schedule.map(s => s.month).sort((a, b) => a - b);
      const payment_months = months;
      const payment_frequency = (months.length === 12
        ? 'monthly'
        : months.length === 4
        ? 'quarterly'
        : months.length === 1
        ? 'yearly'
        : 'custom') as 'monthly' | 'quarterly' | 'yearly' | 'custom';
      const day_of_month = formData.payment_schedule.length > 0 ? formData.payment_schedule[0].day : 25;
      const expenseData = {
        name: formData.name,
        amount: parseInt(formData.amount),
        category: formData.category,
        payment_schedule: formData.payment_schedule,
        payment_months,
        payment_frequency,
        day_of_month,
        description: formData.description || undefined,
        is_active: formData.is_active,
      };

      if (editingExpense) {
        await updateRecurringExpense(editingExpense, expenseData);
        toast({
          title: '更新完了',
          description: '定期支出を更新しました',
        });
      } else {
        await addRecurringExpense(expenseData);
        toast({
          title: '追加完了',
          description: '定期支出を追加しました',
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch {
      toast({
        title: 'エラー',
        description: '保存に失敗しました',
        variant: 'destructive',
      });
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
      toast({
        title: '削除完了',
        description: '定期支出を削除しました',
      });
    } catch {
      toast({
        title: 'エラー',
        description: '削除に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateRecurringExpense(id, { is_active: isActive });
      toast({
        title: '更新完了',
        description: `定期支出を${isActive ? '有効' : '無効'}にしました`,
      });
    } catch {
      toast({
        title: 'エラー',
        description: '更新に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP');
  };

  const formatPaymentSchedule = (expense: RecurringExpense) => {
    const months = expense.payment_months || [];
    if (months.length === 12) {
      return '毎月';
    } else if (months.length === 4) {
      return '四半期';
    } else if (months.length === 1) {
      return '年1回';
    } else {
      return `${months.map((m: number) => MONTH_NAMES[m-1]).join('、')}`;
    }
  };

  // Group expenses by frequency for better organization
  const groupedExpenses = recurringExpenses.reduce((groups, expense) => {
    const frequency = expense.payment_frequency || 'monthly';
    if (!groups[frequency]) {
      groups[frequency] = [];
    }
    groups[frequency].push(expense);
    return groups;
  }, {} as Record<string, typeof recurringExpenses>);

  const frequencyLabels = {
    monthly: '毎月の支出',
    quarterly: '四半期の支出',
    yearly: '年間の支出',
    custom: 'その他の支出'
  };

  return (
    <div className="space-y-4">
      <div>
        <Button className="bg-green-500 hover:bg-green-600" onClick={() => setIsReflectDialogOpen(true)}>
          一括反映
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
              <Button
                className="bg-green-500 hover:bg-green-600 mt-2"
                disabled={reflectLoading || periodEndDate < periodStartDate}
                onClick={async () => {
                  setReflectLoading(true);
                  await reflectRecurringExpensesForPeriod(periodStartDate, periodEndDate);
                  setReflectLoading(false);
                  setIsReflectDialogOpen(false);
                  toast({ title: '反映完了', description: '指定期間の定期支出を反映しました' });
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
                          // 全月ON: 既存の値を維持しつつ、未設定月は25日で追加
                          const newSchedule = [...Array(12)].map((_, idx) => {
                            const exist = prev.payment_schedule.find(s => s.month === idx + 1);
                            return exist ? { ...exist } : { month: idx + 1, day: 25 };
                          });
                          return { ...prev, payment_schedule: newSchedule };
                        } else {
                          // 全月OFF: 全て解除
                          return { ...prev, payment_schedule: [] };
                        }
                      });
                    }}
                  />
                  <span className="text-xs text-gray-600">全月一括</span>
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
                        <span className="text-sm w-8">{month}</span>
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
                        <span className="text-xs text-gray-400">日</span>
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

      <div className="space-y-6">
        {recurringExpenses.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">定期支出が設定されていません</p>
              <p className="text-sm">税金や保険料などの定期的な支出を管理しましょう</p>
              <p className="text-xs mt-2 text-gray-400">
                住民税、所得税、健康保険、国民年金など
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
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{expense.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              expense.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {expense.is_active ? '有効' : '無効'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatPaymentSchedule(expense)}</span>
                            </div>
                            <span>毎月{expense.day_of_month}日</span>
                          </div>
                          {expense.description && (
                            <p className="text-xs text-gray-500 mt-1">{expense.description}</p>
                          )}
                          <p className="text-lg font-bold text-red-600 mt-2">
                            ¥{formatAmount(expense.amount)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={expense.is_active}
                            onCheckedChange={(checked) => handleToggleActive(expense.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-700"
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
          ))
        )}
      </div>

      {/* Summary Cards */}
      {recurringExpenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-red-700 font-medium mb-1">月間定期支出合計</p>
                <p className="text-2xl font-bold text-red-600">
                  ¥{formatAmount(
                    recurringExpenses
                      .filter(expense => expense.is_active && (expense.payment_months || []).includes(new Date().getMonth() + 1))
                      .reduce((sum, expense) => sum + expense.amount, 0)
                  )}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  今月の支払い予定
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-orange-700 font-medium mb-1">年間定期支出合計</p>
                <p className="text-2xl font-bold text-orange-600">
                  ¥{formatAmount(
                    recurringExpenses
                      .filter(expense => expense.is_active)
                      .reduce((sum, expense) => {
                        const monthsCount = (expense.payment_months || []).length;
                        return sum + (expense.amount * monthsCount);
                      }, 0)
                  )}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  有効な定期支出: {recurringExpenses.filter(e => e.is_active).length}件
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};