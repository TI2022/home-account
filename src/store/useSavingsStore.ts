import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface SavingsState {
  savingsAmount: number;
  loading: boolean;
  fetchSavingsAmount: () => Promise<void>;
  setSavingsAmount: (amount: number) => Promise<void>;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  savingsAmount: 0,
  loading: false,

  fetchSavingsAmount: async () => {
    set({ loading: true });
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data, error } = await supabase
      .from('savings')
      .select('amount')
      .eq('user_id', user.user.id)
      .single();
    if (!error && data) {
      set({ savingsAmount: data.amount });
    }
    set({ loading: false });
  },

  setSavingsAmount: async (amount: number) => {
    set({ loading: true });
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    // upsertでユーザーごとに1レコード
    const { data, error } = await supabase
      .from('savings')
      .upsert([
        { user_id: user.user.id, amount }
      ], { onConflict: ['user_id'] })
      .select()
      .single();
    if (!error && data) {
      set({ savingsAmount: data.amount });
    }
    set({ loading: false });
  },
})); 