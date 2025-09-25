import React, { useState, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, isSameDay, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { styled } from '@mui/material/styles';
import { PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { useSwipeable } from 'react-swipeable';
import { BearGuide } from './components/BearGuide';
import { CustomCalendarHeader } from './components/CustomCalendarHeader';
import { MonthlySummary } from './components/MonthlySummary';
import { MemoizedCustomDay } from './components/MemoizedCustomDay';
import { TransactionDialog } from './components/TransactionDialog';
import { BulkDeleteConfirmDialog } from './components/BulkDeleteConfirmDialog';
import { ImportResultToast } from './components/ImportResultToast';
import { CalendarProvider, useCalendarContext } from './context/CalendarContext';
import { DayTotal } from './types/calendar.types';
import { CALENDAR_CONFIG } from './config/calendarConfig';

// カスタムスタイルの定義
const StyledDateCalendar = styled(DateCalendar)(({ theme }) => ({
  width: '100%',
  minHeight: '500px',
  height: '500px',
  '& .MuiPickersCalendarHeader-root': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
  },
  '& .MuiPickersArrowSwitcher-root .MuiIconButton-root': {
    width: '48px',
    height: '48px',
    minWidth: '48px',
    minHeight: '48px',
    padding: '12px',
    fontSize: '2rem',
    '& svg': {
      fontSize: '2rem',
    },
  },
  '& .MuiPickersCalendarHeader-label': {
    fontSize: '1.1rem',
    fontWeight: 500,
  },
  '& .MuiDayCalendar-weekDayLabel': {
    width: '14.28%',
    textAlign: 'center',
    padding: '8px 0',
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
  '& .MuiPickersDay-root': {
    width: '14.28%',
    height: '4rem',
    margin: 0,
    padding: '4px',
    fontSize: '0.875rem',
    '&.Mui-selected': {
      backgroundColor: 'transparent',
      color: 'inherit',
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
      },
    },
    '&.MuiPickersDay-today': {
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
    },
  },
  '& .MuiPickersSlideTransition-root': {
    minHeight: '500px',
    height: '500px',
  },
}));

// PickersDayPropsからonAnimationStartを除外
type CustomDayProps = Omit<PickersDayProps, 'onAnimationStart'>;

// パフォーマンス最適化されたCustomDayコンポーネント
const OptimizedCustomDay = (props: CustomDayProps & { showMock?: boolean; dayTotalsMap?: Map<string, DayTotal> }) => {
  const { day, showMock, dayTotalsMap, ...other } = props;
  
  // パフォーマンス最適化：事前計算された値を使用
  const dateKey = format(day, 'yyyy-MM-dd');
  const dayTotal = dayTotalsMap?.get(dateKey) || { income: 0, expense: 0, net: 0 };

  return (
    <MemoizedCustomDay
      {...other}
      day={day}
      showMock={showMock}
      dayTotal={dayTotal}
    />
  );
};



// パフォーマンス最適化されたスワイプカレンダーコンポーネント
const OptimizedSwipeableCalendar = memo(({ 
  selectedDate, 
  onDateSelect, 
  onMonthChange, 
  currentMonth,
  showMock,
  dayTotalsMap
}: {
  selectedDate: Date;
  onDateSelect: (date: Date | null) => void;
  onMonthChange: (date: Date) => void;
  currentMonth: Date;
  showMock: boolean;
  dayTotalsMap: Map<string, DayTotal>;
}) => {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      onMonthChange(addMonths(currentMonth, 1));
    },
    onSwipedRight: () => {
      onMonthChange(subMonths(currentMonth, 1));
    },
    onTouchStartOrOnMouseDown: () => {
    },
    onTouchEndOrOnMouseUp: () => {
    },
    delta: CALENDAR_CONFIG.SWIPE_SENSITIVITY,
    swipeDuration: CALENDAR_CONFIG.ANIMATION_DURATION,
    preventScrollOnSwipe: true,
    trackMouse: true,
    trackTouch: true,
  });

  return (
    <div
      {...swipeHandlers}
      className="w-full h-full touch-pan-y"
      style={{ touchAction: 'pan-y' }}
    >
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
        <StyledDateCalendar
          value={selectedDate}
          onChange={onDateSelect}
          onMonthChange={onMonthChange}
          slots={{
            day: (props) => <OptimizedCustomDay {...props} showMock={showMock} dayTotalsMap={dayTotalsMap} />,
            calendarHeader: CustomCalendarHeader,
          }}
        />
      </LocalizationProvider>
    </div>
  );
}, (prevProps, nextProps) => {
  // メモ化最適化：必要な場合のみ再レンダリング
  return (
    isSameDay(prevProps.selectedDate, nextProps.selectedDate) &&
    isSameDay(prevProps.currentMonth, nextProps.currentMonth) &&
    prevProps.showMock === nextProps.showMock &&
    prevProps.dayTotalsMap === nextProps.dayTotalsMap
  );
});

