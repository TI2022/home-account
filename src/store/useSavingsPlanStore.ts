import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface SavingsPlan {
  id: string;
  user_id: string;
  goal_amount: number;
  monthly_target: number;
  target_date: string | null;
  created_at: string;
}

interface SavingsPlanState {
  plan: SavingsPlan | null;
  loading: boolean;
  fetchPlan: () => Promise<void>;
  upsertPlan: (plan: Omit<SavingsPlan, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
}

export const useSavingsPlanStore = create<SavingsPlanState>((set, get) => ({
  plan: null,
  loading: false,

  fetchPlan: async () => {
    set({ loading: true });
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data, error } = await supabase
      .from('savings_plan')
      .select('*')
      .eq('user_id', user.user.id)
      .single();
    if (!error && data) {
      set({ plan: data });
    }
    set({ loading: false });
  },

  upsertPlan: async (plan) => {
    set({ loading: true });
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data, error } = await supabase
      .from('savings_plan')
      .upsert([{ ...plan, user_id: user.user.id }], { onConflict: ['user_id'] })
      .select()
      .single();
    if (!error && data) {
      set({ plan: data });
    }
    set({ loading: false });
  },
})); 