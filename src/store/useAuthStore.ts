import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      set({ user: data.user });
      return {};
    } catch {
      return { error: 'ログインに失敗しました' };
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      set({ user: data.user });
      return {};
    } catch {
      return { error: 'アカウント作成に失敗しました' };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  initialize: async () => {
    try {
      // 🔒 セキュリティ: テスト環境でのみ認証バイパスを許可
      const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                               import.meta.env.VITE_ENVIRONMENT === 'test' ||
                               (typeof window !== 'undefined' && window.Cypress);
      
      const isDevelopment = process.env.NODE_ENV === 'development' && 
                           import.meta.env.VITE_ENVIRONMENT === 'development';

      // Cypress環境でのモックユーザー設定をチェック（テスト環境のみ）
      if (isTestEnvironment && typeof window !== 'undefined' && (window as { __MOCK_USER__?: unknown }).__MOCK_USER__) {
        const mockUser = (window as { __MOCK_USER__?: unknown }).__MOCK_USER__;
        console.warn('🧪 TEST MODE: Using mock user authentication');
        set({ user: mockUser, loading: false });
        return;
      }

      // テスト環境での自動ログイン（Cypressテスト用）
      if (isTestEnvironment && typeof window !== 'undefined' && window.Cypress) {
        const testUser = {
          id: 'test-user-id',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated'
        };
        console.warn('🧪 TEST MODE: Using Cypress test user');
        set({ user: testUser as typeof testUser, loading: false });
        return;
      }

      // 開発環境でのデモモード（厳格な条件チェック）
      if (isDevelopment && 
          import.meta.env.VITE_DEMO_MODE === 'true' &&
          import.meta.env.VITE_SUPABASE_URL === 'INVALID_URL_NEEDS_REPLACEMENT') {
        const demoUser = {
          id: 'demo-user-id',
          email: 'demo@example.com',
          aud: 'authenticated',
          role: 'authenticated'
        };
        console.warn('🔧 DEMO MODE: Using demo user (development only)');
        set({ user: demoUser as typeof demoUser, loading: false });
        return;
      }

      // 本番環境では常に正規の認証フローを使用
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session retrieval failed:', error);
        set({ user: null, loading: false });
      } else {
        set({ user: session?.user ?? null, loading: false });
      }

      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        set({ user: session?.user ?? null, loading: false });

        // セッションが無効になった場合のログ
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          console.log('User session expired or signed out');
        }
      });
    } catch (error) {
      console.error('Authentication initialization failed:', error);
      set({ loading: false });
    }
  },
}));