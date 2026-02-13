import { create } from 'zustand';
import { format } from 'date-fns';

// MainApp で管理するタブ（状態管理ベース）
type MainTab = 'home' | 'calendar' | 'add' | 'settings' | 'background' | 'savings' | 'budget' | 'graph';

// アプリ全体の画面状態
// 予算管理画面を追加
type AppScreen = 'main' | 'savings-management' | 'person-detail' | 'account-detail' | 'budget-management' | 'categories-management';

interface AppState {
  currentTab: MainTab;
  selectedMonth: string; // YYYY-MM format
  currentScreen: AppScreen;
  // 積み立て管理の詳細画面用の状態
  selectedPersonId: string | null;
  selectedAccountId: string | null;
  setCurrentTab: (tab: MainTab) => void;
  setSelectedMonth: (month: string) => void;
  setCurrentScreen: (screen: AppScreen) => void;
  setSelectedPersonId: (personId: string | null) => void;
  setSelectedAccountId: (accountId: string | null) => void;
  // 積み立て管理画面への遷移
  navigateToSavingsManagement: () => void;
  navigateToPersonDetail: (personId: string) => void;
  navigateToAccountDetail: (personId: string, accountId: string) => void;
  // 予算管理画面への遷移
  navigateToBudgetManagement: () => void;
  // カテゴリ管理画面への遷移
  navigateToCategoriesManagement: () => void;
  // メイン画面への戻り
  navigateToMain: (tab?: MainTab) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: 'calendar',
  selectedMonth: format(new Date(), 'yyyy-MM'),
  currentScreen: 'main',
  selectedPersonId: null,
  selectedAccountId: null,
  setCurrentTab: (tab) => set({ currentTab: tab }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  setSelectedPersonId: (personId) => set({ selectedPersonId: personId }),
  setSelectedAccountId: (accountId) => set({ selectedAccountId: accountId }),
  // 積み立て管理画面への遷移
  navigateToSavingsManagement: () => set({
    currentScreen: 'savings-management',
    selectedPersonId: null,
    selectedAccountId: null
  }),
  // 予算管理画面への遷移
  navigateToBudgetManagement: () => set({
    currentScreen: 'budget-management',
    selectedPersonId: null,
    selectedAccountId: null
  }),
  // カテゴリ管理画面への遷移
  navigateToCategoriesManagement: () => set({
    currentScreen: 'categories-management',
    selectedPersonId: null,
    selectedAccountId: null
  }),
  navigateToPersonDetail: (personId) => set({
    currentScreen: 'person-detail',
    selectedPersonId: personId,
    selectedAccountId: null
  }),
  navigateToAccountDetail: (personId, accountId) => set({
    currentScreen: 'account-detail',
    selectedPersonId: personId,
    selectedAccountId: accountId
  }),
  // メイン画面への戻り
  navigateToMain: (tab = 'calendar') => set({
    currentScreen: 'main',
    currentTab: tab,
    selectedPersonId: null,
    selectedAccountId: null
  }),
}));