import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTransactionStore } from '@/store/useTransactionStore';
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, Trash2, Wallet } from 'lucide-react';
import { QuickTransactionForm } from './QuickTransactionForm';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { styled } from '@mui/material/styles';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { useSwipeable } from 'react-swipeable';
import bearImg from '@/assets/bear-guide.png';

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

// カスタムの日付セルコンポーネント
const CustomDay = (props: CustomDayProps) => {
  const { day, ...other } = props;
  const { transactions } = useTransactionStore();
  const isToday = isSameDay(day, new Date());

  // Calculate daily totals for calendar display
  const getDayTotal = (date: Date) => {
    const dayTransactions = transactions.filter(t => 
      isSameDay(new Date(t.date), date)
    );
    
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense, net: income - expense };
  };

  const dayTotal = getDayTotal(day);

  return (
    <PickersDay
      {...other}
      day={day}
      sx={{
        width: '100%',
        height: '100%',
        margin: 0,
        padding: '4px',
        cursor: 'pointer',
        boxShadow: '0 1px 4px 0 #e0e7ef',
        borderRadius: '0.75rem',
        backgroundColor: '#fff',
        transition: 'box-shadow 0.2s, background 0.2s',
        '&:hover, &:focus': {
          backgroundColor: '#e0f2fe',
          boxShadow: '0 4px 12px 0 #bae6fd',
        },
      }}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-start p-1 min-h-[4rem]">
        <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
          {day.getDate()}
        </span>
        <div className="w-full mt-1 space-y-0.5 flex flex-col items-center min-h-[2rem]">
          {dayTotal.income > 0 && (
            <div className="text-xs text-green-600 font-medium leading-none">
              {dayTotal.income}
            </div>
          )}
          {dayTotal.expense > 0 && (
            <div className="text-xs text-red-600 font-medium leading-none">
              {dayTotal.expense}
            </div>
          )}
        </div>
      </div>
    </PickersDay>
  );
};

const BearGuide = ({
  onClose,
  dontShowNext,
  setDontShowNext,
}: {
  onClose: () => void;
  dontShowNext: boolean;
  setDontShowNext: (v: boolean) => void;
}) => (
  <div className="relative">
    <div
      className="rounded-xl shadow-lg px-4 py-2 text-base font-bold text-brown-700 border border-yellow-200 flex flex-col items-center gap-2 min-w-[260px]"
      style={{ background: 'rgba(255,255,255,0.9)' }}
    >
      <div className="flex items-center w-full justify-between">
        <div className="flex items-center">
          <input
            id="dontShowNext"
            type="checkbox"
            checked={dontShowNext}
            onChange={e => setDontShowNext(e.target.checked)}
            className="mr-1 accent-yellow-400"
          />
          <label htmlFor="dontShowNext" className="text-xs text-gray-600 select-none">
            次回から表示しない
          </label>
        </div>
        <button
          onClick={onClose}
          className="ml-2 bg-white rounded-full border border-gray-300 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 shadow"
          aria-label="ガイドを閉じる"
          tabIndex={0}
        >
          ×
        </button>
      </div>
      <img
        src={bearImg}
        alt="くま"
        className="w-16 h-16 drop-shadow-lg my-1"
        style={{ filter: 'drop-shadow(0 2px 8px #fbbf24)' }}
      />
      <div>日付をタップして記録できます！</div>
    </div>
    <div className="flex justify-center mt-1 animate-bounce">
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path d="M12 4v14m0 0l-6-6m6 6l6-6" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  </div>
);

// スワイプ機能付きカレンダーコンポーネント
const SwipeableCalendar = ({ 
  selectedDate, 
  onDateSelect, 
  onMonthChange, 
  currentMonth 
}: {
  selectedDate: Date;
  onDateSelect: (date: Date | null) => void;
  onMonthChange: (date: Date) => void;
  currentMonth: Date;
}) => {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      console.log('Swiped left - next month');
      onMonthChange(addMonths(currentMonth, 1));
    },
    onSwipedRight: () => {
      console.log('Swiped right - prev month');
      onMonthChange(subMonths(currentMonth, 1));
    },
    onTouchStartOrOnMouseDown: () => {
      console.log('Touch or Mouse Down');
    },
    onTouchEndOrOnMouseUp: () => {
      console.log('Touch or Mouse Up');
    },
    delta: 30,
    swipeDuration: 1000,
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
            day: CustomDay
          }}
        />
      </LocalizationProvider>
    </div>
  );
};

