import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface Achievement {
  id: string;
  type: 'streak' | 'budget' | 'savings' | 'milestone';
  title: string;
  description: string;
  reward: string;
  completed: boolean;
  completedAt?: string;
}

export interface PlantGrowth {
  level: number;
  experience: number;
  maxExperience: number;
  stage: 'seed' | 'sprout' | 'sapling' | 'tree' | 'blooming';
  lastWatered: string;
}

interface GameState {
  // User stats
  level: number;
  experience: number;
  maxExperience: number;
  totalTransactions: number;
  consecutiveDays: number;
  lastRecordDate: string;
  
  // Badges and achievements
  badges: Badge[];
  achievements: Achievement[];
  unlockedBadges: string[];
  
  // Plant growth
  plant: PlantGrowth;
  
  // Actions
  addExperience: (amount: number) => void;
  recordTransaction: () => void;
  checkAchievements: (transactions: any[], budgets: any[]) => void;
  waterPlant: () => void;
  unlockBadge: (badgeId: string) => void;
  levelUp: () => void;
}

const BADGES: Badge[] = [
  {
    id: 'first-record',
    name: '初回記録',
    description: '初めての収支記録',
    icon: '🌟',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    id: 'streak-3',
    name: '3日連続',
    description: '3日連続で記録',
    icon: '🔥',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    id: 'streak-7',
    name: '1週間継続',
    description: '7日連続で記録',
    icon: '⭐',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'streak-30',
    name: '1ヶ月継続',
    description: '30日連続で記録',
    icon: '👑',
    color: 'bg-purple-100 text-purple-800',
  },
  {
    id: 'budget-keeper',
    name: '予算守り',
    description: '月の予算を守った',
    icon: '🛡️',
    color: 'bg-green-100 text-green-800',
  },
  {
    id: 'saver',
    name: '貯金上手',
    description: '月末に黒字達成',
    icon: '💰',
    color: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'milestone-100',
    name: '記録マスター',
    description: '100回記録達成',
    icon: '🏆',
    color: 'bg-gold-100 text-gold-800',
  },
];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      level: 1,
      experience: 0,
      maxExperience: 100,
      totalTransactions: 0,
      consecutiveDays: 0,
      lastRecordDate: '',
      
      badges: BADGES,
      achievements: [],
      unlockedBadges: [],
      
      plant: {
        level: 1,
        experience: 0,
        maxExperience: 50,
        stage: 'seed',
        lastWatered: '',
      },
      
      // Actions
      addExperience: (amount: number) => {
        const state = get();
        const newExp = state.experience + amount;
        const newLevel = Math.floor(newExp / state.maxExperience) + 1;
        
        set({
          experience: newExp % state.maxExperience,
          level: newLevel,
          maxExperience: newLevel * 100,
        });
        
        if (newLevel > state.level) {
          get().levelUp();
        }
      },
      
      recordTransaction: () => {
        const state = get();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        let newConsecutiveDays = 1;
        if (state.lastRecordDate === yesterday) {
          newConsecutiveDays = state.consecutiveDays + 1;
        }
        
        set({
          totalTransactions: state.totalTransactions + 1,
          consecutiveDays: newConsecutiveDays,
          lastRecordDate: today,
        });
        
        // Add experience
        get().addExperience(10);
        
        // Water plant
        get().waterPlant();
        
        // Check for badge unlocks
        if (state.totalTransactions === 0) {
          get().unlockBadge('first-record');
        }
        if (newConsecutiveDays === 3) {
          get().unlockBadge('streak-3');
        }
        if (newConsecutiveDays === 7) {
          get().unlockBadge('streak-7');
        }
        if (newConsecutiveDays === 30) {
          get().unlockBadge('streak-30');
        }
        if (state.totalTransactions + 1 === 100) {
          get().unlockBadge('milestone-100');
        }
      },
      
      checkAchievements: (transactions: any[], budgets: any[]) => {
        const state = get();
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        // Check budget achievement
        const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
        const monthBudgets = budgets.filter(b => b.month === currentMonth);
        
        if (monthBudgets.length > 0) {
          const totalBudget = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
          const totalExpense = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
          
          if (totalExpense <= totalBudget && !state.unlockedBadges.includes('budget-keeper')) {
            get().unlockBadge('budget-keeper');
          }
        }
        
        // Check savings achievement
        const totalIncome = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        if (totalIncome > totalExpense && !state.unlockedBadges.includes('saver')) {
          get().unlockBadge('saver');
        }
      },
      
      waterPlant: () => {
        const state = get();
        const today = new Date().toDateString();
        
        if (state.plant.lastWatered !== today) {
          const newExp = state.plant.experience + 10;
          let newLevel = state.plant.level;
          let newStage = state.plant.stage;
          let maxExp = state.plant.maxExperience;
          
          if (newExp >= maxExp) {
            newLevel++;
            maxExp = newLevel * 50;
            
            if (newLevel >= 2 && newLevel < 5) newStage = 'sprout';
            else if (newLevel >= 5 && newLevel < 10) newStage = 'sapling';
            else if (newLevel >= 10 && newLevel < 15) newStage = 'tree';
            else if (newLevel >= 15) newStage = 'blooming';
          }
          
          set({
            plant: {
              ...state.plant,
              experience: newExp % maxExp,
              level: newLevel,
              maxExperience: maxExp,
              stage: newStage,
              lastWatered: today,
            },
          });
        }
      },
      
      unlockBadge: (badgeId: string) => {
        const state = get();
        if (!state.unlockedBadges.includes(badgeId)) {
          set({
            unlockedBadges: [...state.unlockedBadges, badgeId],
          });
        }
      },
      
      levelUp: () => {
        // Level up celebration can be handled in UI
        get().addExperience(0); // Trigger any level up effects
      },
    }),
    {
      name: 'game-store',
    }
  )
);