// CalendarPageの内部実装コンポーネント
const CalendarPageImpl: React.FC = () => {
  // Contextから状態とアクションを取得
  const {
    calendarState,
    calendarActions,
    performance,
  } = useCalendarContext();

  // インポート結果用の状態
  const [importResult, setImportResult] = useState<null | { success: number; fail: number; paymentDate: string; type: 'success' | 'fail', failedRows?: (Record<string, string> & { reason: string })[] }>(null);

  // ハンドラー関数（Contextのアクションを使用）
  const handleDateSelect = calendarActions.handleDateSelect;
  const handleCloseGuide = calendarActions.handleCloseGuide;
  const handleMonthChange = calendarActions.handleMonthChange;

  return (
    <motion.div 
      className="pb-20 space-y-6"
      data-testid="calendar-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {calendarState.showGuide && (
        <div
          className="fixed inset-0 flex items-start justify-center z-[100] pointer-events-none"
          style={{ top: '60px' }}
        >
          <div className="pointer-events-auto" style={{ marginTop: '0.5rem' }}>
            <BearGuide
              onClose={handleCloseGuide}
              dontShowNext={calendarState.dontShowNext}
              setDontShowNext={calendarActions.setDontShowNext}
            />
          </div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-[100vw] flex justify-center"
      >
        <ImportResultToast 
          importResult={importResult} 
          onClose={() => setImportResult(null)} 
        />
        <Card className={`w-full max-w-4xl${calendarState.isSummaryFixed ? ' mb-60' : ''}`}>
          <CardContent className="p-2 sm:p-4 w-full min-h-[450px] relative" style={{ overflowY: 'hidden' }}>
            {/* カレンダー本体 */}
            <OptimizedSwipeableCalendar
              selectedDate={calendarState.selectedDate}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
              currentMonth={calendarState.currentMonth}
              showMock={calendarState.showMock}
              dayTotalsMap={performance.dayTotalsMap}
            />
            {/* 実際の収支・予定（シナリオ）ボタン群をインポートボタンの位置に移動 */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  type="button"
                  variant={!calendarState.showMock ? 'default' : 'outline'}
                  className={`font-bold ${!calendarState.showMock ? 'bg-blue-500 text-white' : ''}`}
                  onClick={() => {
                    calendarActions.setShowMock(false);
                  }}
                >
                  実際の収支
                </Button>
                <Button
                  type="button"
                  variant={calendarState.showMock ? 'default' : 'outline'}
                  className={`font-bold ${calendarState.showMock ? 'bg-orange-400 text-white' : ''}`}
                  onClick={() => {
                    calendarActions.setShowMock(true);
                  }}
                >
                  予定の収支
                </Button>
              </div>
            </div>
            {/* 楽天明細インポートボタンとダイアログを削除 */}
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Summary */}
      {!calendarState.isSummaryFixed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <MonthlySummary
            monthTransactions={performance.monthTransactions}
            currentMonth={calendarState.currentMonth}
            isSummaryFixed={calendarState.isSummaryFixed}
            onToggleFixed={calendarActions.setIsSummaryFixed}
          />
        </motion.div>
      )}
      {calendarState.isSummaryFixed && (
        <MonthlySummary
          monthTransactions={performance.monthTransactions}
          currentMonth={calendarState.currentMonth}
          isSummaryFixed={calendarState.isSummaryFixed}
          onToggleFixed={calendarActions.setIsSummaryFixed}
        />
      )}

      <TransactionDialog />
      <BulkDeleteConfirmDialog />
    </motion.div>
  );
}

// メインのCalendarPageコンポーネント（CalendarProviderでラップ）
export const CalendarPage: React.FC = () => {
  return (
    <CalendarProvider>
      <CalendarPageImpl />
    </CalendarProvider>
  );
};