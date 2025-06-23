import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Transaction, Budget, RecurringIncome, RecurringExpense } from '@/types';
import { format } from 'date-fns';

interface TransactionState {
  transactions: Transaction[];
  budgets: Budget[];
  recurringIncomes: RecurringIncome[];
  recurringExpenses: RecurringExpense[];
  loading: boolean;
  fetchTransactions: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchRecurringIncomes: () => Promise<void>;
  fetchRecurringExpenses: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBudget: (category: string, amount: number, month: string) => Promise<void>;
  addRecurringIncome: (income: Omit<RecurringIncome, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateRecurringIncome: (id: string, income: Partial<Omit<RecurringIncome, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteRecurringIncome: (id: string) => Promise<void>;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateRecurringExpense: (id: string, expense: Partial<Omit<RecurringExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  reflectRecurringExpensesForPeriod: (startDate: string, endDate: string) => Promise<void>;
  reflectRecurringIncomesForPeriod: (startDate: string, endDate: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  budgets: [],
  recurringIncomes: [],
  recurringExpenses: [],
  loading: false,

  fetchTransactions: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      set({ transactions: data || [] });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchBudgets: async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ budgets: data || [] });
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  },

  fetchRecurringIncomes: async () => {
    try {
      const { data, error } = await supabase
        .from('recurring_income')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ recurringIncomes: data || [] });
    } catch (error) {
      console.error('Error fetching recurring incomes:', error);
    }
  },

  fetchRecurringExpenses: async () => {
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ recurringExpenses: data || [] });
    } catch (error) {
      console.error('Error fetching recurring expenses:', error);
    }
  },

  addTransaction: async (transaction) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            ...transaction,
            user_id: user.user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const currentTransactions = get().transactions;
      set({ transactions: [data, ...currentTransactions] });
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  },

  updateBudget: async (category: string, amount: number, month: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .upsert([
          {
            user_id: user.user.id,
            category,
            amount,
            month,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const currentBudgets = get().budgets;
      const existingIndex = currentBudgets.findIndex(
        b => b.category === category && b.month === month
      );

      if (existingIndex >= 0) {
        const newBudgets = [...currentBudgets];
        newBudgets[existingIndex] = data;
        set({ budgets: newBudgets });
      } else {
        set({ budgets: [data, ...currentBudgets] });
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  },

  addRecurringIncome: async (income) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('recurring_income')
        .insert([
          {
            ...income,
            user_id: user.user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const currentIncomes = get().recurringIncomes;
      set({ recurringIncomes: [data, ...currentIncomes] });
    } catch (error) {
      console.error('Error adding recurring income:', error);
      throw error;
    }
  },

  updateRecurringIncome: async (id: string, income) => {
    try {
      const { data, error } = await supabase
        .from('recurring_income')
        .update(income)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const currentIncomes = get().recurringIncomes;
      const updatedIncomes = currentIncomes.map(item => 
        item.id === id ? data : item
      );
      set({ recurringIncomes: updatedIncomes });
    } catch (error) {
      console.error('Error updating recurring income:', error);
      throw error;
    }
  },

  deleteRecurringIncome: async (id: string) => {
    try {
      const { error } = await supabase
        .from('recurring_income')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const currentIncomes = get().recurringIncomes;
      const filteredIncomes = currentIncomes.filter(item => item.id !== id);
      set({ recurringIncomes: filteredIncomes });
    } catch (error) {
      console.error('Error deleting recurring income:', error);
      throw error;
    }
  },

  addRecurringExpense: async (expense) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert([
          {
            ...expense,
            user_id: user.user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const currentExpenses = get().recurringExpenses;
      set({ recurringExpenses: [data, ...currentExpenses] });
    } catch (error) {
      console.error('Error adding recurring expense:', error);
      throw error;
    }
  },

  updateRecurringExpense: async (id: string, expense) => {
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update(expense)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const currentExpenses = get().recurringExpenses;
      const updatedExpenses = currentExpenses.map(item => 
        item.id === id ? data : item
      );
      set({ recurringExpenses: updatedExpenses });
    } catch (error) {
      console.error('Error updating recurring expense:', error);
      throw error;
    }
  },

  deleteRecurringExpense: async (id: string) => {
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const currentExpenses = get().recurringExpenses;
      const filteredExpenses = currentExpenses.filter(item => item.id !== id);
      set({ recurringExpenses: filteredExpenses });
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      throw error;
    }
  },

  updateTransaction: async (transaction) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', transaction.id)
        .select()
        .single();

      if (error) throw error;

      const currentTransactions = get().transactions;
      const updatedTransactions = currentTransactions.map(t => 
        t.id === transaction.id ? data : t
      );
      set({ transactions: updatedTransactions });
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const currentTransactions = get().transactions;
      const filteredTransactions = currentTransactions.filter(t => t.id !== id);
      set({ transactions: filteredTransactions });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  reflectRecurringExpensesForPeriod: async (startDate: string, endDate: string) => {
    const { addTransaction, fetchRecurringExpenses, fetchTransactions } = get();
    await fetchRecurringExpenses();
    await fetchTransactions();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const currentExpenses = get().recurringExpenses || [];
    for (const exp of currentExpenses) {
      if (!exp.is_active) continue;
      const d = new Date(start);
      while (d <= end) {
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        let paymentDay: number | undefined = undefined;
        if (exp.payment_schedule) {
          const schedule = exp.payment_schedule.find(s => s.month === month);
          if (schedule) paymentDay = schedule.day;
        }
        if (paymentDay !== undefined) {
          const paymentDate = new Date(year, month - 1, paymentDay);
          if (paymentDate >= start && paymentDate <= end) {
            const paymentDateStr = format(paymentDate, 'yyyy-MM-dd');
            const exists = (get().transactions || []).some(t =>
              t.date === paymentDateStr &&
              t.amount === exp.amount &&
              t.category === exp.category &&
              t.type === 'expense'
            );
            if (!exists) {
              await addTransaction({
                type: 'expense',
                amount: exp.amount,
                category: exp.category,
                date: paymentDateStr,
                memo: exp.name,
              });
            }
          }
        }
        d.setMonth(d.getMonth() + 1);
        d.setDate(1); // 月初に調整
      }
    }
  },

  reflectRecurringIncomesForPeriod: async (startDate: string, endDate: string) => {
    const { addTransaction, fetchRecurringIncomes, fetchTransactions } = get();
    await fetchRecurringIncomes();
    await fetchTransactions();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const currentIncomes = get().recurringIncomes || [];
    for (const inc of currentIncomes) {
      if (!inc.is_active) continue;
      const d = new Date(start);
      while (d <= end) {
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const paymentDate = new Date(year, month - 1, inc.day_of_month);
        if (paymentDate >= start && paymentDate <= end) {
          const paymentDateStr = format(paymentDate, 'yyyy-MM-dd');
          const exists = (get().transactions || []).some(t =>
            t.date === paymentDateStr &&
            t.amount === inc.amount &&
            t.category === inc.category &&
            t.type === 'income'
          );
          if (!exists) {
            await addTransaction({
              type: 'income',
              amount: inc.amount,
              category: inc.category,
              date: paymentDateStr,
              memo: inc.name,
            });
          }
        }
        d.setMonth(d.getMonth() + 1);
        d.setDate(1);
      }
    }
  },
}));