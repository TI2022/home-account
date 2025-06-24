import { useEffect, useState } from 'react';
import { useWishlistStore, WishlistItem } from '@/store/useWishlistStore';
import { useSavingsStore } from '@/store/useSavingsStore';
import { useSavingsPlanStore } from '@/store/useSavingsPlanStore';
import { Button } from '@/components/ui/button';

export const Wishlist = () => {
  const { wishlist, fetchWishlist, addWishlistItem, updateWishlistItem, deleteWishlistItem, loading } = useWishlistStore();
  const { savingsAmount } = useSavingsStore();
  const { plan } = useSavingsPlanStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', priority: 1 });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // 優先度順にソート
  const sortedWishlist = [...wishlist].sort((a, b) => a.priority - b.priority);

  // 優先度順に達成予定日を計算
  const getExpectedDates = () => {
    const monthly = Number(plan?.monthly_target || 0);
    let current = Number(savingsAmount || 0);
    let now = new Date();
    const results: { [id: string]: string } = {};

    for (const item of sortedWishlist) {
      const price = Number(item.price);
      if (!monthly || monthly <= 0) {
        results[item.id] = '未設定';
        continue;
      }
      if (price <= current) {
        results[item.id] = '達成！';
        current -= price; // 次のアイテムのために減算
        continue;
      }
      const remain = price - current;
      const monthsLeft = Math.ceil(remain / monthly);

      // 達成予定日を計算
      const expected = new Date(now);
      expected.setMonth(expected.getMonth() + monthsLeft);
      results[item.id] = `${expected.getFullYear()}年${expected.getMonth() + 1}月`;

      // 次のアイテムのために、今の貯金額をこのアイテム達成後の状態に更新
      current = current + monthsLeft * monthly - price;
      now = expected;
    }
    return results;
  };

  const expectedDates = getExpectedDates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    if (editId) {
      await updateWishlistItem(editId, {
        name: form.name,
        price: Number(form.price),
        priority: Number(form.priority),
      });
    } else {
      await addWishlistItem({
        name: form.name,
        price: Number(form.price),
        priority: Number(form.priority),
      });
    }
    setForm({ name: '', price: '', priority: 1 });
    setEditId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: WishlistItem) => {
    setForm({ name: item.name, price: String(item.price), priority: item.priority });
    setEditId(item.id);
    setIsDialogOpen(true);
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">欲しいものリスト</h2>
        <Button onClick={() => { setIsDialogOpen(true); setEditId(null); }}>追加</Button>
      </div>
      {loading ? (
        <div>読み込み中...</div>
      ) : (
        <div className="space-y-3">
          {sortedWishlist.length === 0 && <div className="text-gray-500">リストがありません</div>}
          {sortedWishlist.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-white rounded shadow p-3">
              <div>
                <div className="font-bold text-left">{item.name}</div>
                <div className="text-sm text-gray-500">
                  ¥{Number(item.price).toLocaleString()} / 優先度: {item.priority}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  達成予定：{expectedDates[item.id]}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>編集</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteWishlistItem(item.id)}>削除</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 追加・編集モーダル */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-bold mb-4">{editId ? '編集' : '追加'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">値段</label>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">優先順位（数字が小さいほど高い）</label>
                <input
                  type="number"
                  min={1}
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit">{editId ? '保存' : '追加'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 