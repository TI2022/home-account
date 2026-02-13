import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: 'expense' | 'income';
  color?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function fetchCategories(userId?: string): Promise<Category[]> {
  const uid = userId ?? useAuthStore.getState().user?.id;
  if (!uid) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchCategories error', error);
    return [];
  }
  return (data ?? []) as Category[];
}

export async function upsertCategory(cat: Partial<Category> & { name: string; type: 'expense' | 'income'; id?: string; user_id?: string; color?: string | null }): Promise<Category | null> {
  const uid = cat.user_id ?? useAuthStore.getState().user?.id;
  if (!uid) return null;

  const payload = {
    user_id: uid,
    name: cat.name,
    type: cat.type,
    color: cat.color ?? null,
  };
  // only include id when provided; sending `id: undefined` or `id: null`
  // causes Postgres to attempt inserting null into the PK column.
  if (cat.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (payload as any).id = cat.id;
  }

  const { data, error } = await supabase
    .from('categories')
    .upsert([payload], { onConflict: 'user_id,name,type' })
    .select()
    .single();

  if (error) {
    console.error('upsertCategory error', error);
    return null;
  }
  return data as Category;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) {
    console.error('deleteCategory error', error);
    return false;
  }
  return true;
}

export default { fetchCategories, upsertCategory, deleteCategory };
