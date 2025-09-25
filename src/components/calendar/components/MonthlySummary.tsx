import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Pin, X } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Transaction } from '@/types';
import { formatAmount, calculateMonthlySummary } from '../utils/calendarUtils';

export interface MonthlySummaryProps {
  monthTransactions: Transaction[];
  currentMonth: Date;
  isSummaryFixed: boolean;
  onToggleFixed: (fixed: boolean) => void;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  monthTransactions,
  currentMonth,
  isSummaryFixed,
  onToggleFixed,
}) => {
  const { income, expense, balance } = calculateMonthlySummary(monthTransactions);
  
  const SummaryContent = () => (
    <div className="flex flex-col gap-1 w-full">
      <div className="text-center py-2 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-center gap-1 text-base sm:text-xl font-bold text-green-600 truncate">
          <ArrowUpCircle className="inline-block w-5 h-5 text-green-500 mr-1" />
          <span>¥{formatAmount(income)}</span>
        </div>
        <div className="text-xs sm:text-sm text-green-700 font-medium">収入</div>
      </div>
      <div className="text-center py-2 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center justify-center gap-1 text-base sm:text-xl font-bold text-red-600 truncate">
          <ArrowDownCircle className="inline-block w-5 h-5 text-red-500 mr-1" />
          <span>¥{formatAmount(expense)}</span>
        </div>
        <div className="text-xs sm:text-sm text-red-700 font-medium">支出</div>
      </div>
      <div className={`text-center py-2 rounded-lg border ${
        balance >= 0 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-orange-50 border-orange-200'
      }`}>
        <div className={`flex items-center justify-center gap-1 text-base sm:text-xl font-bold truncate ${
          balance >= 0 ? 'text-blue-600' : 'text-orange-600'
        }`}>
          <Wallet className={`inline-block w-5 h-5 mr-1 ${
            balance >= 0 ? 'text-blue-500' : 'text-orange-500'
          }`} />
          <span>¥{formatAmount(balance)}</span>
        </div>
        <div className={`text-xs sm:text-sm font-medium ${
          balance >= 0 ? 'text-blue-700' : 'text-orange-700'
        }`}>
          残高
        </div>
      </div>
    </div>
  );

  if (isSummaryFixed) {
    return (
      <div className="fixed left-0 w-full z-[300] flex justify-center pointer-events-none" style={{ bottom: '66px' }}>
        <div className="w-full max-w-md px-2 pb-2 pointer-events-auto">
          <Card className="shadow-2xl border-2 border-blue-400 ring-2 ring-blue-200 animate-fade-in" data-testid="monthly-summary">
            <CardContent className="relative p-2 sm:p-4">
              {/* 固定中バッジ */}
              <div className="absolute top-2 left-2">
                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">固定中</span>
              </div>
              <button
                className="absolute top-2 right-2 bg-white/80 text-blue-600 hover:bg-blue-100 hover:text-blue-800 border border-blue-300 rounded-full p-2 w-10 h-10 flex items-center justify-center shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ fontWeight: 'bold', fontSize: '1.5rem', lineHeight: 1 }}
                onClick={() => onToggleFixed(false)}
                aria-label="概要を閉じる"
              >
                <X className="w-7 h-7" strokeWidth={3} />
              </button>
              <SummaryContent />
              <div className="text-xs text-gray-500 text-center mt-2">
                {format(currentMonth, 'yyyy', { locale: ja })}年{format(currentMonth, 'M', { locale: ja })}月の概要
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Card data-testid="monthly-summary">
      <CardContent className="p-2 sm:p-4 relative">
        {/* 固定表示ボタン: 概要の中、右上に絶対配置・ピンアイコンのみ */}
        <button
          className="absolute top-2 right-2 bg-white/80 text-blue-600 hover:bg-blue-100 hover:text-blue-800 border border-blue-300 rounded-full p-2 w-8 h-8 flex items-center justify-center shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 z-20"
          style={{ fontWeight: 'bold', fontSize: '1.2rem', lineHeight: 1 }}
          onClick={() => onToggleFixed(true)}
          aria-label="概要を下部に固定"
        >
          <Pin className="w-5 h-5" />
        </button>
        <SummaryContent />
        <div className="text-xs text-gray-500 text-center mt-2">
          {format(currentMonth, 'yyyy', { locale: ja })}年{format(currentMonth, 'M', { locale: ja })}月の概要
        </div>
      </CardContent>
    </Card>
  );
};