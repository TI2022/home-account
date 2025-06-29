import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTransactionStore } from '@/store/useTransactionStore';
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, Trash2, Wallet, Edit, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { QuickTransactionForm } from './QuickTransactionForm';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { styled } from '@mui/material/styles';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { useSwipeable } from 'react-swipeable';
import bearImg from '@/assets/bear-guide.png';
import { Transaction } from '@/types';
import { useSnackbar } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { EXPENSE_CATEGORIES } from '@/types';

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
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { showSnackbar } = useSnackbar();
  const [rakutenLoading, setRakutenLoading] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

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

  // 楽天明細インポート処理
  const handleRakutenCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRakutenLoading(true);
    showSnackbar('楽天明細のインポートを開始します');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<Record<string, string>>) => {
        const rows = results.data;
        let success = 0;
        let fail = 0;
        
        // CSV内の最新月を特定して、その翌月27日を全明細の引き落とし日とする
        let latestYear = 0;
        let latestMonth = 0;
        
        // まずCSV内の最新月を特定
        for (const row of rows) {
          const dateStr = row['利用日']?.trim();
          if (!dateStr) continue;
          try {
            const [y, m] = dateStr.replace(/\//g, '-').split('-');
            const year = parseInt(y);
            const month = parseInt(m);
            if (year > latestYear || (year === latestYear && month > latestMonth)) {
              latestYear = year;
              latestMonth = month;
            }
          } catch { continue; }
        }
        
        // 最新月の翌月27日を計算
        let paymentYear = latestYear;
        let paymentMonth = latestMonth + 1;
        if (paymentMonth > 12) {
          paymentMonth = 1;
          paymentYear += 1;
        }
        const paymentDate = `${paymentYear}-${paymentMonth.toString().padStart(2, '0')}-27`;
        
        console.log(`[楽天明細インポート] CSV最新月: ${latestYear}/${latestMonth}, 引き落とし日: ${paymentDate}`);
        
        for (const row of rows) {
          const name = row['利用店名・商品名']?.trim() || '';
          const amountKey = Object.keys(row).find(k => k.includes('支払金額'));
          const amountStr = amountKey ? row[amountKey]?.replace(/,/g, '').trim() : '';
          const dateStr = row['利用日']?.trim();
          if (!name || !amountStr || !dateStr) { fail++; continue; }
          const amount = Number(amountStr);
          if (isNaN(amount)) { fail++; continue; }
          
          // 全明細で統一された引き落とし日を使用
          const date = paymentDate;
          const cardUsedDate = paymentDate;
          
          let category = 'その他';
          for (const cat of EXPENSE_CATEGORIES) {
            if (name.includes(cat)) { category = cat; break; }
          }
          try {
            await useTransactionStore.getState().addTransaction({
              type: 'expense',
              amount,
              category,
              date,
              memo: `${name}（利用日: ${dateStr}）`,
              card_used_date: cardUsedDate,
            });
            success++;
          } catch {
            fail++;
          }
        }
        useTransactionStore.getState().fetchTransactions();
        setRakutenLoading(false);
        if (success > 0) {
          console.log('[楽天明細インポート] toast呼び出し: 登録件数:', success, '失敗:', fail);
          showSnackbar(`楽天明細インポート完了: 登録件数: ${success}件、失敗: ${fail}件、引き落とし日: ${paymentDate}`, fail === 0 ? 'default' : 'destructive');
        } else {
          console.log('[楽天明細インポート] toast呼び出し: インポート失敗');
          showSnackbar('インポート失敗: 明細の取り込みに失敗しました', 'destructive');
        }
      },
      error: () => {
        setRakutenLoading(false);
        showSnackbar('CSV読み込みエラー: ファイルの解析に失敗しました', 'destructive');
      },
    });
    e.target.value = '';
  };

  // モーダルが開いた時はトランザクション一覧を展開状態にする
  useEffect(() => {
    if (isDialogOpen) {
      setShowAllTransactions(true);
    }
  }, [isDialogOpen]);

  // モーダルが閉じた時は編集モードを解除
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingTransaction(null);
    }
  }, [isDialogOpen]);

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
          <CardContent className="p-2 sm:p-4 w-full min-h-[450px] relative" style={{ overflowY: 'hidden' }}>
            {/* カレンダー本体 */}
            <SwipeableCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
              currentMonth={currentMonth}
            />
            {/* 楽天明細インポートボタン: 右下に絶対配置（白背景＋赤枠＋赤文字、元のデザイン） */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <Button
                  asChild
                  disabled={rakutenLoading}
                  className="bg-white border border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 font-semibold rounded-md px-4 py-2 shadow"
                >
                  <span className="flex items-center">
                    {rakutenLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        インポート中...
                      </>
                    ) : (
                      '楽天明細インポート'
                    )}
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleRakutenCsvImport}
                />
              </label>
            </div>
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
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto [&>button]:w-10 [&>button]:h-10 [&>button]:bg-white [&>button]:border [&>button]:border-gray-200 [&>button]:shadow-lg [&>button]:rounded-full [&>button]:hover:bg-gray-100 [&>button]:opacity-100 [&>button]:transition-colors [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button>svg]:w-5 [&>button>svg]:h-5">
          <DialogHeader>
            <DialogTitle>
              {format(selectedDate, 'M月d日(E)', { locale: ja })}の記録
            </DialogTitle>
          </DialogHeader>
          
          {/* Existing transactions for the day */}
          {selectedDateTransactions.length > 0 && (
            <div>
              <div className="flex items-center mb-2 justify-start">
                {selectedDateTransactions.length > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllTransactions(v => !v)}
                    className="px-2 py-1 ml-2"
                    aria-label={showAllTransactions ? '閉じる' : 'もっと見る'}
                    title={showAllTransactions ? '閉じる' : 'もっと見る'}
                  >
                    {showAllTransactions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </Button>
                )}
              </div>
              <div className={`space-y-2 overflow-auto transition-all duration-200 ${showAllTransactions ? 'max-h-[40vh] min-h-[4rem]' : 'max-h-[96px] min-h-[96px]'}`}>
                {selectedDateTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2 flex-1">
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
                        ¥{formatAmount(transaction.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          editingTransaction?.id === transaction.id
                            ? setEditingTransaction(null)
                            : setEditingTransaction(transaction)
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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
            editingTransaction={editingTransaction}
            onEditCancel={() => setEditingTransaction(null)}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};