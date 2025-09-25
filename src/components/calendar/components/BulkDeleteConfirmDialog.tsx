import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCalendarContext } from '../context/CalendarContext';
import { filterDateTransactions } from '../utils/calendarUtils';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSnackbar } from '@/hooks/use-toast';

export const BulkDeleteConfirmDialog: React.FC = () => {
  const {
    calendarState,
    bulkState,
    bulkActions,
    performance,
  } = useCalendarContext();

  const { deleteTransactions } = useTransactionStore();
  const { showSnackbar } = useSnackbar();

  // 選択日のトランザクション（パフォーマンス最適化済み）
  const selectedDateTransactions = filterDateTransactions(
    performance.monthTransactions, 
    calendarState.selectedDate, 
    calendarState.showMock
  );

  const handleBulkDelete = async () => {
    bulkActions.setIsConfirmDialogOpen(false);
    try {
      await deleteTransactions(bulkState.selectedIds);
      bulkActions.clearSelection();
      showSnackbar('選択した収支を削除しました', 'default');
    } catch {
      showSnackbar('一括削除に失敗しました', 'destructive');
    }
  };

  return (
    <Dialog open={bulkState.isConfirmDialogOpen} onOpenChange={bulkActions.setIsConfirmDialogOpen}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>本当に削除しますか？</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-gray-700">
          <div>選択件数: <b>{bulkState.selectedIds.length}</b></div>
          {bulkState.selectedIds.length > 0 && (
            <div>
              <span>期間: </span>
              <b>
                {(() => {
                  const sel = selectedDateTransactions.filter(t => bulkState.selectedIds.includes(t.id));
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
          <Button variant="outline" onClick={() => bulkActions.setIsConfirmDialogOpen(false)}>キャンセル</Button>
          <Button variant="destructive" onClick={handleBulkDelete}>削除</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};