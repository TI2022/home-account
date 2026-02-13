import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export type BudgetItem = {
  id: string;
  user_id: string;
  name: string;
  color?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function fetchBudgetItems(userId?: string): Promise<BudgetItem[]> {
  const uid = userId ?? useAuthStore.getState().user?.id;
  if (!uid) return [];

  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('user_id', uid)
    .order('name', { ascending: true });

  if (error) {
    console.error('fetchBudgetItems error', error);
    return [];
  }
  return (data ?? []) as BudgetItem[];
}

export async function upsertBudgetItem(payload: Partial<BudgetItem> & { name: string; id?: string; user_id?: string }): Promise<BudgetItem | null> {
  const uid = payload.user_id ?? useAuthStore.getState().user?.id;
  if (!uid) return null;

  const body: Partial<BudgetItem> & { user_id: string; name: string } = { user_id: uid, name: payload.name };
  if (payload.color) body.color = payload.color;
  if (payload.id) body.id = payload.id; // include only when editing

  const { data, error } = await supabase
    .from('budget_items')
    .upsert([body], { onConflict: 'user_id,name' })
    .select()
    .single();

  if (error) {
    console.error('upsertBudgetItem error', error);
    return null;
  }
  return (data as BudgetItem) ?? null;
}

export async function deleteBudgetItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('budget_items').delete().eq('id', id);
  if (error) {
    console.error('deleteBudgetItem error', error);
    return false;
  }
  return true;
}

export default {
  fetchBudgetItems,
  upsertBudgetItem,
  deleteBudgetItem,
};
