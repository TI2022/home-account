import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export type MonthlyBudget = {
  id: string;
  user_id: string;
  item_key: string;
  year: number;
  month: number;
  max_amount: number;
  used_amount: number;
  created_at?: string;
  updated_at?: string;
};

export async function fetchBudgets(year: number, month: number, userId?: string): Promise<MonthlyBudget[]> {
  const uid = userId ?? useAuthStore.getState().user?.id;
  if (!uid) return [];

  const { data, error } = await supabase
    .from('monthly_budgets')
    .select('*')
    .eq('user_id', uid)
    .eq('year', year)
    .eq('month', month)
    .order('item_key', { ascending: true });

  if (error) {
    console.error('fetchBudgets error', error);
    return [];
  }
  return (data ?? []).map((d: Record<string, unknown>) => ({
    id: String(d['id']),
    user_id: String(d['user_id']),
    item_key: String(d['item_key']),
    year: Number(d['year']),
    month: Number(d['month']),
    max_amount: Number(d['max_amount']),
    used_amount: Number(d['used_amount'] ?? 0),
    created_at: typeof d['created_at'] === 'string' ? String(d['created_at']) : undefined,
    updated_at: typeof d['updated_at'] === 'string' ? String(d['updated_at']) : undefined,
  })) as MonthlyBudget[];
}

export async function fetchBudgetById(budgetId: string, userId?: string): Promise<MonthlyBudget | null> {
  const uid = userId ?? useAuthStore.getState().user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from('monthly_budgets')
    .select('*')
    .eq('id', budgetId)
    .eq('user_id', uid)
    .single();

  if (error || !data) {
    if (error) console.error('fetchBudgetById error', error);
    return null;
  }
  const d = data as Record<string, unknown>;
  return {
    id: String(d['id']),
    user_id: String(d['user_id']),
    item_key: String(d['item_key']),
    year: Number(d['year']),
    month: Number(d['month']),
    max_amount: Number(d['max_amount']),
    used_amount: Number(d['used_amount'] ?? 0),
    created_at: typeof d['created_at'] === 'string' ? String(d['created_at']) : undefined,
    updated_at: typeof d['updated_at'] === 'string' ? String(d['updated_at']) : undefined,
  } as MonthlyBudget;
}

export async function upsertBudget(budget: Partial<MonthlyBudget> & { item_key: string; year: number; month: number; max_amount: number; used_amount?: number; id?: string; user_id?: string }): Promise<MonthlyBudget | null> {
  const uid = budget.user_id ?? useAuthStore.getState().user?.id;
  if (!uid) return null;

  // Only include `id` when provided to avoid sending `null` which violates NOT NULL constraint
  const payload: Partial<MonthlyBudget> & { user_id: string } = {
    user_id: uid,
    item_key: budget.item_key,
    year: budget.year,
    month: budget.month,
    max_amount: budget.max_amount,
  };
  if (typeof budget.used_amount !== 'undefined') payload.used_amount = budget.used_amount;
  if (budget.id) payload.id = budget.id;

  const { data, error } = await supabase
    .from('monthly_budgets')
    .upsert([payload], { onConflict: 'user_id,item_key,year,month' })
    .select()
    .single();

  if (error) {
    console.error('upsertBudget error', error);
    return null;
  }
  // when using .single() supabase returns an object in `data`
  return (data as MonthlyBudget) ?? null;
}

export async function deleteBudget(id: string): Promise<boolean> {
  const { error } = await supabase.from('monthly_budgets').delete().eq('id', id);
  if (error) {
    console.error('deleteBudget error', error);
    return false;
  }
  return true;
}

export default {
  fetchBudgets,
  fetchBudgetById,
  upsertBudget,
  deleteBudget,
};
