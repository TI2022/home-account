import { useEffect, useState } from 'react';
import { useWishlistStore, WishlistItem } from '@/store/useWishlistStore';
import { Button } from '@/components/ui/button';
import { useSnackbar } from '@/hooks/use-toast';

export const Wishlist = () => {
  const { wishlist, fetchWishlist, addWishlistItem, updateWishlistItem, deleteWishlistItem, loading } = useWishlistStore();
  const { showSnackbar } = useSnackbar();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', priority: '1' });
  const [editId, setEditId] = useState<string | null>(null);
  const [priorityError, setPriorityError] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // 優先度順（同じ場合は値段が高い順）にソート
  const sortedWishlist = [...wishlist].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority; // 優先度が小さい順
    }
    return b.price - a.price; // 同じ優先度なら値段が高い順
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPriorityError('');
    if (!form.name || !form.price || !form.priority) return;
    // priority重複チェック
    const isDuplicate = wishlist.some(item =>
      String(item.priority) === form.priority && (!editId || item.id !== editId)
    );
    if (isDuplicate) {
      setPriorityError('同じ優先順位のアイテムが既に存在します');
      return;
    }
    try {
      if (editId) {
        await updateWishlistItem(editId, {
          name: form.name,
          price: Number(form.price),
          priority: Number(form.priority),
        });
        showSnackbar('リストを編集しました');
      } else {
        await addWishlistItem({
          name: form.name,
          price: Number(form.price),
          priority: Number(form.priority),
        });
        showSnackbar('リストに追加しました');
      }
      setForm({ name: '', price: '', priority: '1' });
      setEditId(null);
      setIsDialogOpen(false);
    } catch {
      showSnackbar('保存に失敗しました', 'destructive');
    }
  };

  const handleEdit = (item: WishlistItem) => {
    setForm({ name: item.name, price: String(item.price), priority: String(item.priority) });
    setEditId(item.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWishlistItem(id);
      showSnackbar('リストから削除しました');
    } catch {
      showSnackbar('削除に失敗しました', 'destructive');
    }
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
                <div className="text-sm text-gray-500 text-left">
                  ¥{Number(item.price).toLocaleString()} / 優先度: {item.priority}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>編集</Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteTargetId(item.id)}>削除</Button>
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
                <label className="block mb-1">名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">値段</label>
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
                <label className="block mb-1">優先順位（数字が小さいほど高い）</label>
                <input
                  type="number"
                  min={1}
                  value={form.priority}
                  onChange={e => {
                    setForm(f => ({ ...f, priority: e.target.value }));
                    setPriorityError('');
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
                {priorityError && <div className="text-red-500 text-sm">{priorityError}</div>}
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">{editId ? '更新' : '追加'}</Button>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditId(null); setForm({ name: '', price: '', priority: '1' }); }}>キャンセル</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-bold mb-4">削除確認</h2>
            <p className="mb-4">このアイテムを削除しますか？</p>
            <div className="flex space-x-2">
              <Button variant="destructive" onClick={() => { handleDelete(deleteTargetId); setDeleteTargetId(null); }}>削除</Button>
              <Button variant="outline" onClick={() => setDeleteTargetId(null)}>キャンセル</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 