export const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const { transactions, fetchTransactions, deleteTransaction } = useTransactionStore();
  const [showGuide, setShowGuide] = useState(false);
  const [dontShowNext, setDontShowNext] = useState(false);

  useEffect(() => {
    fetchTransactions();
    if (localStorage.getItem('calendarGuideShown') !== '1') {
      setShowGuide(true);
    }
  }, [fetchTransactions]);

  // Get transactions for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= monthStart && transactionDate <= monthEnd;
  });

  // Get transactions for selected date
  const selectedDateTransactions = transactions.filter(t => 
    isSameDay(new Date(t.date), selectedDate)
  );

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP');
  };

  const handleDateSelect = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setIsDialogOpen(true);
    }
  };

  const handleTransactionAdded = () => {
    setIsDialogOpen(false);
    fetchTransactions();
  };

  const handleDelete = async (transactionId: string) => {
    if (window.confirm('この収支を削除してもよろしいですか？')) {
      try {
        await deleteTransaction(transactionId);
        fetchTransactions();
      } catch {
        alert('削除に失敗しました');
      }
    }
  };

  const handleCloseGuide = () => {
    setShowGuide(false);
    if (dontShowNext) {
      localStorage.setItem('calendarGuideShown', '1');
    } else {
      localStorage.removeItem('calendarGuideShown');
    }
  };

  // スワイプで月を切り替えたときにカレンダーもその月を表示するようにする
  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
    setSelectedDate(date); // カレンダーの表示月も切り替える
  };

  return (
    <motion.div 
      className="pb-20 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {showGuide && (
        <div
          className="fixed inset-0 flex items-start justify-center z-[100] pointer-events-none"
          style={{ top: '60px' }}
        >
          <div className="pointer-events-auto" style={{ marginTop: '0.5rem' }}>
            <BearGuide
              onClose={handleCloseGuide}
              dontShowNext={dontShowNext}
              setDontShowNext={setDontShowNext}
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
        <Card className="w-full max-w-4xl">
          <CardContent className="p-2 sm:p-4 w-full min-h-[450px]" style={{ overflowY: 'hidden' }}>
            <SwipeableCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
              currentMonth={currentMonth}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="flex flex-col gap-1 w-full">
              <div className="text-center py-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-center gap-1 text-base sm:text-xl font-bold text-green-600 truncate">
                  <ArrowUpCircle className="inline-block w-5 h-5 text-green-500 mr-1" />
                  <span>¥{formatAmount(monthTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0)
                  )}</span>
                </div>
                <div className="text-xs sm:text-sm text-green-700 font-medium">収入</div>
              </div>
              <div className="text-center py-2 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-center gap-1 text-base sm:text-xl font-bold text-red-600 truncate">
                  <ArrowDownCircle className="inline-block w-5 h-5 text-red-500 mr-1" />
                  <span>¥{formatAmount(monthTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0)
                  )}</span>
                </div>
                <div className="text-xs sm:text-sm text-red-700 font-medium">支出</div>
              </div>
              <div className={`text-center py-2 rounded-lg border ${
                monthTransactions.reduce((sum, t) => 
                  sum + (t.type === 'income' ? t.amount : -t.amount), 0
                ) >= 0 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className={`flex items-center justify-center gap-1 text-base sm:text-xl font-bold truncate ${
                  monthTransactions.reduce((sum, t) => 
                    sum + (t.type === 'income' ? t.amount : -t.amount), 0
                  ) >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  <Wallet className={`inline-block w-5 h-5 mr-1 ${
                    monthTransactions.reduce((sum, t) => 
                      sum + (t.type === 'income' ? t.amount : -t.amount), 0
                    ) >= 0 ? 'text-blue-500' : 'text-orange-500'
                  }`} />
                  <span>¥{formatAmount(monthTransactions.reduce((sum, t) => 
                    sum + (t.type === 'income' ? t.amount : -t.amount), 0
                  ))}</span>
                </div>
                <div className={`text-xs sm:text-sm font-medium ${
                  monthTransactions.reduce((sum, t) => 
                    sum + (t.type === 'income' ? t.amount : -t.amount), 0
                  ) >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}>
                  残高
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center mt-2">
              {format(currentMonth, 'yyyy年M月', { locale: ja })}の概要
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {format(selectedDate, 'M月d日(E)', { locale: ja })}の記録
            </DialogTitle>
          </DialogHeader>
          
          {/* Existing transactions for the day */}
          {selectedDateTransactions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">この日の記録</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedDateTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {transaction.type === 'income' ? (
                        <ArrowUpCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">{transaction.memo || transaction.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}¥{formatAmount(transaction.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick transaction form */}
          <QuickTransactionForm
            selectedDate={selectedDate}
            onTransactionAdded={handleTransactionAdded}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};