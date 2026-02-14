import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppStore } from '@/store/useAppStore';
import { useSnackbar } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Edit, Trash2, Wallet } from 'lucide-react';
import * as budgetsLib from '@/lib/budgets';
import * as budgetExpensesLib from '@/lib/budgetExpenses';
import type { MonthlyBudget } from '@/lib/budgets';
import type { BudgetExpense } from '@/lib/budgetExpenses';

export const BudgetDetailPage = () => {
  const { selectedBudgetId, navigateBackToBudgetManagement } = useAppStore();
  const { showSnackbar } = useSnackbar();
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<BudgetExpense | null>(null);
  const [formData, setFormData] = useState({ memo: '', amount: '' });

  const load = useCallback(async () => {
    if (!selectedBudgetId) return;
    setLoading(true);
    try {
      const [budgetData, expensesData] = await Promise.all([
        budgetsLib.fetchBudgetById(selectedBudgetId),
        budgetExpensesLib.fetchBudgetExpensesByBudgetId(selectedBudgetId),
      ]);
      setBudget(budgetData ?? null);
      setExpenses(expensesData ?? []);
    } catch (e) {
      console.error(e);
      showSnackbar('データの取得に失敗しました', 'destructive');
    } finally {
      setLoading(false);
    }
  }, [selectedBudgetId, showSnackbar]);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpenDialog = (expense?: BudgetExpense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({ memo: expense.memo, amount: String(expense.amount) });
    } else {
      setEditingExpense(null);
      setFormData({ memo: '', amount: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudgetId) return;
    const amount = formData.amount.trim() === '' ? 0 : Number(formData.amount.replace(/,/g, ''));
    if (isNaN(amount) || amount < 0) {
      showSnackbar('金額を正の数で入力してください', 'destructive');
      return;
    }
    try {
      if (editingExpense) {
        const updated = await budgetExpensesLib.updateBudgetExpense(editingExpense.id, {
          memo: formData.memo.trim(),
          amount,
        });
        if (updated) {
          setExpenses((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
          showSnackbar('更新しました');
        } else {
          showSnackbar('更新に失敗しました', 'destructive');
        }
      } else {
        const created = await budgetExpensesLib.createBudgetExpense({
          budget_id: selectedBudgetId,
          memo: formData.memo.trim(),
          amount,
        });
        setExpenses((prev) => [...prev, created]);
        setBudget((b) => (b ? { ...b, used_amount: b.used_amount + amount } : null));
        showSnackbar('追加しました');
      }
      setIsDialogOpen(false);
      await load(); // refresh budget.used_amount
    } catch (err) {
      console.error(err);
      let message = err instanceof Error ? err.message : '操作に失敗しました';
      if (message.includes('does not exist') || message.includes('relation') || message.includes('存在しません')) {
        message = '予算の支出を保存できません。データベースのマイグレーション（budget_expenses テーブル）が適用されているか確認してください。';
      }
      showSnackbar(message, 'destructive');
    }
  };

  const handleDelete = async (expense: BudgetExpense) => {
    if (!confirm(`「${expense.memo || '（メモなし）'}」¥${expense.amount.toLocaleString()} を削除しますか？`)) return;
    try {
      const ok = await budgetExpensesLib.deleteBudgetExpense(expense.id);
      if (ok) {
        setExpenses((prev) => prev.filter((x) => x.id !== expense.id));
        showSnackbar('削除しました');
        await load();
      } else {
        showSnackbar('削除に失敗しました', 'destructive');
      }
    } catch (err) {
      console.error(err);
      showSnackbar('削除に失敗しました', 'destructive');
    }
  };

  const handleDeleteBudget = async () => {
    if (!selectedBudgetId || !budget) return;
    if (!confirm(`「${budget.item_key}」の予算（${monthLabel}）を削除しますか？\n関連する支出明細もすべて削除されます。`)) return;
    try {
      const ok = await budgetsLib.deleteBudget(selectedBudgetId);
      if (ok) {
        showSnackbar('予算を削除しました');
        navigateBackToBudgetManagement();
      } else {
        showSnackbar('削除に失敗しました', 'destructive');
      }
    } catch (err) {
      console.error(err);
      showSnackbar('削除に失敗しました', 'destructive');
    }
  };

  const formatAmount = (amount: number) => amount.toLocaleString('ja-JP');
  const monthLabel = budget ? `${budget.year}年${budget.month}月` : '';

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (!selectedBudgetId || !budget) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">予算が見つかりません</p>
        <Button onClick={() => navigateBackToBudgetManagement()}>予算管理に戻る</Button>
      </div>
    );
  }

  return (
    <motion.div
      className="pb-20 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigateBackToBudgetManagement()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Wallet className="h-10 w-10 text-amber-500" />
            <div>
              <h1 className="text-xl font-bold">{budget.item_key}</h1>
              <p className="text-gray-500">{monthLabel}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            支出を追加
          </Button>
          <Button variant="outline" onClick={handleDeleteBudget} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
            この予算を削除
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-amber-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-amber-700">¥{formatAmount(budget.max_amount)}</div>
              <div className="text-sm text-gray-500">上限</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${budget.used_amount > budget.max_amount ? 'text-red-600' : 'text-gray-800'}`}>
                ¥{formatAmount(budget.used_amount)}
              </div>
              <div className="text-sm text-gray-500">使用額</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">支出明細</h2>
        {expenses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">まだ支出が登録されていません</p>
            <Button variant="outline" onClick={() => handleOpenDialog()}>
              最初の支出を追加
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {expenses.map((exp, i) => (
              <motion.li
                key={exp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="flex items-center justify-between py-3 px-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{exp.memo || '（メモなし）'}</p>
                    <p className="text-sm text-gray-500">¥{formatAmount(exp.amount)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(exp)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(exp)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </Card>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? '支出を編集' : '支出を追加'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-memo">何に使ったか</Label>
              <Input
                id="expense-memo"
                value={formData.memo}
                onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
                placeholder="例：食費、交通費"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">金額（円） *</Label>
              <Input
                id="expense-amount"
                type="text"
                inputMode="numeric"
                value={formData.amount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, '');
                  setFormData((prev) => ({ ...prev, amount: v }));
                }}
                placeholder="例：3000"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit">{editingExpense ? '更新' : '追加'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default BudgetDetailPage;
