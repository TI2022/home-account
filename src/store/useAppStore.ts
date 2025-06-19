import { create } from 'zustand';

interface AppState {
  currentTab: 'home' | 'calendar' | 'add' | 'history' | 'settings' | 'background' | 'savings';
  selectedMonth: string; // YYYY-MM format
  setCurrentTab: (tab: 'home' | 'calendar' | 'add' | 'history' | 'settings' | 'background' | 'savings') => void;
  setSelectedMonth: (month: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: 'calendar',
  selectedMonth: new Date().toISOString().slice(0, 7),
  setCurrentTab: (tab) => set({ currentTab: tab }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
}));