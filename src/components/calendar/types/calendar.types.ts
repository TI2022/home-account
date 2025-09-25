import { Transaction } from '@/types';

// カレンダー関連の基本型定義
export interface CalendarState {
  selectedDate: Date;
  currentMonth: Date;
  isDialogOpen: boolean;
  showMock: boolean;
  showGuide: boolean;
  dontShowNext: boolean;
  isSummaryFixed: boolean;
}

export interface TransactionDialogState {
  editingTransaction: Transaction | null;
  copyingTransaction: Transaction | null;
  dialogMode: DialogMode;
  showAllTransactions: boolean;
}

export interface BulkSelectionState {
  isBulkSelectMode: boolean;
  selectedIds: string[];
  isConfirmDialogOpen: boolean;
}

// アクション型定義
export interface CalendarActions {
  setSelectedDate: (date: Date) => void;
  setCurrentMonth: (date: Date) => void;
  setIsDialogOpen: (open: boolean) => void;
  setShowMock: (show: boolean) => void;
  setShowGuide: (show: boolean) => void;
  setDontShowNext: (dontShow: boolean) => void;
  setIsSummaryFixed: (fixed: boolean) => void;
  handleDateSelect: (date: Date | null) => void;
  handleMonthChange: (date: Date) => void;
  handleCloseGuide: () => void;
}

export interface TransactionDialogActions {
  setEditingTransaction: (transaction: Transaction | null) => void;
  setCopyingTransaction: (transaction: Transaction | null) => void;
  setDialogMode: (mode: DialogMode) => void;
  setShowAllTransactions: (show: boolean) => void;
  startEdit: (transaction: Transaction) => void;
  startCopy: (transaction: Transaction) => void;
  resetDialog: () => void;
}

export interface BulkSelectionActions {
  setIsBulkSelectMode: (mode: boolean) => void;
  setSelectedIds: (ids: string[]) => void;
  setIsConfirmDialogOpen: (open: boolean) => void;
  toggleSelection: (id: string) => void;
  selectAll: (transactions: Transaction[]) => void;
  clearSelection: () => void;
  toggleBulkMode: () => void;
}

// ユーティリティ型
export type DialogMode = 'add' | 'edit' | 'copy';

export interface DayTotal {
  income: number;
  expense: number;
  net: number;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

// エラー関連型
export interface CalendarError {
  message: string;
  context: string;
  timestamp: Date;
  type: CalendarErrorType;
}

export type CalendarErrorType = 
  | 'TRANSACTION_LOAD_ERROR'
  | 'TRANSACTION_SAVE_ERROR'
  | 'TRANSACTION_DELETE_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// Redux-like アクション型（将来の拡張用）
export type CalendarActionType =
  | { type: 'SET_SELECTED_DATE'; payload: Date }
  | { type: 'SET_CURRENT_MONTH'; payload: Date }
  | { type: 'TOGGLE_DIALOG'; payload?: boolean }
  | { type: 'TOGGLE_MOCK_MODE' }
  | { type: 'START_EDIT'; payload: Transaction }
  | { type: 'START_COPY'; payload: Transaction }
  | { type: 'RESET_DIALOG' }
  | { type: 'TOGGLE_BULK_MODE' }
  | { type: 'SELECT_TRANSACTION'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_ERROR'; payload: CalendarError }
  | { type: 'CLEAR_ERROR' };

// パフォーマンス関連型
export interface CalendarPerformanceMetrics {
  monthTransactions: Transaction[];
  dayTotalsMap: Map<string, DayTotal>;
  monthlySummary: MonthlySummary;
  isLoading: boolean;
}

// コンテキスト型
export interface CalendarContextValue {
  // 状態
  calendarState: CalendarState;
  dialogState: TransactionDialogState;
  bulkState: BulkSelectionState;
  
  // アクション
  calendarActions: CalendarActions;
  dialogActions: TransactionDialogActions;
  bulkActions: BulkSelectionActions;
  
  // 計算値
  performance: CalendarPerformanceMetrics;
  
  // エラーハンドリング
  error: CalendarError | null;
  clearError: () => void;
}

// コンポーネントプロパティ型
export interface BearGuideProps {
  onClose: () => void;
  dontShowNext: boolean;
  setDontShowNext: (value: boolean) => void;
}

export interface CustomCalendarHeaderProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export interface MonthlySummaryProps {
  monthTransactions: Transaction[];
  currentMonth: Date;
  isSummaryFixed: boolean;
  onToggleFixed: (fixed: boolean) => void;
}

export interface SwipeableCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date | null) => void;
  onMonthChange: (date: Date) => void;
  currentMonth: Date;
  showMock: boolean;
}

export interface CustomDayProps {
  day: Date;
  showMock?: boolean;
  dayTotal?: DayTotal;
}

// 設定関連型
export interface CalendarConfig {
  DEFAULT_VIEW_MODE: 'month' | 'week' | 'day';
  SWIPE_SENSITIVITY: number;
  ANIMATION_DURATION: number;
  MAX_TRANSACTIONS_PER_DAY: number;
  CACHE_DURATION: number;
}

// Hook戻り値型
export interface UseCalendarStateReturn {
  state: CalendarState;
  actions: CalendarActions;
}

export interface UseTransactionDialogReturn {
  state: TransactionDialogState;
  actions: TransactionDialogActions;
}

export interface UseBulkSelectionReturn {
  state: BulkSelectionState;
  actions: BulkSelectionActions;
}

export interface UseCalendarPerformanceReturn {
  monthTransactions: Transaction[];
  dayTotalsMap: Map<string, DayTotal>;
  monthlySummary: MonthlySummary;
  isLoading: boolean;
}

export interface UseCalendarErrorReturn {
  error: CalendarError | null;
  handleError: (error: unknown, context: string, type?: CalendarErrorType) => void;
  clearError: () => void;
}

// Utility Types
export type RequiredCalendarState = Required<CalendarState>;
export type PartialCalendarActions = Partial<CalendarActions>;
export type TransactionWithDayTotal = Transaction & { dayTotal?: DayTotal };