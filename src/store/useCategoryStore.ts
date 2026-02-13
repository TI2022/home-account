import { create } from 'zustand';
import * as categoriesLib from '@/lib/categories';

type Category = {
  id: string;
  user_id: string;
  name: string;
  type: 'expense' | 'income';
  color?: string | null;
  created_at?: string;
  updated_at?: string;
};

interface CategoryState {
  categories: Category[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (name: string, type: 'expense' | 'income', color?: string | null) => Promise<Category | null>;
  updateCategory: (id: string, fields: Partial<Category>) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<boolean>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  fetchCategories: async () => {
    set({ loading: true });
    try {
      const data = await categoriesLib.fetchCategories();
      set({ categories: data });
    } catch (err) {
      console.error('fetchCategories failed', err);
    } finally {
      set({ loading: false });
    }
  },
  addCategory: async (name, type, color = null) => {
    try {
      const saved = await categoriesLib.upsertCategory({ name, type, color });
      if (saved) {
        // Refresh from server to ensure list is consistent with DB (and get created_at)
        try {
            const data = await categoriesLib.fetchCategories();
            set({ categories: data });
          } catch (e) {
            console.error('fetchCategories fallback failed', e);
            // fallback to optimistic add
            set((state) => ({ categories: [...state.categories, saved] }));
          }
      }
      return saved;
    } catch (err) {
      console.error('addCategory failed', err);
      return null;
    }
  },
  updateCategory: async (id, fields) => {
      try {
      const existing = get().categories.find(c => c.id === id);
      if (!existing) return null;
  const payload = { ...existing, ...fields } as Category;
  const saved = await categoriesLib.upsertCategory(payload);
      if (saved) {
        try {
          const data = await categoriesLib.fetchCategories();
          set({ categories: data });
        } catch (e) {
          console.error('fetchCategories fallback failed', e);
          set((state) => ({ categories: state.categories.map(c => c.id === id ? saved : c) }));
        }
      }
      return saved;
    } catch (err) {
      console.error('updateCategory failed', err);
      return null;
    }
  },
  deleteCategory: async (id) => {
    try {
      const ok = await categoriesLib.deleteCategory(id);
      if (ok) set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
      return ok;
    } catch (err) {
      console.error('deleteCategory failed', err);
      return false;
    }
  }
}));

export default useCategoryStore;
