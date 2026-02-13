import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Transaction, Budget, RecurringIncome, RecurringExpense } from '@/types';

// Local type for monthly budgets fetched from DB
export interface MonthlyBudgetLocal {
  id: string;
  user_id: string;
  item_key: string;
  year: number;
  month: number;
  max_amount: number;
  used_amount: number;
  created_at?: string;
  updated_at?: string;
}

interface TransactionState {
  transactions: Transaction[];
  budgets: Budget[];
  monthlyBudgets: MonthlyBudgetLocal[];
  recurringIncomes: RecurringIncome[];
  recurringExpenses: RecurringExpense[];
  loading: boolean;
  _lastFetchTime: {
    recurringExpenses: number;
    recurringIncomes: number;
    transactions: number;
  };
  fetchTransactions: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchRecurringIncomes: () => Promise<void>;
  fetchRecurringExpenses: () => Promise<void>;
  // monthly budgets for per-item per-month limits
  fetchMonthlyBudgets: (year?: number, month?: number) => Promise<void>;
  getBudgetSummary: (itemKey: string, year?: number, month?: number) => { budget: MonthlyBudgetLocal | null; usedAmount: number; remaining: number | null; exceeded: boolean };
  // ...
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
  reflectRecurringExpensesForPeriod: (startDate: string, endDate: string, isMock?: boolean) => Promise<void>;
  reflectRecurringIncomesForPeriod: (startDate: string, endDate: string, isMock?: boolean) => Promise<void>;
  deleteTransactions: (ids: string[]) => Promise<void>;
  reflectSingleRecurringIncomeForPeriod: (incomeId: string, startDate: string, endDate: string, isMock?: boolean) => Promise<void>;
  reflectSingleRecurringExpenseForPeriod: (expenseId: string, startDate: string, endDate: string, isMock?: boolean) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  budgets: [],
  recurringIncomes: [],
  recurringExpenses: [],
  loading: false,
  // キャッシュ用の状態を追加
  _lastFetchTime: {
    recurringExpenses: 0,
    recurringIncomes: 0,
    transactions: 0,
  },

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

  // 追加: monthly budgets の取得
  monthlyBudgets: [],
  fetchMonthlyBudgets: async (year?: number, month?: number) => {
    try {
      const now = new Date();
      const y = year ?? now.getFullYear();
      const m = month ?? now.getMonth() + 1;
      const { data } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('year', y)
        .eq('month', m);
      set({ monthlyBudgets: data || [] });
    } catch (error) {
      console.error('Error fetching monthly budgets:', error);
    }
  },

