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
  lastFetchTime: number | null;
  cacheExpiryTime: number; // キャッシュ有効期限（ミリ秒）
  fetchWishlist: (forceRefresh?: boolean) => Promise<void>;
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'user_id' | 'created_at' | 'achieved_at'>) => Promise<void>;
  updateWishlistItem: (id: string, item: Partial<WishlistItem>) => Promise<void>;
  deleteWishlistItem: (id: string) => Promise<void>;
  clearCache: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: [],
  loading: false,
  lastFetchTime: null,
  cacheExpiryTime: 5 * 60 * 1000, // 5分間キャッシュ

  fetchWishlist: async (forceRefresh = false) => {
    const { lastFetchTime, cacheExpiryTime, wishlist } = get();
    const now = Date.now();

    // キャッシュが有効で強制リフレッシュでない場合は早期リターン
    if (!forceRefresh && lastFetchTime && wishlist.length > 0 && (now - lastFetchTime < cacheExpiryTime)) {
      console.log('🔄 欲しいものリスト: キャッシュを使用');
      return;
    }

    console.log('📡 欲しいものリスト: サーバーからデータを取得');
    set({ loading: true });
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      set({ loading: false });
      return;
    }
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', user.user.id)
      .order('priority', { ascending: true });
    if (!error && data) {
      set({ wishlist: data, lastFetchTime: now });
    }
    set({ loading: false });
  },

  addWishlistItem: async (item) => {
    set({ loading: true });
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      set({ loading: false });
      return;
    }
    const { data, error } = await supabase
      .from('wishlist')
      .insert([{ ...item, user_id: user.user.id }])
      .select()
      .single();
    if (!error && data) {
      set({ 
        wishlist: [...get().wishlist, data],
        lastFetchTime: Date.now() // キャッシュを更新
      });
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
        wishlist: get().wishlist.map(w => w.id === id ? data : w),
        lastFetchTime: Date.now() // キャッシュを更新
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
        wishlist: get().wishlist.filter(w => w.id !== id),
        lastFetchTime: Date.now() // キャッシュを更新
      });
    }
    set({ loading: false });
  },

  clearCache: () => {
    set({ lastFetchTime: null });
  },
})); 