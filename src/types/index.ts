export interface Transaction {
  id: string;
  user_id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  date: string;
  memo?: string;
  card_used_date?: string;
  scenario_id?: string; // シナリオID（予定収支の場合）
  created_at: string;
  updated_at: string;
  isMock?: boolean;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: string; // YYYY-MM format
  created_at: string;
  updated_at: string;
}

export interface RecurringIncome {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  payment_frequency: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  payment_schedule: { month: number; day: number }[];
  next_payment_date?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  payment_frequency: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  payment_schedule: { month: number; day: number }[];
  next_payment_date?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface CategorySummary {
  category: string;
  amount: number;
  color: string;
  budget?: number;
}

export interface Scenario {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_CATEGORIES = [
  '食費',
  '外食費', // 追加
  '交通費',
  '家賃',
  '水道光熱費', // ←統合
  '通信費',
  '娯楽',
  '医療費',
  '衣類',
  '日用品',
  // 税金関連
  '住民税',
  '所得税',
  '予定納税',
  '固定資産税',
  '自動車税',
  '事業税',
  // 社会保険関連
  '健康保険',
  '国民年金',
  '厚生年金',
  '雇用保険',
  '労災保険',
  // 事業関連
  '事務所家賃',
  '通信費（事業）',
  '保険料（事業）',
  'リース料',
  'サブスクリプション',
  // 教育・学習関連
  '新聞図書費',
  '研修費',
  'その他'
] as const;

export const INCOME_CATEGORIES = [
  '給与',
  'ボーナス',
  '副業',
  '給付金', // 追加
  'その他'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];