import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// useAppStore not required in budgets page header
import { useCategoryStore } from '@/store/useCategoryStore';
import * as budgetItemsLib from '@/lib/budgetItems';
import * as budgetsLib from '@/lib/budgets';
import { useSnackbar } from '@/hooks/use-toast';
// budgets are now independent of transactions

type EditableBudget = {
  id?: string;
  item_key: string;
  year: number;
  month: number;
  max_amount: number | '';
  used_amount: number | '';
  isSaving?: boolean;
};

export const BudgetsPage: React.FC = () => {
  const { showSnackbar } = useSnackbar();
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [items, setItems] = useState<EditableBudget[]>([]);
  const [loading, setLoading] = useState(false);
  // transaction categories are separate; budgets use budget_items
  useCategoryStore();
  const [budgetItems, setBudgetItems] = useState<Array<{ id: string; name: string }>>([]);

  // available categories are now budget-items created by the user (budget-specific)
  const availableCategories = useMemo(() => {
    return (budgetItems || []).map(b => b.name);
  }, [budgetItems]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await budgetsLib.fetchBudgets(yearMonth.year, yearMonth.month);
      setItems(
        data.map(d => ({ id: d.id, item_key: d.item_key, year: d.year, month: d.month, max_amount: Number(d.max_amount), used_amount: Number(d.used_amount ?? 0) }))
      );
      // load budget-items for selection
      try {
        const items = await budgetItemsLib.fetchBudgetItems();
        setBudgetItems(items.map(i => ({ id: i.id, name: i.name })));
      } catch (e) {
        console.error('failed to load budget items', e);
      }
    } catch (err) {
      console.error(err);
      showSnackbar('予算の取得に失敗しました', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearMonth.year, yearMonth.month]);

  const addNew = () => {
    setItems([{ item_key: availableCategories[0] || '', year: yearMonth.year, month: yearMonth.month, max_amount: '', used_amount: '' }, ...items]);
  };

  const createBudgetItem = async () => {
    const name = window.prompt('新しい予算項目の名前を入力してください');
    if (!name) return;
    try {
      const saved = await budgetItemsLib.upsertBudgetItem({ name });
      if (saved) {
        setBudgetItems(prev => [{ id: saved.id, name: saved.name }, ...prev]);
        // create a new budget row preselected with this item
        setItems(prev => [{ item_key: saved.name, year: yearMonth.year, month: yearMonth.month, max_amount: '', used_amount: '' }, ...prev]);
        showSnackbar('項目を作成しました');
      } else {
        showSnackbar('項目の作成に失敗しました', 'destructive');
      }
    } catch (err) {
      console.error('createBudgetItem error', err);
      showSnackbar('項目の作成に失敗しました', 'destructive');
    }
  };

  const save = async (index: number) => {
    const b = items[index];
    if (!b.item_key || b.max_amount === '') {
      showSnackbar('項目と金額を入力してください', 'destructive');
      return;
    }
    const amount = Number(b.max_amount);
    const used = b.used_amount === '' ? 0 : Number(b.used_amount);
    setItems(prev => prev.map((it, i) => i === index ? { ...it, isSaving: true } : it));
    try {
      const saved = await budgetsLib.upsertBudget({ id: b.id, item_key: b.item_key, year: b.year, month: b.month, max_amount: amount, used_amount: used });
      if (saved) {
        setItems(prev => prev.map((it, i) => i === index ? { ...it, id: saved.id, max_amount: Number(saved.max_amount), used_amount: Number(saved.used_amount ?? 0), isSaving: false } : it));
        showSnackbar('保存しました');
      } else {
        throw new Error('save failed');
      }
    } catch (err) {
      console.error(err);
      showSnackbar('保存に失敗しました', 'destructive');
      setItems(prev => prev.map((it, i) => i === index ? { ...it, isSaving: false } : it));
    }
  };

  const remove = async (index: number) => {
    const b = items[index];
    if (!b.id) {
      // unsaved, just remove locally
      setItems(prev => prev.filter((_, i) => i !== index));
      return;
    }
    if (!confirm('この予算を削除しますか？')) return;
    try {
      const ok = await budgetsLib.deleteBudget(b.id);
      if (ok) {
        setItems(prev => prev.filter((_, i) => i !== index));
        showSnackbar('削除しました');
      } else {
        throw new Error('delete failed');
      }
    } catch (err) {
      console.error(err);
      showSnackbar('削除に失敗しました', 'destructive');
    }
  };

  return (
    <div className="p-6">

      <div className="mb-4 flex items-center space-x-2">
        <label className="text-sm text-gray-600">対象月:</label>
        <input type="month"
          value={`${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split('-').map(Number);
            setYearMonth({ year: y, month: m });
          }}
          className="border rounded px-2 py-1" />
        <Button onClick={addNew}>新規行を追加</Button>
        <Button variant="outline" onClick={createBudgetItem}>項目を新規作成</Button>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-600">
              <th className="px-4 py-2">項目</th>
              <th className="px-4 py-2">上限 (¥)</th>
              <th className="px-4 py-2">使用額 (¥)</th>
              <th className="px-4 py-2">残額 (¥)</th>
              <th className="px-4 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center">読み込み中...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">予算が設定されていません</td></tr>
            )}
            {items.map((b, i) => (
              <BudgetRow key={b.id || `${b.item_key}-${i}`} b={b} i={i} categories={availableCategories} save={save} remove={remove} setItems={setItems} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetsPage;

function BudgetRow({ b, i, categories, save, remove, setItems }: { b: EditableBudget; i: number; categories: string[]; save: (i: number) => Promise<void>; remove: (i: number) => Promise<void>; setItems: (fn: (prev: EditableBudget[]) => EditableBudget[]) => void; }) {
  const key = `${b.item_key}-${b.year}-${b.month}`;
  console.log('BudgetRow render', { index: i, key, item_key: b.item_key, max_amount: b.max_amount });

  return (
    <tr key={key} className="border-t">
      <td className="px-4 py-2 w-1/2">
        <select className="w-full" value={b.item_key} onChange={(e) => setItems((prev: EditableBudget[]) => prev.map((it: EditableBudget, idx: number) => idx === i ? { ...it, item_key: e.target.value } : it))}>
          {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="px-4 py-2 w-1/4">
        <Input value={b.max_amount === '' ? '' : String(b.max_amount)} onChange={(e) => {
          const raw = e.target.value;
          const v = raw.replace(/[^\d.]/g, '');
          const parsed: number | '' = v === '' ? '' : Number(v);
          setItems((prev: EditableBudget[]) => prev.map((it: EditableBudget, idx: number) => idx === i ? { ...it, max_amount: parsed } : it));
        }} />
      </td>

      <td className="px-4 py-2 w-1/4">
        <Input value={b.used_amount === '' ? '' : String(b.used_amount)} onChange={(e) => {
          const raw = e.target.value;
          const v = raw.replace(/[^\d.]/g, '');
          const parsed: number | '' = v === '' ? '' : Number(v);
          setItems((prev: EditableBudget[]) => prev.map((it: EditableBudget, idx: number) => idx === i ? { ...it, used_amount: parsed } : it));
        }} />
      </td>

      <td className="px-4 py-2 w-1/6">
        {(b.max_amount === '' || b.used_amount === '') ? (
          <div className="text-sm text-gray-500">—</div>
        ) : (
          (() => {
            const remaining = Number(b.max_amount) - Number(b.used_amount);
            const color = remaining < 0 ? 'text-red-600' : remaining <= Math.max(0, Math.floor(Number(b.max_amount) * 0.2)) ? 'text-yellow-700' : 'text-green-700';
            return <div className={`font-medium ${color}`}>¥{Math.max(0, Math.floor(remaining)).toLocaleString()}</div>;
          })()
        )}
      </td>

      <td className="px-4 py-2 w-1/6">
        <div className="flex items-center space-x-2">
          <Button onClick={() => save(i)} disabled={b.isSaving}>{b.isSaving ? '保存中...' : '保存'}</Button>
          <Button variant="ghost" onClick={() => remove(i)}>削除</Button>
        </div>
      </td>
    </tr>
  );
}
