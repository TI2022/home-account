import { create } from 'zustand';
import { format } from 'date-fns';

interface AppState {
  currentTab: 'home' | 'calendar' | 'add' | 'history' | 'settings' | 'scenarios' | 'background' | 'savings' | 'graph';
  selectedMonth: string; // YYYY-MM format
  setCurrentTab: (tab: 'home' | 'calendar' | 'add' | 'history' | 'settings' | 'scenarios' | 'background' | 'savings' | 'graph') => void;
  setSelectedMonth: (month: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: 'calendar',
  selectedMonth: format(new Date(), 'yyyy-MM'),
  setCurrentTab: (tab) => set({ currentTab: tab }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
}));