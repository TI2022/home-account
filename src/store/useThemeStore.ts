import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BackgroundTheme {
  id: string;
  name: string;
  description: string;
  gradient: string;
  preview: string;
  mood: string;
  icon: string;
}

export interface CustomTheme {
  id: string;
  name: string;
  gradient: string;
  createdAt: string;
}

interface ThemeState {
  currentTheme: string;
  customThemes: CustomTheme[];
  setTheme: (themeId: string) => void;
  addCustomTheme: (theme: Omit<CustomTheme, 'id' | 'createdAt'>) => void;
  deleteCustomTheme: (themeId: string) => void;
  getThemeById: (themeId: string) => BackgroundTheme | CustomTheme | undefined;
}

export const PRESET_THEMES: BackgroundTheme[] = [
  {
    id: 'default',
    name: 'やわらかピンク',
    description: '優しく温かい気持ちに',
    gradient: 'linear-gradient(135deg, #fef7f0 0%, #fdf2f8 50%, #f0f9ff 100%)',
    preview: 'bg-gradient-to-r from-orange-50 via-pink-50 to-blue-50',
    mood: '穏やか',
    icon: '🌸'
  },
  {
    id: 'energetic',
    name: 'エネルギッシュ',
    description: 'やる気を高めたい時に',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fecaca 100%)',
    preview: 'bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100',
    mood: '元気',
    icon: '⚡'
  },
  {
    id: 'calm',
    name: 'リラックス',
    description: '心を落ち着けたい時に',
    gradient: 'linear-gradient(135deg, #ecfdf5 0%, #e0f2fe 50%, #f0f9ff 100%)',
    preview: 'bg-gradient-to-r from-green-50 via-cyan-50 to-blue-50',
    mood: '癒し',
    icon: '🍃'
  },
  {
    id: 'focus',
    name: '集中モード',
    description: '作業に集中したい時に',
    gradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
    preview: 'bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200',
    mood: '集中',
    icon: '🎯'
  },
  {
    id: 'creative',
    name: 'クリエイティブ',
    description: '創造性を刺激したい時に',
    gradient: 'linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 50%, #e0e7ff 100%)',
    preview: 'bg-gradient-to-r from-fuchsia-50 via-purple-50 to-indigo-50',
    mood: '創造的',
    icon: '🎨'
  },
  {
    id: 'sunset',
    name: 'サンセット',
    description: '夕日のような温かさ',
    gradient: 'linear-gradient(135deg, #fef7cd 0%, #fed7aa 50%, #fca5a5 100%)',
    preview: 'bg-gradient-to-r from-yellow-100 via-orange-200 to-red-200',
    mood: 'ロマンチック',
    icon: '🌅'
  },
  {
    id: 'ocean',
    name: 'オーシャン',
    description: '海のような爽やかさ',
    gradient: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #a7f3d0 100%)',
    preview: 'bg-gradient-to-r from-teal-50 via-emerald-100 to-green-200',
    mood: '爽やか',
    icon: '🌊'
  },
  {
    id: 'lavender',
    name: 'ラベンダー',
    description: '上品で落ち着いた雰囲気',
    gradient: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)',
    preview: 'bg-gradient-to-r from-purple-50 via-purple-100 to-purple-200',
    mood: '上品',
    icon: '💜'
  },
  {
    id: 'forest',
    name: 'フォレスト',
    description: '森林浴のような安らぎ',
    gradient: 'linear-gradient(135deg, #f7fee7 0%, #ecfccb 50%, #d9f99d 100%)',
    preview: 'bg-gradient-to-r from-lime-50 via-lime-100 to-lime-200',
    mood: '自然',
    icon: '🌲'
  },
  {
    id: 'cherry',
    name: 'チェリーブロッサム',
    description: '桜のような華やかさ',
    gradient: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
    preview: 'bg-gradient-to-r from-pink-50 via-pink-100 to-pink-200',
    mood: '華やか',
    icon: '🌺'
  }
];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'default',
      customThemes: [],
      
      setTheme: (themeId: string) => {
        set({ currentTheme: themeId });
        
        // Apply theme to body
        const theme = get().getThemeById(themeId);
        if (theme) {
          document.body.style.background = theme.gradient;
          document.body.style.backgroundAttachment = 'fixed';
        }
      },
      
      addCustomTheme: (theme) => {
        const newTheme: CustomTheme = {
          ...theme,
          id: `custom-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        
        set(state => ({
          customThemes: [...state.customThemes, newTheme]
        }));
      },
      
      deleteCustomTheme: (themeId: string) => {
        set(state => ({
          customThemes: state.customThemes.filter(theme => theme.id !== themeId)
        }));
      },
      
      getThemeById: (themeId: string) => {
        const presetTheme = PRESET_THEMES.find(theme => theme.id === themeId);
        if (presetTheme) return presetTheme;
        
        const customTheme = get().customThemes.find(theme => theme.id === themeId);
        return customTheme;
      },
    }),
    {
      name: 'theme-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply saved theme on app load
          const theme = state.getThemeById(state.currentTheme);
          if (theme) {
            document.body.style.background = theme.gradient;
            document.body.style.backgroundAttachment = 'fixed';
          }
        }
      },
    }
  )
);