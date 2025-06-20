import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface WishlistItem {
  id: string;
  user_id: string;
  name: string;
  price: number;
  priority: number;
  created_at: string;
  achieved_at?: string | null;
}

interface WishlistState {
  wishlist: WishlistItem[];
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'user_id' | 'created_at' | 'achieved_at'>) => Promise<void>;
  updateWishlistItem: (id: string, item: Partial<WishlistItem>) => Promise<void>;
  deleteWishlistItem: (id: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: [],
  loading: false,

  fetchWishlist: async () => {
    set({ loading: true });
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', user.user.id)
      .order('priority', { ascending: true });
    if (!error && data) {
      set({ wishlist: data });
    }
    set({ loading: false });
  },

  addWishlistItem: async (item) => {
    set({ loading: true });
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data, error } = await supabase
      .from('wishlist')
      .insert([{ ...item, user_id: user.user.id }])
      .select()
      .single();
    if (!error && data) {
      set({ wishlist: [...get().wishlist, data] });
    }
    set({ loading: false });
  },

  updateWishlistItem: async (id, item) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('wishlist')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      set({
        wishlist: get().wishlist.map(w => w.id === id ? data : w)
      });
    }
    set({ loading: false });
  },

  deleteWishlistItem: async (id) => {
    set({ loading: true });
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', id);
    if (!error) {
      set({
        wishlist: get().wishlist.filter(w => w.id !== id)
      });
    }
    set({ loading: false });
  },
})); 