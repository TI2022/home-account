import React, { memo } from 'react';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { isSameDay } from 'date-fns';
import { DayTotal } from '../types/calendar.types';

// PickersDayPropsからonAnimationStartを除外
type BasePickersDayProps = Omit<PickersDayProps<Date>, 'onAnimationStart'>;

interface MemoizedCustomDayProps extends BasePickersDayProps {
  day: Date;
  dayTotal: DayTotal;
}

const MemoizedCustomDay: React.FC<MemoizedCustomDayProps> = memo(({ 
  day, 
  dayTotal,
  ...other 
}) => {
  const isToday = isSameDay(day, new Date());

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
              {dayTotal.income.toLocaleString()}
            </div>
          )}
          {dayTotal.expense > 0 && (
            <div className="text-xs text-red-600 font-medium leading-none">
              {dayTotal.expense.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </PickersDay>
  );
}, (prevProps, nextProps) => {
  // カスタムメモ化ロジック：パフォーマンス最適化
  return (
    isSameDay(prevProps.day, nextProps.day) &&
    prevProps.dayTotal.income === nextProps.dayTotal.income &&
    prevProps.dayTotal.expense === nextProps.dayTotal.expense &&
    prevProps.dayTotal.net === nextProps.dayTotal.net
  );
});

MemoizedCustomDay.displayName = 'MemoizedCustomDay';

export { MemoizedCustomDay };