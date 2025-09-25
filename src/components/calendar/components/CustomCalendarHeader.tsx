import React from 'react';
import { format, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

export interface CustomCalendarHeaderProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export const CustomCalendarHeader: React.FC<CustomCalendarHeaderProps> = ({
  currentMonth,
  onMonthChange,
  minDate,
  maxDate,
}) => {
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
        data-testid="calendar-prev-month"
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
        data-testid="calendar-next-month"
      >
        <span style={{ fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>&gt;</span>
      </button>
    </div>
  );
};