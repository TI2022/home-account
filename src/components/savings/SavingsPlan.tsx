import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useSavingsPlanStore } from '@/store/useSavingsPlanStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const SavingsPlan = () => {
  const { plan, fetchPlan, upsertPlan } = useSavingsPlanStore();
  const { wishlist, fetchWishlist } = useWishlistStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    monthly_target: plan?.monthly_target?.toString() || '',
    target_date: plan?.target_date || '',
  });

  // 欲しいものリストの合計金額
  const wishlistTotal = wishlist.reduce((sum, item) => sum + Number(item.price), 0);

  useEffect(() => {
    fetchPlan();
    fetchWishlist();
  }, [fetchPlan, fetchWishlist]);

  useEffect(() => {
    if (plan) {
      setForm({
        monthly_target: plan.monthly_target.toString(),
        target_date: plan.target_date || '',
      });
    }
  }, [plan]);

  // 達成率・残り金額・残り月数計算
  const goal = wishlistTotal;
  const monthly = Number(plan?.monthly_target || 0);

  const handleSave = async () => {
    if (!goal || !form.monthly_target) return;
    await upsertPlan({
      goal_amount: goal,
      monthly_target: Number(form.monthly_target),
      target_date: form.target_date || null,
    });
    setIsDialogOpen(false);
  };

  return (
    <Card className="mt-8 mb-8">
      <CardHeader>
        <CardTitle>貯金計画</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <div className="mb-2">目標額：<span className="font-bold text-blue-600">¥{goal.toLocaleString()}</span></div>
          <div className="mb-2">毎月の目標額：<span className="font-bold text-green-600">¥{monthly.toLocaleString()}</span></div>
          {plan?.target_date && (
            <div className="mb-2">目標日：<span className="font-bold">{format(parseISO(plan.target_date), 'yyyy年M月d日', { locale: ja })}</span></div>
          )}
          <Button onClick={() => setIsDialogOpen(true)} className="mt-2">計画を編集</Button>
        </div>
      </CardContent>

      {/* モーダル */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-bold mb-4">貯金計画を設定</h2>
            <div className="space-y-3">
              <div>
                <label className="block mb-1">目標額</label>
                <input
                  type="number"
                  min={0}
                  value={goal}
                  disabled
                  className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block mb-1">毎月の目標額</label>
                <input
                  type="number"
                  min={0}
                  value={form.monthly_target}
                  onChange={e => setForm(f => ({ ...f, monthly_target: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">目標日（任意）</label>
                <input
                  type="date"
                  value={form.target_date || ''}
                  onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button type="button" onClick={handleSave}>
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}; 