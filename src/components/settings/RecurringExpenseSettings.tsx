import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_CATEGORIES } from '@/types';
import { Plus, Edit, Trash2, Receipt, Calendar, Clock } from 'lucide-react';

// Predefined expense templates with payment schedules
const EXPENSE_TEMPLATES = [
  {
    name: '住民税',
    category: '住民税',
    amount: 30000,
    frequency: 'quarterly' as const,
    months: [6, 8, 10, 1], // 6月、8月、10月、1月
    day: 30,
    description: '年4回の分割納付'
  },
  {
    name: '所得税（予定納税）',
    category: '予定納税',
    amount: 50000,
    frequency: 'custom' as const,
    months: [7, 11], // 7月、11月
    day: 31,
    description: '第1期・第2期予定納税'
  },
  {
    name: '固定資産税',
    category: '固定資産税',
    amount: 40000,
    frequency: 'quarterly' as const,
    months: [4, 7, 12, 2], // 4月、7月、12月、2月
    day: 30,
    description: '年4回の分割納付'
  },
  {
    name: '自動車税',
    category: '自動車税',
    amount: 35000,
    frequency: 'yearly' as const,
    months: [5], // 5月
    day: 31,
    description: '年1回の納付'
  },
  {
    name: '国民健康保険',
    category: '健康保険',
    amount: 25000,
    frequency: 'monthly' as const,
    months: [1,2,3,4,5,6,7,8,9,10,11,12],
    day: 25,
    description: '毎月の保険料'
  },
  {
    name: '国民年金',
    category: '国民年金',
    amount: 16590,
    frequency: 'monthly' as const,
    months: [1,2,3,4,5,6,7,8,9,10,11,12],
    day: 25,
    description: '毎月の年金保険料'
  },
  {
    name: '事業税',
    category: '事業税',
    amount: 20000,
    frequency: 'custom' as const,
    months: [8, 11], // 8月、11月
    day: 31,
    description: '第1期・第2期事業税'
  },
  {
    name: '事務所家賃',
    category: '事務所家賃',
    amount: 80000,
    frequency: 'monthly' as const,
    months: [1,2,3,4,5,6,7,8,9,10,11,12],
    day: 25,
    description: '毎月の事務所賃料'
  }
];

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
    deleteRecurringExpense 
  } = useTransactionStore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    day_of_month: '25',
    payment_frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly' | 'custom',
    payment_months: [1,2,3,4,5,6,7,8,9,10,11,12] as number[],
    description: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecurringExpenses();
  }, [fetchRecurringExpenses]);

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      day_of_month: '25',
      payment_frequency: 'monthly',
      payment_months: [1,2,3,4,5,6,7,8,9,10,11,12],
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

    if (formData.payment_months.length === 0) {
      toast({
        title: 'エラー',
        description: '支払月を少なくとも1つ選択してください',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const expenseData = {
        name: formData.name,
        amount: parseInt(formData.amount),
        category: formData.category,
        day_of_month: parseInt(formData.day_of_month),
        payment_frequency: formData.payment_frequency,
        payment_months: formData.payment_months,
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
    } catch (error) {
      toast({
        title: 'エラー',
        description: '保存に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense: any) => {
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
      day_of_month: expense.day_of_month.toString(),
      payment_frequency: expense.payment_frequency || 'monthly',
      payment_months: expense.payment_months || [1,2,3,4,5,6,7,8,9,10,11,12],
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
    } catch (error) {
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
    } catch (error) {
      toast({
        title: 'エラー',
        description: '更新に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleTemplateSelect = (template: typeof EXPENSE_TEMPLATES[0]) => {
    setFormData({
      name: template.name,
      amount: template.amount.toString(),
      category: template.category,
      day_of_month: template.day.toString(),
      payment_frequency: template.frequency,
      payment_months: template.months,
      description: template.description,
      is_active: true,
    });
  };

  const handleFrequencyChange = (frequency: 'monthly' | 'quarterly' | 'yearly' | 'custom') => {
    let months: number[] = [];
    
    switch (frequency) {
      case 'monthly':
        months = [1,2,3,4,5,6,7,8,9,10,11,12];
        break;
      case 'quarterly':
        months = [3,6,9,12]; // 四半期末
        break;
      case 'yearly':
        months = [12]; // 年末
        break;
      case 'custom':
        months = []; // ユーザーが選択
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      payment_frequency: frequency,
      payment_months: months
    }));
  };

  const handleMonthToggle = (month: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      payment_months: checked 
        ? [...prev.payment_months, month].sort((a, b) => a - b)
        : prev.payment_months.filter(m => m !== month)
    }));
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP');
  };

  const formatPaymentSchedule = (expense: any) => {
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
            
            {/* Quick Templates */}
            {!editingExpense && (
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  よく使われる支出テンプレート
                </Label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {EXPENSE_TEMPLATES.map((template, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTemplateSelect(template)}
                      className="text-xs p-3 h-auto flex justify-between items-center"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-gray-500">{template.description}</span>
                      </div>
                      <span className="text-red-600 font-bold">¥{formatAmount(template.amount)}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

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
                <Label htmlFor="frequency">支払頻度</Label>
                <Select 
                  value={formData.payment_frequency} 
                  onValueChange={handleFrequencyChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">毎月</SelectItem>
                    <SelectItem value="quarterly">四半期（3ヶ月毎）</SelectItem>
                    <SelectItem value="yearly">年1回</SelectItem>
                    <SelectItem value="custom">カスタム</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Months Selection */}
              <div className="space-y-2">
                <Label>支払月</Label>
                <div className="grid grid-cols-4 gap-2">
                  {MONTH_NAMES.map((month, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`month-${index + 1}`}
                        checked={formData.payment_months.includes(index + 1)}
                        onCheckedChange={(checked) => handleMonthToggle(index + 1, checked as boolean)}
                        disabled={formData.payment_frequency !== 'custom' && formData.payment_frequency !== 'monthly'}
                      />
                      <Label htmlFor={`month-${index + 1}`} className="text-sm">
                        {month}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="day">支払日</Label>
                <Select 
                  value={formData.day_of_month} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_month: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}日
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  id="active"
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
                            size="sm"
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