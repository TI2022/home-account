import { create } from 'zustand';
import { format } from 'date-fns';

interface AppState {
  currentTab: 'home' | 'calendar' | 'add' | 'settings' | 'background' | 'savings' | 'graph' | 'savings-management';
  selectedMonth: string; // YYYY-MM format
  setCurrentTab: (tab: 'home' | 'calendar' | 'add' | 'settings' | 'background' | 'savings' | 'graph' | 'savings-management') => void;
  setSelectedMonth: (month: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: 'calendar',
  selectedMonth: format(new Date(), 'yyyy-MM'),
  setCurrentTab: (tab) => set({ currentTab: tab }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
}));