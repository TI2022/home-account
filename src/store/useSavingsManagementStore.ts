import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Person, SavingsAccount, SavingsTransaction } from '@/types';

interface SavingsManagementState {
  // データ
  persons: Person[];
  accounts: SavingsAccount[];
  transactions: SavingsTransaction[];

  // ローディング状態
  loading: boolean;

  // Person操作
  fetchPersons: () => Promise<void>;
  addPerson: (person: Omit<Person, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePerson: (id: string, person: Partial<Person>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;

  // SavingsAccount操作
  fetchAccounts: (personId?: string) => Promise<void>;
  addAccount: (account: Omit<SavingsAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<SavingsAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // SavingsTransaction操作
  fetchTransactions: (accountId?: string) => Promise<void>;
  addTransaction: (transaction: Omit<SavingsTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<SavingsTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // ユーティリティ
  getPersonAccounts: (personId: string) => SavingsAccount[];
  getAccountTransactions: (accountId: string) => SavingsTransaction[];
  getPersonTotalBalance: (personId: string) => number;
}

export const useSavingsManagementStore = create<SavingsManagementState>((set, get) => ({
  // 初期状態
  persons: [],
  accounts: [],
  transactions: [],
  loading: false,

  // Person操作
  fetchPersons: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ persons: data || [] });
    } catch (error) {
      console.error('個人リスト取得エラー:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addPerson: async (person) => {
    try {
      console.log('=== 個人追加開始 ===');
      console.log('追加しようとしているperson:', person);

      const { data: { user } } = await supabase.auth.getUser();
      console.log('現在のユーザー:', user);

      if (!user) {
        console.error('ユーザーが認証されていません');
        throw new Error('認証が必要です');
      }

      const insertData = { ...person, user_id: user.id };
      console.log('Supabaseに送信するデータ:', insertData);

      const { data, error } = await supabase
        .from('persons')
        .insert([insertData])
        .select()
        .single();

      console.log('Supabaseからの応答:');
      console.log('data:', data);
      console.log('error:', error);

      if (error) {
        console.error('Supabaseエラー詳細:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('個人追加成功:', data);
      set(state => ({ persons: [...state.persons, data] }));
    } catch (error) {
      console.error('個人追加エラー:', error);
      console.error('エラーの型:', typeof error);
      console.error('エラーの内容:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  updatePerson: async (id, person) => {
    try {
      const { data, error } = await supabase
        .from('persons')
        .update(person)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set(state => ({
        persons: state.persons.map(p => p.id === id ? data : p)
      }));
    } catch (error) {
      console.error('個人更新エラー:', error);
      throw error;
    }
  },

  deletePerson: async (id) => {
    try {
      // 関連する積立口座とトランザクションも削除
      const { error: transactionError } = await supabase
        .from('savings_transactions')
        .delete()
        .in('account_id',
          get().accounts.filter(a => a.person_id === id).map(a => a.id)
        );

      if (transactionError) throw transactionError;

      const { error: accountError } = await supabase
        .from('savings_accounts')
        .delete()
        .eq('person_id', id);

      if (accountError) throw accountError;

      const { error } = await supabase
        .from('persons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        persons: state.persons.filter(p => p.id !== id),
        accounts: state.accounts.filter(a => a.person_id !== id),
        transactions: state.transactions.filter(t =>
          !state.accounts.some(a => a.person_id === id && a.id === t.account_id)
        )
      }));
    } catch (error) {
      console.error('個人削除エラー:', error);
      throw error;
    }
  },

  // SavingsAccount操作
  fetchAccounts: async (personId) => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      let query = supabase
        .from('savings_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (personId) {
        query = query.eq('person_id', personId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      set({ accounts: data || [] });
    } catch (error) {
      console.error('積立口座取得エラー:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addAccount: async (account) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      const { data, error } = await supabase
        .from('savings_accounts')
        .insert([{ ...account, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      set(state => ({ accounts: [...state.accounts, data] }));
    } catch (error) {
      console.error('積立口座追加エラー:', error);
      throw error;
    }
  },

  updateAccount: async (id, account) => {
    try {
      const { data, error } = await supabase
        .from('savings_accounts')
        .update(account)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set(state => ({
        accounts: state.accounts.map(a => a.id === id ? data : a)
      }));
    } catch (error) {
      console.error('積立口座更新エラー:', error);
      throw error;
    }
  },

  deleteAccount: async (id) => {
    try {
      // 関連するトランザクションも削除
      const { error: transactionError } = await supabase
        .from('savings_transactions')
        .delete()
        .eq('account_id', id);

      if (transactionError) throw transactionError;

      const { error } = await supabase
        .from('savings_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        accounts: state.accounts.filter(a => a.id !== id),
        transactions: state.transactions.filter(t => t.account_id !== id)
      }));
    } catch (error) {
      console.error('積立口座削除エラー:', error);
      throw error;
    }
  },

  // SavingsTransaction操作
  fetchTransactions: async (accountId) => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      let query = supabase
        .from('savings_transactions')
        .select('*')
        .eq('user_id', user.id);

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      set({ transactions: data || [] });
    } catch (error) {
      console.error('積立取引取得エラー:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addTransaction: async (transaction) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      // トランザクションを追加
      const { data, error } = await supabase
        .from('savings_transactions')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // 口座残高を更新
      const account = get().accounts.find(a => a.id === transaction.account_id);
      if (account) {
        const balanceChange = transaction.type === 'deposit' ? transaction.amount : -transaction.amount;
        const newBalance = account.current_balance + balanceChange;

        await get().updateAccount(account.id, { current_balance: newBalance });
      }

      set(state => ({ transactions: [data, ...state.transactions] }));
    } catch (error) {
      console.error('積立取引追加エラー:', error);
      throw error;
    }
  },

  updateTransaction: async (id, transaction) => {
    try {
      const oldTransaction = get().transactions.find(t => t.id === id);
      if (!oldTransaction) throw new Error('取引が見つかりません');

      const { data, error } = await supabase
        .from('savings_transactions')
        .update(transaction)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 残高の差分を計算して口座残高を更新
      if (transaction.amount !== undefined || transaction.type !== undefined) {
        const account = get().accounts.find(a => a.id === oldTransaction.account_id);
        if (account) {
          const oldBalanceChange = oldTransaction.type === 'deposit' ? oldTransaction.amount : -oldTransaction.amount;
          const newBalanceChange = (transaction.type || oldTransaction.type) === 'deposit' ?
            (transaction.amount || oldTransaction.amount) : -(transaction.amount || oldTransaction.amount);
          const difference = newBalanceChange - oldBalanceChange;
          const newBalance = account.current_balance + difference;

          await get().updateAccount(account.id, { current_balance: newBalance });
        }
      }

      set(state => ({
        transactions: state.transactions.map(t => t.id === id ? data : t)
      }));
    } catch (error) {
      console.error('積立取引更新エラー:', error);
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    try {
      const transaction = get().transactions.find(t => t.id === id);
      if (!transaction) throw new Error('取引が見つかりません');

      const { error } = await supabase
        .from('savings_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 口座残高を元に戻す
      const account = get().accounts.find(a => a.id === transaction.account_id);
      if (account) {
        const balanceChange = transaction.type === 'deposit' ? -transaction.amount : transaction.amount;
        const newBalance = account.current_balance + balanceChange;

        await get().updateAccount(account.id, { current_balance: newBalance });
      }

      set(state => ({
        transactions: state.transactions.filter(t => t.id !== id)
      }));
    } catch (error) {
      console.error('積立取引削除エラー:', error);
      throw error;
    }
  },

  // ユーティリティ
  getPersonAccounts: (personId) => {
    return get().accounts.filter(account => account.person_id === personId);
  },

  getAccountTransactions: (accountId) => {
    return get().transactions.filter(transaction => transaction.account_id === accountId);
  },

  getPersonTotalBalance: (personId) => {
    const personAccounts = get().getPersonAccounts(personId);
    return personAccounts.reduce((total, account) => total + account.current_balance, 0);
  }
}));