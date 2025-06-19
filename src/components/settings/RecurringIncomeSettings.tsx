import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useToast } from '@/hooks/use-toast';
import { INCOME_CATEGORIES } from '@/types';
import { Plus, Edit, Trash2 } from 'lucide-react';

export const RecurringIncomeSettings = () => {
  const { 
    recurringIncomes, 
    fetchRecurringIncomes, 
    addRecurringIncome, 
    updateRecurringIncome, 
    deleteRecurringIncome 
  } = useTransactionStore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    day_of_month: '25',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecurringIncomes();
  }, [fetchRecurringIncomes]);

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      day_of_month: '25',
      is_active: true,
    });
    setEditingIncome(null);
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

    setLoading(true);
    try {
      const incomeData = {
        name: formData.name,
        amount: parseInt(formData.amount),
        category: formData.category,
        day_of_month: parseInt(formData.day_of_month),
        is_active: formData.is_active,
      };

      if (editingIncome) {
        await updateRecurringIncome(editingIncome, incomeData);
        toast({
          title: '更新完了',
          description: '定期収入を更新しました',
        });
      } else {
        await addRecurringIncome(incomeData);
        toast({
          title: '追加完了',
          description: '定期収入を追加しました',
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

  const handleEdit = (income: any) => {
    setFormData({
      name: income.name,
      amount: income.amount.toString(),
      category: income.category,
      day_of_month: income.day_of_month.toString(),
      is_active: income.is_active,
    });
    setEditingIncome(income.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この定期収入を削除しますか？')) return;

    try {
      await deleteRecurringIncome(id);
      toast({
        title: '削除完了',
        description: '定期収入を削除しました',
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
      await updateRecurringIncome(id, { is_active: isActive });
      toast({
        title: '更新完了',
        description: `定期収入を${isActive ? '有効' : '無効'}にしました`,
      });
    } catch (error) {
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

  return (
    <div className="space-y-4">
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
          <DialogContent className="sm:max-w-md">
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
                <Label htmlFor="day">毎月の入金日</Label>
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
              <p>定期収入が設定されていません</p>
              <p className="text-sm mt-1">「追加」ボタンから設定してください</p>
            </CardContent>
          </Card>
        ) : (
          recurringIncomes.map((income) => (
            <Card key={income.id} className={income.is_active ? '' : 'opacity-60'}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{income.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        income.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {income.is_active ? '有効' : '無効'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {income.category} • 毎月{income.day_of_month}日
                    </p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      ¥{formatAmount(income.amount)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={income.is_active}
                      onCheckedChange={(checked) => handleToggleActive(income.id, checked)}
                      size="sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(income)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(income.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};