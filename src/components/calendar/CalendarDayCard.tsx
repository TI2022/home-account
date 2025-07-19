import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface CalendarDayCardProps {
  date: string; // '2024-07-01' など
  totalAmount: number;
  icon?: React.ReactNode;
  tags?: string[];
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CalendarDayCard: React.FC<CalendarDayCardProps> = ({
  date,
  totalAmount,
  icon,
  tags = [],
  selected = false,
  onClick,
  className,
}) => {
  const day = new Date(date).getDate();
  const isPositive = totalAmount >= 0;
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:scale-105 hover:shadow-lg p-2 border-2',
        selected ? 'border-primary ring-2 ring-primary' : 'border-muted',
        className
      )}
      onClick={onClick}
      tabIndex={0}
      aria-pressed={selected}
    >
      <CardContent className="flex flex-col items-center space-y-1 p-2">
        <div className="text-xs text-muted-foreground">{date}</div>
        <div className="text-2xl font-bold flex items-center space-x-1">
          {icon && <span>{icon}</span>}
          <span>{day}</span>
        </div>
        <div className={cn('text-sm font-semibold', isPositive ? 'text-green-600' : 'text-red-600')}>{isPositive ? '+' : ''}{totalAmount.toLocaleString()}円</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarDayCard; 