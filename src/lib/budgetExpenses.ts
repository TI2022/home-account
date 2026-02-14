import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export type BudgetExpense = {
  id: string;
  user_id: string;
  budget_id: string;
  memo: string;
  amount: number;
  created_at?: string;
  updated_at?: string;
};

export async function fetchBudgetExpensesByBudgetId(
  budgetId: string,
  userId?: string
): Promise<BudgetExpense[]> {
  const uid = userId ?? useAuthStore.getState().user?.id;
  if (!uid) return [];

  const { data, error } = await supabase
    .from('budget_expenses')
    .select('*')
    .eq('user_id', uid)
    .eq('budget_id', budgetId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchBudgetExpensesByBudgetId error', error);
    return [];
  }
  return (data ?? []).map((d: Record<string, unknown>) => ({
    id: String(d['id']),
    user_id: String(d['user_id']),
    budget_id: String(d['budget_id']),
    memo: String(d['memo'] ?? ''),
    amount: Number(d['amount'] ?? 0),
    created_at: typeof d['created_at'] === 'string' ? d['created_at'] : undefined,
    updated_at: typeof d['updated_at'] === 'string' ? d['updated_at'] : undefined,
  })) as BudgetExpense[];
}

async function recalcBudgetUsedAmount(budgetId: string): Promise<void> {
  const { data } = await supabase
    .from('budget_expenses')
    .select('amount')
    .eq('budget_id', budgetId);

  const sum = (data ?? []).reduce((acc, row) => acc + Number(row?.amount ?? 0), 0);

  await supabase
    .from('monthly_budgets')
    .update({ used_amount: sum })
    .eq('id', budgetId);
}

export async function createBudgetExpense(payload: {
  budget_id: string;
  memo: string;
  amount: number;
  user_id?: string;
}): Promise<BudgetExpense | null> {
  const uid = payload.user_id ?? useAuthStore.getState().user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from('budget_expenses')
    .insert([
      {
        user_id: uid,
        budget_id: payload.budget_id,
        memo: payload.memo.trim() || '',
        amount: payload.amount,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('createBudgetExpense error', error);
    throw new Error(error.message);
  }
  try {
    await recalcBudgetUsedAmount(payload.budget_id);
  } catch (recalcErr) {
    console.error('recalcBudgetUsedAmount error', recalcErr);
    // 挿入は成功しているのでそのまま返す
  }
  return data as BudgetExpense;
}

export async function updateBudgetExpense(
  id: string,
  payload: { memo?: string; amount?: number }
): Promise<BudgetExpense | null> {
  const uid = useAuthStore.getState().user?.id;
  if (!uid) return null;

  const body: { memo?: string; amount?: number } = {};
  if (payload.memo !== undefined) body.memo = payload.memo.trim() || '';
  if (payload.amount !== undefined) body.amount = payload.amount;

  const { data: expense } = await supabase
    .from('budget_expenses')
    .select('budget_id')
    .eq('id', id)
    .eq('user_id', uid)
    .single();

  const { data, error } = await supabase
    .from('budget_expenses')
    .update(body)
    .eq('id', id)
    .eq('user_id', uid)
    .select()
    .single();

  if (error) {
    console.error('updateBudgetExpense error', error);
    return null;
  }
  if (expense?.budget_id) {
    await recalcBudgetUsedAmount(expense.budget_id);
  }
  return data as BudgetExpense;
}

export async function deleteBudgetExpense(id: string): Promise<boolean> {
  const uid = useAuthStore.getState().user?.id;
  if (!uid) return false;

  const { data: expense } = await supabase
    .from('budget_expenses')
    .select('budget_id')
    .eq('id', id)
    .eq('user_id', uid)
    .single();

  const { error } = await supabase
    .from('budget_expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', uid);

  if (error) {
    console.error('deleteBudgetExpense error', error);
    return false;
  }
  if (expense?.budget_id) {
    await recalcBudgetUsedAmount(expense.budget_id);
  }
  return true;
}
