import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EXPENSE_CATEGORIES } from '@/types';
import type { RecurringExpense } from '@/types';

const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

interface RecurringExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    category: string;
    payment_schedule: { month: number; day: number }[];
    payment_frequency: 'monthly' | 'quarterly' | 'yearly' | 'custom';
    description?: string;
    is_active: boolean;
  }) => Promise<void>;
  editingExpense: RecurringExpense | null;
  loading: boolean;
}

export const RecurringExpenseForm = ({
  isOpen,
  onClose,
  onSubmit,
  editingExpense,
  loading
}: RecurringExpenseFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    payment_schedule: [] as { month: number; day: number }[],
    description: '',
    is_active: true,
  });
  const [allMonthsChecked, setAllMonthsChecked] = useState(false);
  const [allMonthsDay, setAllMonthsDay] = useState(27);

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      payment_schedule: [],
      description: '',
      is_active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.category) {
      return;
    }

    if (formData.payment_schedule.length === 0) {
      return;
    }

    try {
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

      await onSubmit(expenseData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
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
              autoFocus={false}
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
                      const newSchedule = Array.from({ length: 12 }, (_, i) => ({
                        month: i + 1,
                        day: allMonthsDay
                      }));
                      return { ...prev, payment_schedule: newSchedule };
                    } else {
                      // 全月OFF: 空配列に
                      return { ...prev, payment_schedule: [] };
                    }
                  });
                }}
              />
              <Label htmlFor="all-months-check" className="text-sm">全月</Label>
              {allMonthsChecked && (
                <Select
                  value={allMonthsDay.toString()}
                  onValueChange={(value) => {
                    const day = parseInt(value);
                    if (!isNaN(day)) {
                      setAllMonthsDay(day);
                      setFormData(prev => ({
                        ...prev,
                        payment_schedule: prev.payment_schedule.map(s => ({ ...s, day }))
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {MONTH_NAMES.map((month, idx) => {
                const schedule = formData.payment_schedule.find(s => s.month === idx + 1);
                return (
                  <div key={idx} className="flex items-center space-x-2">
                    <Checkbox
                      checked={!!schedule}
                      onCheckedChange={checked => {
                        setFormData(prev => {
                          if (checked) {
                            // 月を追加
                            const newSchedule = [...prev.payment_schedule, { month: idx + 1, day: 27 }];
                            return { ...prev, payment_schedule: newSchedule };
                          } else {
                            // 月を削除
                            const newSchedule = prev.payment_schedule.filter(s => s.month !== idx + 1);
                            return { ...prev, payment_schedule: newSchedule };
                          }
                        });
                      }}
                    />
                    <Label className="text-sm">{month}</Label>
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
              onClick={() => onClose()}
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
  );
}; 