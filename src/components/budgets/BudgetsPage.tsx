import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import * as budgetItemsLib from '@/lib/budgetItems';
import * as budgetsLib from '@/lib/budgets';
import { useSnackbar } from '@/hooks/use-toast';
import { ChevronRight } from 'lucide-react';

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
  const { navigateToBudgetDetail } = useAppStore();
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [items, setItems] = useState<EditableBudget[]>([]);
  const [loading, setLoading] = useState(false);
  /** 行ごとの「最後に保存した値」。変更がなければ onBlur で保存しない */
  const lastSavedRef = useRef<( { item_key: string; max_amount: number } | undefined)[]>([]);
  useCategoryStore();
  const [budgetItems, setBudgetItems] = useState<Array<{ id: string; name: string }>>([]);
  const [addRowDialogOpen, setAddRowDialogOpen] = useState(false);
  const [selectedItemKeyForNewRow, setSelectedItemKeyForNewRow] = useState('');

  const availableCategories = useMemo(() => {
    return (budgetItems || []).map(b => b.name);
  }, [budgetItems]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await budgetsLib.fetchBudgets(yearMonth.year, yearMonth.month);
      const loaded = data.map(d => ({ id: d.id, item_key: d.item_key, year: d.year, month: d.month, max_amount: Number(d.max_amount), used_amount: Number(d.used_amount ?? 0) }));
      setItems(loaded);
      lastSavedRef.current = loaded.map(b => ({ item_key: b.item_key, max_amount: Number(b.max_amount) }));
      // load budget-items for selection
      try {
        const fetchedItems = await budgetItemsLib.fetchBudgetItems();
        setBudgetItems(fetchedItems.map(i => ({ id: i.id, name: i.name })));
      } catch (e) {
        console.error('failed to load budget items', e);
        showSnackbar('予算項目の取得に失敗しました。データベースの設定を確認してください。', 'destructive');
        setBudgetItems([]);
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

  const openAddRowDialog = () => {
    setSelectedItemKeyForNewRow(availableCategories[0] ?? '');
    setAddRowDialogOpen(true);
  };

  const confirmAddRow = () => {
    if (!selectedItemKeyForNewRow.trim()) {
      showSnackbar('項目を選択してください', 'destructive');
      return;
    }
    setItems([{ item_key: selectedItemKeyForNewRow, year: yearMonth.year, month: yearMonth.month, max_amount: '', used_amount: '' }, ...items]);
    lastSavedRef.current = [undefined, ...lastSavedRef.current];
    setAddRowDialogOpen(false);
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
        lastSavedRef.current = [undefined, ...lastSavedRef.current];
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
    const used = typeof b.used_amount === 'number' ? b.used_amount : 0;
    setItems(prev => prev.map((it, i) => i === index ? { ...it, isSaving: true } : it));
    try {
      const saved = await budgetsLib.upsertBudget({ id: b.id, item_key: b.item_key, year: b.year, month: b.month, max_amount: amount, used_amount: used });
      if (saved) {
        setItems(prev => prev.map((it, i) => i === index ? { ...it, id: saved.id, max_amount: Number(saved.max_amount), used_amount: Number(saved.used_amount ?? 0), isSaving: false } : it));
        lastSavedRef.current[index] = { item_key: saved.item_key, max_amount: Number(saved.max_amount) };
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

  /** 変更がある場合のみ保存（onBlur 用） */
  const saveIfChanged = (index: number) => {
    const b = items[index];
    const last = lastSavedRef.current[index];
    if (last === undefined) {
      if (b.item_key && b.max_amount !== '') save(index);
      return;
    }
    const currentMax = b.max_amount === '' ? 0 : Number(b.max_amount);
    if (b.item_key === last.item_key && currentMax === last.max_amount) return;
    save(index);
  };

  return (
    <div>
      <div className="mb-4 flex items-center space-x-2">
        <input type="month"
          value={`${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split('-').map(Number);
            setYearMonth({ year: y, month: m });
          }}
          className="border rounded px-2 py-1" />
      </div>
      <div className="mb-4 flex space-x-2">
        <Button onClick={openAddRowDialog}>新規行を追加</Button>
        <Button variant="outline" onClick={createBudgetItem}>項目を新規作成</Button>
      </div>

      <Dialog open={addRowDialogOpen} onOpenChange={setAddRowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規行を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>項目を選択</Label>
              <select
                className="w-full border rounded-md px-3 py-2 bg-white"
                value={selectedItemKeyForNewRow}
                onChange={(e) => setSelectedItemKeyForNewRow(e.target.value)}
              >
                {availableCategories.length === 0 ? (
                  <option value="">項目を新規作成から追加</option>
                ) : (
                  availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))
                )}
              </select>
              {availableCategories.length === 0 && (
                <p className="text-sm text-amber-600">「項目を新規作成」で項目を追加してください。</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddRowDialogOpen(false)}>キャンセル</Button>
              <Button onClick={confirmAddRow} disabled={availableCategories.length === 0}>追加</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-600">
              <th className="px-4 py-2">項目</th>
              <th className="px-4 py-2">上限 (¥)</th>
              <th className="px-4 py-2">使用額 (¥)</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={3} className="px-4 py-6 text-center">読み込み中...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">予算が設定されていません</td></tr>
            )}
            {items.map((b, i) => (
              <BudgetRow key={b.id || `${b.item_key}-${i}`} b={b} i={i} saveIfChanged={saveIfChanged} setItems={setItems} onGoToDetail={b.id ? () => navigateToBudgetDetail(b.id!) : undefined} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetsPage;

function BudgetRow({
  b,
  i,
  saveIfChanged,
  setItems,
  onGoToDetail,
}: {
  b: EditableBudget;
  i: number;
  saveIfChanged: (i: number) => void;
  setItems: (fn: (prev: EditableBudget[]) => EditableBudget[]) => void;
  onGoToDetail?: () => void;
}) {
  const key = `${b.item_key}-${b.year}-${b.month}`;
  const usedAmount = typeof b.used_amount === 'number' ? b.used_amount : 0;

  return (
    <tr
      key={key}
      className={`border-t transition-colors duration-150 ${
        onGoToDetail
          ? 'cursor-pointer hover:bg-amber-50 active:bg-amber-100'
          : 'bg-white'
      }`}
      onClick={onGoToDetail ?? undefined}
    >
      <td className="px-4 py-3 w-1/4 text-xs">
        {b.item_key || '—'}
      </td>
      <td className="px-4 py-3 w-1/4" onClick={(e) => e.stopPropagation()}>
        <Input
          type="text"
          inputMode="numeric"
          value={b.max_amount === '' ? '' : String(b.max_amount)}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d]/g, '');
            const parsed: number | '' = v === '' ? '' : Number(v);
            setItems((prev: EditableBudget[]) => prev.map((it: EditableBudget, idx: number) => idx === i ? { ...it, max_amount: parsed } : it));
          }}
          onBlur={() => saveIfChanged(i)}
        />
      </td>
      <td className="px-4 py-3 w-1/4 tabular-nums">
        <span className="flex items-center justify-between gap-2 min-w-0 w-full">
          <span>¥{usedAmount.toLocaleString('ja-JP')}</span>
          {onGoToDetail && <ChevronRight className="h-4 w-4 shrink-0 text-amber-500/70" />}
        </span>
      </td>
    </tr>
  );
}
