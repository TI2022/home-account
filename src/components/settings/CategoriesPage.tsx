import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';

export const CategoriesPage = () => {
  const { categories, loading, fetchCategories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const { transactions } = useTransactionStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState<string | undefined>('');

  useEffect(() => {
    fetchCategories().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // compute union of user-defined, built-in and transaction-history categories
  const available = (() => {
    const userNames = (categories || []).map(c => ({ name: c.name, type: c.type, id: c.id }));
    const builtInExpense = EXPENSE_CATEGORIES.map(n => ({ name: n, type: 'expense' as const, id: undefined }));
    const builtInIncome = INCOME_CATEGORIES.map(n => ({ name: n, type: 'income' as const, id: undefined }));
    const txNames = Array.from(new Set((transactions || []).filter(t => t.category).map(t => ({ name: t.category, type: t.type as 'expense' | 'income' }))))
      .map(x => ({ name: x.name, type: x.type, id: undefined }));
    const combined = [...userNames, ...builtInExpense, ...builtInIncome, ...txNames];
    // normalize by name+type and keep user id when present
    const map = new Map<string, { name: string; type: 'expense' | 'income'; id?: string }>();
    for (const c of combined) {
      const key = `${c.name}::${c.type}`;
      if (!map.has(key)) map.set(key, c);
      else {
        const existing = map.get(key)!;
        if (!existing.id && c.id) map.set(key, c);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  })();

  const openNew = () => {
    setEditingId(null);
    setName('');
    setType('expense');
    setColor('');
    setIsDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const c = categories.find(x => x.id === id);
    if (!c) return;
    setEditingId(id);
    setName(c.name);
    setType(c.type);
    setColor(c.color || '');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editingId) {
      const saved = await updateCategory(editingId, { name: name.trim(), type, color: color || null });
      if (!saved) {
        alert('カテゴリの保存に失敗しました。ブラウザコンソールを確認してください。');
        return;
      }
    } else {
      const saved = await addCategory(name.trim(), type, color || null);
      if (!saved) {
        alert('カテゴリの作成に失敗しました。ブラウザコンソールを確認してください。');
        return;
      }
    }
    // 閉じる前に最新データが反映されるのを待つ
    await fetchCategories();
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('本当にカテゴリを削除しますか？ この操作は取り消せません。')) return;
    await deleteCategory(id);
  };

  return (
    <motion.div className="pb-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">カテゴリ管理</h2>
        <Button onClick={openNew}>新規カテゴリ</Button>
      </div>

      <div className="space-y-4">
        {loading && <div className="text-sm text-gray-500">読み込み中...</div>}
        {!loading && categories.length === 0 && (
          <div className="text-sm text-gray-500">カテゴリが登録されていません。新規作成してください。</div>
        )}
        <div className="grid gap-2">
          {available.map((c) => (
            <div key={`${c.name}-${c.type}`} className="flex items-center justify-between bg-white border rounded p-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full" style={{ background: (c.id ? (categories.find(x => x.id === c.id)?.color) : undefined) || '#e5e7eb' }} />
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.type === 'expense' ? '支出' : '収入'}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {c.id ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openEdit(c.id!)}>編集</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id!)} className="text-red-600">削除</Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setName(c.name); setType(c.type); setColor(''); setIsDialogOpen(true); }}>取り込む</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'カテゴリ編集' : 'カテゴリ作成'}</DialogTitle>
            <DialogDescription>カテゴリ名とタイプを入力して保存してください。</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>名前</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 食費" />
            </div>

            <div>
              <Label>タイプ</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'expense' | 'income')}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">支出</SelectItem>
                  <SelectItem value="income">収入</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>色（任意）</Label>
              <Input type="color" value={color || '#e5e7eb'} onChange={(e) => setColor(e.target.value)} />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
              <Button onClick={handleSave}>{editingId ? '保存' : '作成'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CategoriesPage;