  getBudgetSummary: (itemKey: string, year?: number, month?: number) => {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth() + 1;
    const mb = get().monthlyBudgets.find(b => b.item_key === itemKey && b.year === y && b.month === m) || null;
    const usedAmount = get().transactions
      .filter(t => t.type === 'expense' && t.category === itemKey)
      .filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === y && (d.getMonth() + 1) === m;
      })
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const max = mb ? Number(mb.max_amount) : null;
    const remaining = max !== null ? max - usedAmount : null;
    return { budget: mb, usedAmount, remaining, exceeded: max !== null ? usedAmount > max : false };
  },

  fetchRecurringIncomes: async () => {
    try {
      const { data, error } = await supabase
        .from('recurring_income')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // payment_scheduleがstringの場合はパース
      const fixed = (data || []).map((item: RecurringIncome) => ({
        ...item,
        payment_schedule: typeof item.payment_schedule === 'string'
          ? JSON.parse(item.payment_schedule)
          : item.payment_schedule || [],
      }));
      set({ recurringIncomes: fixed });
    } catch (error) {
      console.error('Error fetching recurring incomes:', error);
    }
  },

  fetchRecurringExpenses: async () => {
    const now = Date.now();
    const lastFetch = get()._lastFetchTime.recurringExpenses;
    const CACHE_DURATION = 5000; // 5秒間キャッシュ

    // キャッシュが有効な場合はスキップ
    if (now - lastFetch < CACHE_DURATION && get().recurringExpenses.length > 0) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // payment_scheduleがstringの場合はパース
      const fixed = (data || []).map((item: RecurringExpense) => ({
        ...item,
        payment_schedule: typeof item.payment_schedule === 'string'
          ? JSON.parse(item.payment_schedule)
          : item.payment_schedule || [],
      }));
      set({ 
        recurringExpenses: fixed,
        _lastFetchTime: { ...get()._lastFetchTime, recurringExpenses: now }
      });
    } catch (error) {
      console.error('Error fetching recurring expenses:', error);
    }
  },

  addTransaction: async (transaction) => {
    try {
      console.log('=== addTransaction 開始 ===');
      console.log('受信したトランザクション:', transaction);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const insertData = {
        ...transaction,
        user_id: user.user.id,
        card_used_date: transaction.card_used_date || null,
      };
      
      console.log('Supabaseに挿入するデータ:', insertData);

      const { data, error } = await supabase
        .from('transactions')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase挿入エラー:', error);
        console.error('エラーコード:', error.code);
        console.error('エラーメッセージ:', error.message);
        console.error('エラー詳細:', error.details);
        throw error;
      }

      console.log('Supabase挿入成功:', data);

      const currentTransactions = get().transactions;
      set({ transactions: [data, ...currentTransactions] });
      
      console.log('=== addTransaction 完了 ===');
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
            payment_schedule: JSON.stringify(income.payment_schedule),
            description: income.description || null,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const currentIncomes = get().recurringIncomes;
      set({ recurringIncomes: [
        {
          ...data,
          payment_schedule: typeof data.payment_schedule === 'string'
            ? JSON.parse(data.payment_schedule)
            : data.payment_schedule || [],
        },
        ...currentIncomes
      ] });
    } catch (error) {
      console.error('Error adding recurring income:', error);
      throw error;
    }
  },

  updateRecurringIncome: async (id: string, income) => {
    try {
      console.log('Updating recurring income:', { id, income });
      // payment_scheduleはupdateObjには型通り配列で持たせる
      const updateObj: Partial<Omit<RecurringIncome, 'id' | 'user_id' | 'created_at' | 'updated_at'>> = {
        ...income,
        payment_schedule: income.payment_schedule,
      };
      if ('description' in income) {
        updateObj.description = income.description || undefined;
      }
      const supabaseUpdateObj = {
        ...updateObj,
        payment_schedule: updateObj.payment_schedule
          ? JSON.stringify(updateObj.payment_schedule)
          : undefined,
      };
      const { data, error } = await supabase
        .from('recurring_income')
        .update(supabaseUpdateObj)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const currentIncomes = get().recurringIncomes;
      const updatedIncomes = currentIncomes.map(item => 
        item.id === id
          ? {
              ...data,
              payment_schedule: typeof data.payment_schedule === 'string'
                ? JSON.parse(data.payment_schedule)
                : data.payment_schedule || [],
            }
          : item
      );
      set({ recurringIncomes: updatedIncomes });
    } catch (error) {
      console.error('Error updating recurring income:', error);
      console.error('Error details:', error);
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
            payment_schedule: JSON.stringify(expense.payment_schedule),
            description: expense.description || null,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      set({ recurringExpenses: [
        {
          ...data,
          payment_schedule: typeof data.payment_schedule === 'string'
            ? JSON.parse(data.payment_schedule)
            : data.payment_schedule || [],
        },
        ...get().recurringExpenses
      ] });
    } catch (error) {
      console.error('Error adding recurring expense:', error);
      throw error;
    }
  },

  updateRecurringExpense: async (id: string, expense) => {
    try {
      console.log('Updating recurring expense:', { id, expense });
      // payment_scheduleはupdateObjには型通り配列で持たせる
      const updateObj: Partial<Omit<RecurringExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>> = {
        ...expense,
        payment_schedule: expense.payment_schedule,
      };
      if ('description' in expense) {
        updateObj.description = expense.description || undefined;
      }
      const supabaseUpdateObj = {
        ...updateObj,
        payment_schedule: updateObj.payment_schedule
          ? JSON.stringify(updateObj.payment_schedule)
          : undefined,
      };
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update(supabaseUpdateObj)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      set({ recurringExpenses: get().recurringExpenses.map(item =>
        item.id === id
          ? {
              ...data,
              payment_schedule: typeof data.payment_schedule === 'string'
                ? JSON.parse(data.payment_schedule)
                : data.payment_schedule || [],
            }
          : item
      ) });
    } catch (error) {
      console.error('Error updating recurring expense:', error);
      console.error('Error details:', error);
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
      console.log('Updating transaction:', { id: transaction.id, updateData: transaction });
      console.log('Transaction type:', transaction.type);
      console.log('Transaction category:', transaction.category);
      // 更新可能なフィールドのみを抽出
      const updateData = {
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
        memo: transaction.memo,
        card_used_date: transaction.card_used_date || null,
        isMock: transaction.isMock ?? false,
      };
      console.log('Extracted update data:', updateData);
      console.log('Update data type:', typeof updateData.type);
      console.log('Update data category:', typeof updateData.category);

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transaction.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw error;
      }

      console.log('Update successful:', data);

      const currentTransactions = get().transactions;
      const updatedTransactions = currentTransactions.map(t => 
        t.id === transaction.id ? data : t
      );
      set({ transactions: updatedTransactions });
    } catch (error) {
      console.error('Error updating transaction:', error);
      console.error('Error details:', error);
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

  reflectRecurringExpensesForPeriod: async (startDate: string, endDate: string, isMock?: boolean) => {
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
            // タイムゾーン問題を修正: ローカル日付として正しく処理
            const paymentDateStr = paymentDate.getFullYear() + '-' + 
              String(paymentDate.getMonth() + 1).padStart(2, '0') + '-' + 
              String(paymentDate.getDate()).padStart(2, '0');
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
                isMock: !!isMock,
              });
            }
          }
        }
        d.setMonth(d.getMonth() + 1);
        d.setDate(1); // 月初に調整
      }
    }
  },

  reflectRecurringIncomesForPeriod: async (startDate: string, endDate: string, isMock?: boolean) => {
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
        let paymentDay: number | undefined = undefined;
        if (inc.payment_schedule) {
          const schedule = inc.payment_schedule.find(s => s.month === month);
          if (schedule) paymentDay = schedule.day;
        }
        if (paymentDay !== undefined) {
          const paymentDate = new Date(year, month - 1, paymentDay);
          if (paymentDate >= start && paymentDate <= end) {
            // タイムゾーン問題を修正: ローカル日付として正しく処理
            const paymentDateStr = paymentDate.getFullYear() + '-' + 
              String(paymentDate.getMonth() + 1).padStart(2, '0') + '-' + 
              String(paymentDate.getDate()).padStart(2, '0');
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
                isMock: !!isMock,
              });
            }
          }
        }
        d.setMonth(d.getMonth() + 1);
        d.setDate(1);
      }
    }
  },

  deleteTransactions: async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids);

      if (error) throw error;

      const currentTransactions = get().transactions;
      set({
        transactions: currentTransactions.filter(t => !ids.includes(t.id)),
      });
    } catch (error) {
      console.error('Error deleting transactions:', error);
      throw error;
    }
  },

  reflectSingleRecurringIncomeForPeriod: async (incomeId: string, startDate: string, endDate: string, isMock?: boolean) => {
    const { addTransaction, fetchRecurringIncomes, fetchTransactions } = get();
    await fetchRecurringIncomes();
    await fetchTransactions();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const inc = (get().recurringIncomes || []).find(i => i.id === incomeId);
    if (!inc || !inc.is_active) return;
    const d = new Date(start);
    while (d <= end) {
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      let paymentDay: number | undefined = undefined;
      if (inc.payment_schedule) {
        const schedule = inc.payment_schedule.find(s => s.month === month);
        if (schedule) paymentDay = schedule.day;
      }
      if (paymentDay !== undefined) {
        const paymentDate = new Date(year, month - 1, paymentDay);
        if (paymentDate >= start && paymentDate <= end) {
          // タイムゾーン問題を修正: ローカル日付として正しく処理
          const paymentDateStr = paymentDate.getFullYear() + '-' + 
            String(paymentDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(paymentDate.getDate()).padStart(2, '0');
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
              isMock: !!isMock,
            });
          }
        }
      }
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
    }
  },

  reflectSingleRecurringExpenseForPeriod: async (expenseId: string, startDate: string, endDate: string, isMock?: boolean) => {
    console.log('=== reflectSingleRecurringExpenseForPeriod 開始 ===');
    console.log('引数:', { expenseId, startDate, endDate, isMock });
    
    const { addTransaction, fetchRecurringExpenses, fetchTransactions } = get();
    await fetchRecurringExpenses();
    await fetchTransactions();
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    console.log('期間:', { start: start.toISOString(), end: end.toISOString() });
    
    const exp = (get().recurringExpenses || []).find(e => e.id === expenseId);
    console.log('対象定期支出:', exp);
    
    if (!exp || !exp.is_active) {
      console.log('定期支出が見つからないまたは無効:', { found: !!exp, is_active: exp?.is_active });
      return;
    }
    
    const existingTransactions = get().transactions || [];
    console.log('既存トランザクション数:', existingTransactions.length);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    const d = new Date(start);
    while (d <= end) {
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      console.log(`処理中の月: ${year}-${month}`);
      
      let paymentDay: number | undefined = undefined;
      if (exp.payment_schedule) {
        const schedule = exp.payment_schedule.find(s => s.month === month);
        if (schedule) paymentDay = schedule.day;
        console.log(`支払スケジュール: 月${month} 日${paymentDay}`);
      }
      
      if (paymentDay !== undefined) {
        const paymentDate = new Date(year, month - 1, paymentDay);
        console.log('支払日:', paymentDate.toISOString());
        
        if (paymentDate >= start && paymentDate <= end) {
          // タイムゾーン問題を修正: ローカル日付として正しく処理
          const paymentDateStr = paymentDate.getFullYear() + '-' + 
            String(paymentDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(paymentDate.getDate()).padStart(2, '0');
          console.log('支払日文字列:', paymentDateStr);
          
          const existingTransactions = (get().transactions || []);
          
          // デバッグ: 条件詳細
          const targetIsMock = !!isMock;
          console.log('既存チェック条件:', {
            paymentDateStr,
            targetAmount: exp.amount,
            targetCategory: exp.category,
            targetType: 'expense',
            targetMemo: exp.name,
            targetIsMock
          });
          
          const matchingTransactions = existingTransactions.filter(t => {
            const dateMatch = t.date === paymentDateStr;
            const amountMatch = t.amount === exp.amount;
            const categoryMatch = t.category === exp.category;
            const typeMatch = t.type === 'expense';
            const isMockMatch = (t.isMock ?? false) === targetIsMock;
            const memoMatch = t.memo === exp.name; // 定期支出名と一致するかチェック
            
            const allMatch = dateMatch && amountMatch && categoryMatch && typeMatch && isMockMatch && memoMatch;
            
            // デバッグ: 最初の数件について詳細ログ
            if (dateMatch && amountMatch && categoryMatch && typeMatch) {
              console.log('条件ほぼ一致するトランザクション:', {
                id: t.id,
                date: t.date,
                amount: t.amount,
                category: t.category,
                type: t.type,
                memo: t.memo,
                isMock: t.isMock,
                isMockNormalized: (t.isMock ?? false),
                定期支出名: exp.name,
                matches: { dateMatch, amountMatch, categoryMatch, typeMatch, isMockMatch, memoMatch, allMatch }
              });
            }
            
            return allMatch;
          });
          const exists = matchingTransactions.length > 0;
          
          console.log('既存チェック詳細:', {
            paymentDateStr,
            amount: exp.amount,
            category: exp.category,
            type: 'expense',
            isMock: !!isMock,
            matchingCount: matchingTransactions.length,
            exists
          });
          
          // matchingTransactionsを別途ログ出力
          if (matchingTransactions.length > 0) {
            console.log('=== 重複するトランザクションの詳細 ===');
            matchingTransactions.forEach((t, index) => {
              console.log(`重複 ${index + 1}:`, {
                id: t.id,
                date: t.date,
                amount: t.amount,
                category: t.category,
                type: t.type,
                memo: t.memo,
                isMock: t.isMock,
                isMockNormalized: (t.isMock ?? false)
              });
            });
          } else {
            console.log('重複するトランザクションなし - 新規作成予定');
          }
          
          if (!exists) {
            const newTransaction = {
              type: 'expense' as const,
              amount: exp.amount,
              category: exp.category,
              date: paymentDateStr,
              memo: exp.name,
              isMock: !!isMock,
            };
            console.log('作成予定トランザクション:', newTransaction);
            
            await addTransaction(newTransaction);
            createdCount++;
            console.log('トランザクション作成成功');
          } else {
            skippedCount++;
            console.log('既存のためスキップ');
          }
        } else {
          console.log('期間外のためスキップ:', { paymentDate: paymentDate.toISOString(), start: start.toISOString(), end: end.toISOString() });
        }
      } else {
        console.log(`月${month}の支払スケジュールなし`);
      }
      
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
    }
    
    console.log('=== reflectSingleRecurringExpenseForPeriod 完了 ===');
    console.log('結果:', { createdCount, skippedCount });
  },
}));