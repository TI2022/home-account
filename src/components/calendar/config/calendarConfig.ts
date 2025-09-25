import { CalendarConfig } from '../types/calendar.types';

export const CALENDAR_CONFIG: CalendarConfig = {
  DEFAULT_VIEW_MODE: 'month',
  SWIPE_SENSITIVITY: 30,
  ANIMATION_DURATION: 1000,
  MAX_TRANSACTIONS_PER_DAY: 50,
  CACHE_DURATION: 5 * 60 * 1000, // 5分
} as const;

// パフォーマンス関連の設定
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300,
  VIRTUAL_SCROLL_THRESHOLD: 100,
  MEMOIZATION_CACHE_SIZE: 1000,
  BATCH_SIZE: 10,
} as const;

// UI関連の設定
export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  LOADING_DELAY: 500,
  ANIMATION_TIMING: 'ease-in-out',
  BREAKPOINTS: {
    mobile: 768,
    tablet: 1024,
    desktop: 1440,
  },
} as const;

// エラーハンドリング設定
export const ERROR_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  ERROR_DISPLAY_DURATION: 5000,
  NETWORK_TIMEOUT: 10000,
} as const;

// 開発環境用の設定
export const DEBUG_CONFIG = {
  ENABLE_PERFORMANCE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_STATE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_ERROR_BOUNDARY: true,
  MOCK_API_DELAY: 0,
} as const;