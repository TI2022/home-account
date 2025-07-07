import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Scenario } from '@/types';

interface ScenarioStore {
  scenarios: Scenario[];
  loading: boolean;
  error: string | null;
  fetchScenarios: () => Promise<void>;
  createScenario: (scenario: Omit<Scenario, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateScenario: (id: string, updates: Partial<Omit<Scenario, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
  setDefaultScenario: (id: string) => Promise<void>;
  getDefaultScenario: () => Scenario | null;
}

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
  scenarios: [],
  loading: false,
  error: null,

  fetchScenarios: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ scenarios: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      set({ error: 'シナリオの取得に失敗しました', loading: false });
    }
  },

  createScenario: async (scenario) => {
    set({ loading: true, error: null });
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      const { error } = await supabase
        .from('scenarios')
        .insert([{
          ...scenario,
          user_id: user.id
        }]);

      if (error) throw error;
      await get().fetchScenarios();
    } catch (error) {
      console.error('Error creating scenario:', error);
      set({ error: 'シナリオの作成に失敗しました', loading: false });
    }
  },

  updateScenario: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('scenarios')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await get().fetchScenarios();
    } catch (error) {
      console.error('Error updating scenario:', error);
      set({ error: 'シナリオの更新に失敗しました', loading: false });
    }
  },

  deleteScenario: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchScenarios();
    } catch (error) {
      console.error('Error deleting scenario:', error);
      set({ error: 'シナリオの削除に失敗しました', loading: false });
    }
  },

  setDefaultScenario: async (id) => {
    set({ loading: true, error: null });
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      // まず現在のユーザーの全てのシナリオをデフォルトから外す
      const { error: resetError } = await supabase
        .from('scenarios')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (resetError) throw resetError;

      // 指定されたシナリオをデフォルトに設定
      const { error } = await supabase
        .from('scenarios')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await get().fetchScenarios();
    } catch (error) {
      console.error('Error setting default scenario:', error);
      set({ error: 'デフォルトシナリオの設定に失敗しました', loading: false });
    }
  },

  getDefaultScenario: () => {
    const { scenarios } = get();
    return scenarios.find(s => s.is_default) || null;
  },
})); 