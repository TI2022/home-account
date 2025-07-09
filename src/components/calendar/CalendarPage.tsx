import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useScenarioStore } from '@/store/useScenarioStore';
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, Trash2, Wallet, Edit, Loader2, ChevronDown, ChevronUp, X, Pin } from 'lucide-react';
import { QuickTransactionForm } from './QuickTransactionForm';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { styled } from '@mui/material/styles';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { useSwipeable } from 'react-swipeable';
import bearImg from '@/assets/bear-guide.png';
import { Transaction } from '@/types';
import Papa from 'papaparse';
import { EXPENSE_CATEGORIES } from '@/types';
import { Input } from '@/components/ui/input';
import { useSnackbar } from '@/hooks/use-toast';

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

// カスタムの日付セルコンポーネント
const CustomDay = (props: CustomDayProps & { showMock?: boolean; selectedScenarioId?: string }) => {
  const { day, showMock, selectedScenarioId, ...other } = props;
  const { transactions } = useTransactionStore();
  const isToday = isSameDay(day, new Date());

  // Calculate daily totals for calendar display
  const getDayTotal = (date: Date) => {
    const dayTransactions = transactions.filter(t => {
      if (showMock) {
        if (!t.isMock) return false;
        if (selectedScenarioId && t.scenario_id !== selectedScenarioId) return false;
      } else {
        if (t.isMock) return false;
      }
      return isSameDay(new Date(t.date), date);
    });
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

// 年→月の順で表示する完全自作カレンダーヘッダー
function CustomCalendarHeader(props: unknown) {
  const { currentMonth, onMonthChange, minDate, maxDate } = props as { currentMonth: Date; onMonthChange: (date: Date) => void; minDate?: Date; maxDate?: Date };
  const year = format(currentMonth, 'yyyy', { locale: ja });
  const month = format(currentMonth, 'M', { locale: ja });
  // 前月・次月の有効判定
  const prevMonth = addMonths(currentMonth, -1);
  const nextMonth = addMonths(currentMonth, 1);
  const canPrev = !minDate || prevMonth >= minDate;
  const canNext = !maxDate || nextMonth <= maxDate;
  return (
    <div className="flex items-center justify-center py-2 select-none">
      <button
        type="button"
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 border border-gray-200 mr-5"
        onClick={() => canPrev && onMonthChange(prevMonth)}
        disabled={!canPrev}
        aria-label="前の月"
      >
        <span style={{ fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>&lt;</span>
      </button>
      <span className="text-lg font-bold">
        <span style={{ marginRight: 8 }}>{year}年</span>
        <span>{month}月</span>
      </span>
      <button
        type="button"
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 border border-gray-200 ml-5"
        onClick={() => canNext && onMonthChange(nextMonth)}
        disabled={!canNext}
        aria-label="次の月"
      >
        <span style={{ fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>&gt;</span>
      </button>
    </div>
  );
}

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
  currentMonth,
  showMock,
  selectedScenarioId
}: {
  selectedDate: Date;
  onDateSelect: (date: Date | null) => void;
  onMonthChange: (date: Date) => void;
  currentMonth: Date;
  showMock: boolean;
  selectedScenarioId?: string;
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
            day: (props) => <CustomDay {...props} showMock={showMock} selectedScenarioId={selectedScenarioId} />, // ←修正
            calendarHeader: CustomCalendarHeader,
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
  const { transactions, fetchTransactions, deleteTransaction, deleteTransactions } = useTransactionStore();
  const { scenarios, fetchScenarios, getDefaultScenario } = useScenarioStore();
  const [showGuide, setShowGuide] = useState(false);
  const [dontShowNext, setDontShowNext] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [copyingTransaction, setCopyingTransaction] = useState<Transaction | null>(null);
  const [rakutenLoading, setRakutenLoading] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showMock, setShowMock] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [rakutenImportDialogOpen, setRakutenImportDialogOpen] = useState(false);
  const [rakutenImportFile, setRakutenImportFile] = useState<File | null>(null);
  const [rakutenImportMonth, setRakutenImportMonth] = useState(() => {
    const now = new Date();
    // デフォルトは翌月
    return now.toISOString().slice(0, 7);
  });
  const [importResult, setImportResult] = useState<null | { success: number; fail: number; paymentDate: string; type: 'success' | 'fail', failedRows?: (Record<string, string> & { reason: string })[] }>(null);
  const { showSnackbar } = useSnackbar();
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSummaryFixed, setIsSummaryFixed] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchScenarios();
    if (localStorage.getItem('calendarGuideShown') !== '1') {
      setShowGuide(true);
    }
  }, [fetchTransactions, fetchScenarios]);

  // デフォルトシナリオを自動選択
  useEffect(() => {
    if (showMock && scenarios.length > 0 && !selectedScenarioId) {
      const defaultScenario = getDefaultScenario();
      if (defaultScenario) {
        setSelectedScenarioId(defaultScenario.id);
      }
    }
  }, [showMock, scenarios, selectedScenarioId, getDefaultScenario]);

  // Get transactions for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    if (showMock) {
      // 予定タブ: isMock=true かつシナリオ一致のみ
      if (!t.isMock) return false;
      if (selectedScenarioId && t.scenario_id !== selectedScenarioId) return false;
    } else {
      // 実際タブ: isMock=falseのみ
      if (t.isMock) return false;
    }
    return transactionDate >= monthStart && transactionDate <= monthEnd;
  });

  // デバッグ用：カレンダー概要計算の確認
  if (showMock && selectedScenarioId) {
    console.log('=== カレンダー概要計算デバッグ ===');
    console.log('現在月:', format(currentMonth, 'yyyy-MM'));
    console.log('月開始日:', format(monthStart, 'yyyy-MM-dd'));
    console.log('月終了日:', format(monthEnd, 'yyyy-MM-dd'));
    console.log('選択されたシナリオID:', selectedScenarioId);
    console.log('月次取引数:', monthTransactions.length);
    
    // 月次取引の詳細を表示
    const monthlyIncome = monthTransactions.filter(t => t.type === 'income');
    const monthlyExpense = monthTransactions.filter(t => t.type === 'expense');
    
    console.log('月次収入取引数:', monthlyIncome.length);
    console.log('月次支出取引数:', monthlyExpense.length);
    
    const totalIncome = monthlyIncome.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = monthlyExpense.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    
    console.log('月次収入合計:', totalIncome.toLocaleString());
    console.log('月次支出合計:', totalExpense.toLocaleString());
    console.log('月次残高:', balance.toLocaleString());
    
    // 各取引の詳細を表示
    console.log('=== 月次取引詳細 ===');
    monthTransactions.forEach(t => {
      console.log(`${t.date}: ${t.type} ${t.amount.toLocaleString()}円 (${t.category}) - ${t.memo || 'メモなし'}`);
    });
  }

  // Get transactions for selected date
  const selectedDateTransactions = transactions.filter(t => {
    if (showMock) {
      if (!t.isMock) return false;
      if (selectedScenarioId && t.scenario_id !== selectedScenarioId) return false;
    } else {
      if (t.isMock) return false;
    }
    return isSameDay(new Date(t.date), selectedDate);
  });

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

  // インポートボタンでファイル選択→月選択ダイアログ
  const handleRakutenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRakutenImportFile(file);
    setRakutenImportDialogOpen(true);
    e.target.value = '';
  };

  // 月選択ダイアログでインポート実行
  const handleRakutenImport = () => {
    if (!rakutenImportFile) return;
    setRakutenLoading(true);
    setImportResult(null);
    Papa.parse(rakutenImportFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<Record<string, string>>) => {
        const rows = results.data;
        let success = 0;
        let fail = 0;
        const failedRows: (Record<string, string> & { reason: string })[] = [];
        const [paymentYear, paymentMonth] = rakutenImportMonth.split('-');
        const paymentDate = `${paymentYear}-${paymentMonth}-27`;
        for (const row of rows) {
          const name = row['利用店名・商品名']?.trim() || '';
          const amountKey = Object.keys(row).find(k => k.includes('支払金額'));
          const amountStr = amountKey ? row[amountKey]?.replace(/,/g, '').trim() : '';
          const dateStr = row['利用日']?.trim();
          if (!name || !amountStr || !dateStr) {
            fail++;
            failedRows.push({ ...row, reason: '必須項目が不足しています' });
            continue;
          }
          const amount = Number(amountStr);
          if (isNaN(amount)) {
            fail++;
            failedRows.push({ ...row, reason: '金額が不正です' });
            continue;
          }
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
            failedRows.push({ ...row, reason: 'DB登録に失敗しました' });
          }
        }
        useTransactionStore.getState().fetchTransactions();
        setRakutenLoading(false);
        setRakutenImportDialogOpen(false);
        setRakutenImportFile(null);
        setImportResult({ success, fail, paymentDate, type: success > 0 ? 'success' : 'fail', failedRows });
      },
      error: () => {
        setRakutenLoading(false);
        setRakutenImportDialogOpen(false);
        setRakutenImportFile(null);
        setImportResult({ success: 0, fail: 0, paymentDate: '', type: 'fail', failedRows: [] });
      },
    });
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
      setSelectedIds([]);
      setIsBulkSelectMode(false);
    }
  }, [isDialogOpen]);

  const handleBulkDelete = async () => {
    setIsConfirmDialogOpen(false);
    try {
      await deleteTransactions(selectedIds);
      setSelectedIds([]);
      setIsBulkSelectMode(false);
      showSnackbar('選択した収支を削除しました', 'default');
      fetchTransactions();
    } catch {
      showSnackbar('一括削除に失敗しました', 'destructive');
    }
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
        {/* インポート結果トースト */}
        {importResult && (
          <div
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-lg shadow-lg border-2 flex flex-col items-start min-w-[260px] animate-fade-in-out
              ${importResult.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}
          >
            <div className="font-bold text-base mb-1">
              楽天明細インポート{importResult.type === 'success' ? '完了' : '失敗'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-green-600">成功: {importResult.success}件</span>
              <span className="font-bold text-red-600">失敗: {importResult.fail}件</span>
            </div>
            {importResult.paymentDate && (
              <div className="text-xs text-gray-500 mt-1">引き落とし日: {importResult.paymentDate}</div>
            )}
            {importResult.failedRows && importResult.failedRows.length > 0 && (
              <details className="mt-2 w-full">
                <summary className="cursor-pointer text-xs text-red-600 underline">失敗データの詳細を表示</summary>
                <div className="max-h-[70vh] overflow-y-auto mt-1 text-[10px] w-[80vw]">
                  <table className="w-full border text-[10px] table-fixed">
                    <thead>
                      <tr>
                        {Object.keys(importResult.failedRows[0]).filter(key => key !== 'reason').map((key) => (
                          <th key={key} className="border px-1 py-0.5 bg-gray-100 break-words max-w-[5.5em] whitespace-pre-line text-[10px]">{key.replace('利用店名・商品名','店名').replace('支払金額','金額').replace('利用日','日付')}</th>
                        ))}
                        <th className="border px-1 py-0.5 bg-gray-100 break-words max-w-[5.5em] whitespace-pre-line text-[10px]">失敗理由</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.failedRows.map((row, i) => (
                        <tr key={i} className="odd:bg-red-50 even:bg-white">
                          {(() => {
                            const cells = [];
                            for (const [key, val] of Object.entries(row) as [string, string][]) {
                              if (key === 'reason') continue;
                              cells.push(
                                <td key={key} className="border px-1 py-0.5 break-words max-w-[5.5em] whitespace-pre-line text-[10px]">{val}</td>
                              );
                            }
                            return cells;
                          })()}
                          <td className="border px-1 py-0.5 break-words max-w-[5.5em] whitespace-pre-line text-[10px]">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
            <button
              className="absolute top-1 right-2 text-gray-400 hover:text-gray-700 text-lg"
              onClick={() => setImportResult(null)}
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        )}
        <Card className="w-full max-w-4xl">
          <CardContent className="p-2 sm:p-4 w-full min-h-[450px] relative" style={{ overflowY: 'hidden' }}>
            {/* 直感的なトグルデザインを廃止し、ボタン群に置換 */}
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              <Button
                type="button"
                variant={!showMock ? 'default' : 'outline'}
                className={`font-bold ${!showMock ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => {
                  setShowMock(false);
                  setSelectedScenarioId('');
                }}
              >
                実際の収支
              </Button>
              {scenarios.map(scenario => (
                <Button
                  key={scenario.id}
                  type="button"
                  variant={showMock && selectedScenarioId === scenario.id ? 'default' : 'outline'}
                  className={`font-bold ${showMock && selectedScenarioId === scenario.id ? 'bg-orange-400 text-white' : ''}`}
                  onClick={() => {
                    setShowMock(true);
                    setSelectedScenarioId(scenario.id);
                  }}
                >
                  {scenario.name}
                </Button>
              ))}
            </div>
            {/* シナリオセレクターは不要なので削除 */}
            {/* カレンダー本体 */}
            <SwipeableCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
              currentMonth={currentMonth}
              showMock={showMock}
              selectedScenarioId={selectedScenarioId}
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
                  onChange={handleRakutenFileChange}
                />
              </label>
            </div>
            {/* 楽天明細インポート用の反映月選択ダイアログ */}
            <Dialog open={rakutenImportDialogOpen} onOpenChange={setRakutenImportDialogOpen}>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle>反映月を選択</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <Input
                    type="month"
                    value={rakutenImportMonth}
                    onChange={e => setRakutenImportMonth(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                    min={(() => {
                      const d = new Date();
                      return d.toISOString().slice(0, 7);
                    })()}
                    max={(() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + 11);
                      return d.toISOString().slice(0, 7);
                    })()}
                  />
                  <Button onClick={handleRakutenImport} disabled={rakutenLoading}>
                    この月でインポート
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Summary */}
      {!isSummaryFixed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-2 sm:p-4 relative">
              {/* 固定表示ボタン: 概要の中、右上に絶対配置・ピンアイコンのみ */}
              <button
                className="absolute top-2 right-2 bg-white/80 text-blue-600 hover:bg-blue-100 hover:text-blue-800 border border-blue-300 rounded-full p-2 w-8 h-8 flex items-center justify-center shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 z-10"
                style={{ fontWeight: 'bold', fontSize: '1.2rem', lineHeight: 1 }}
                onClick={() => setIsSummaryFixed(true)}
                aria-label="概要を下部に固定"
              >
                <Pin className="w-5 h-5" />
              </button>
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
                {format(currentMonth, 'yyyy', { locale: ja })}年{format(currentMonth, 'M', { locale: ja })}月の概要
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      {isSummaryFixed && (
        <div className="fixed left-0 w-full z-[300] flex justify-center pointer-events-none" style={{ bottom: '66px' }}>
          <div className="w-full max-w-md px-2 pb-2 pointer-events-auto">
            <Card className="shadow-2xl border-2 border-blue-400 ring-2 ring-blue-200 animate-fade-in">
              <CardContent className="relative p-2 sm:p-4">
                {/* 固定中バッジ */}
                <div className="absolute top-2 left-2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">固定中</span>
                </div>
                <button
                  className="absolute top-2 right-2 bg-white/80 text-blue-600 hover:bg-blue-100 hover:text-blue-800 border border-blue-300 rounded-full p-2 w-10 h-10 flex items-center justify-center shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ fontWeight: 'bold', fontSize: '1.5rem', lineHeight: 1 }}
                  onClick={() => setIsSummaryFixed(false)}
                  aria-label="概要を閉じる"
                >
                  <X className="w-7 h-7" strokeWidth={3} />
                </button>
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
                  {format(currentMonth, 'yyyy', { locale: ja })}年{format(currentMonth, 'M', { locale: ja })}月の概要
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Transaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto [&>button]:w-10 [&>button]:h-10 [&>button]:bg-white [&>button]:border [&>button]:border-gray-200 [&>button]:shadow-lg [&>button]:rounded-full [&>button]:hover:bg-gray-100 [&>button]:opacity-100 [&>button]:transition-colors [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button>svg]:w-5 [&>button>svg]:h-5">
          <DialogHeader>
            <DialogTitle>
              {format(selectedDate, 'M月d日(E)', { locale: ja })}の記録
            </DialogTitle>
          </DialogHeader>
          {/* 一括選択モード切替 */}
          {selectedDateTransactions.length > 0 && (
            <div className="flex items-center mt-2 justify-between w-full">
              <div className="flex items-center">
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
                {isBulkSelectMode && (
                  <>
                    {selectedIds.length === selectedDateTransactions.length ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => setSelectedIds([])}
                      >
                        全件解除
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="ml-2"
                        onClick={() => setSelectedIds(selectedDateTransactions.map(t => t.id))}
                        disabled={selectedDateTransactions.length === 0}
                      >
                        全件選択
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-2"
                      disabled={selectedIds.length === 0}
                      onClick={() => setIsConfirmDialogOpen(true)}
                    >
                      {selectedIds.length}件を削除
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center ml-auto">
                {!isBulkSelectMode ? (
                  <Button variant="outline" size="sm" onClick={() => setIsBulkSelectMode(true)}>
                    収支一括削除
                  </Button>
                ) : (
                  <Button variant="destructive" size="sm" onClick={() => { setIsBulkSelectMode(false); setSelectedIds([]); }}>
                    一括選択解除
                  </Button>
                )}
              </div>
            </div>
          )}
          {/* Existing transactions for the day */}
          {selectedDateTransactions.length > 0 && (
            <div className={`space-y-2 overflow-auto transition-all duration-200 ${showAllTransactions ? 'max-h-[40vh] min-h-[4rem]' : 'max-h-[96px] min-h-[96px]'}`}>
              {selectedDateTransactions.map((transaction) => (
                <div key={transaction.id} className={`flex items-center justify-between p-2 bg-gray-50 rounded ${isBulkSelectMode && selectedIds.includes(transaction.id) ? 'ring-2 ring-blue-400' : ''}`}>
                  <div className="flex items-center space-x-2 flex-1">
                    {isBulkSelectMode && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(transaction.id)}
                        onChange={e => {
                          setSelectedIds(ids =>
                            e.target.checked
                              ? [...ids, transaction.id]
                              : ids.filter(id => id !== transaction.id)
                          );
                        }}
                        className="mr-2 w-6 h-6 min-w-[1.5rem] min-h-[1.5rem] accent-blue-500 rounded border-gray-300 focus:ring-2 focus:ring-blue-400"
                        style={{ boxSizing: 'border-box' }}
                      />
                    )}
                    <span className="text-sm">{transaction.memo || transaction.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ¥{formatAmount(transaction.amount)}
                    </span>
                    {!isBulkSelectMode && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (editingTransaction?.id === transaction.id) {
                              setEditingTransaction(null);
                            } else {
                              setEditingTransaction(transaction);
                            }
                          }}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCopyingTransaction(transaction)}
                          title="コピーして新規追加"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v-1.125A2.625 2.625 0 0 0 13.875 2.25h-7.5A2.625 2.625 0 0 0 3.75 4.875v7.5A2.625 2.625 0 0 0 6.375 15H7.5m3 0h7.125A2.625 2.625 0 0 0 20.25 12.375v-7.5A2.625 2.625 0 0 0 17.625 2.25H13.5" />
                          </svg>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick transaction form */}
          <QuickTransactionForm
            selectedDate={selectedDate}
            editingTransaction={editingTransaction}
            copyingTransaction={copyingTransaction}
            onEditCancel={() => setEditingTransaction(null)}
            onCopyFinish={() => setCopyingTransaction(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog: 件数・期間・注意文言を明示 */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>本当に削除しますか？</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-700">
            <div>選択件数: <b>{selectedIds.length}</b></div>
            {selectedIds.length > 0 && (
              <div>
                <span>期間: </span>
                <b>
                  {(() => {
                    const sel = selectedDateTransactions.filter(t => selectedIds.includes(t.id));
                    if (sel.length === 0) return '-';
                    const dates = sel.map(t => t.date).sort();
                    return dates[0] === dates[dates.length-1]
                      ? dates[0]
                      : `${dates[0]} ~ ${dates[dates.length-1]}`;
                  })()}
                </b>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>削除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}