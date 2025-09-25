import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { QuickTransactionForm } from '../QuickTransactionForm';
import { useCalendarContext } from '../context/CalendarContext';
import { formatAmount, filterDateTransactions } from '../utils/calendarUtils';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSnackbar } from '@/hooks/use-toast';

export const TransactionDialog: React.FC = () => {
  const {
    calendarState,
    dialogState,
    bulkState,
    dialogActions,
    bulkActions,
    performance,
  } = useCalendarContext();

  const { deleteTransaction } = useTransactionStore();
  const { showSnackbar } = useSnackbar();

  // 選択日のトランザクション（パフォーマンス最適化済み）
  const selectedDateTransactions = filterDateTransactions(
    performance.monthTransactions, 
    calendarState.selectedDate, 
    calendarState.showMock
  );

  const handleDelete = async (transactionId: string) => {
    if (window.confirm('この収支を削除してもよろしいですか？')) {
      try {
        await deleteTransaction(transactionId);
        // Context内で自動的にリフレッシュされる
      } catch {
        showSnackbar('削除に失敗しました', 'destructive');
      }
    }
  };

  return (
    <Dialog open={dialogState.isOpen} onOpenChange={(open) => {
      if (open) {
        dialogActions.openDialog();
      } else {
        dialogActions.closeDialog();
      }
    }} data-testid="transaction-dialog">
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto pb-20 sm:pb-6 [&>button]:w-10 [&>button]:h-10 [&>button]:bg-white [&>button]:border [&>button]:border-gray-200 [&>button]:shadow-lg [&>button]:rounded-full [&>button]:hover:bg-gray-100 [&>button]:opacity-100 [&>button]:transition-colors [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button>svg]:w-5 [&>button>svg]:h-5">
        <DialogHeader>
          <DialogTitle>
            {format(calendarState.selectedDate, 'M月d日(E)', { locale: ja })}の記録
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
                  onClick={() => dialogActions.setShowAllTransactions(!dialogState.showAllTransactions)}
                  className="px-2 py-1 ml-2"
                  aria-label={dialogState.showAllTransactions ? '閉じる' : 'もっと見る'}
                  title={dialogState.showAllTransactions ? '閉じる' : 'もっと見る'}
                >
                  {dialogState.showAllTransactions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              )}
              {bulkState.isBulkSelectMode && (
                <>
                  {bulkState.selectedIds.length === selectedDateTransactions.length ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => bulkActions.setSelectedIds([])}
                    >
                      全件解除
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="ml-2"
                      onClick={() => bulkActions.setSelectedIds(selectedDateTransactions.map(t => t.id))}
                      disabled={selectedDateTransactions.length === 0}
                    >
                      全件選択
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-2"
                    disabled={bulkState.selectedIds.length === 0}
                    onClick={() => bulkActions.setIsConfirmDialogOpen(true)}
                  >
                    {bulkState.selectedIds.length}件を削除
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center ml-auto">
              {!bulkState.isBulkSelectMode ? (
                <Button variant="outline" size="sm" onClick={() => bulkActions.setIsBulkSelectMode(true)}>
                  収支一括削除
                </Button>
              ) : (
                <Button variant="destructive" size="sm" onClick={() => { bulkActions.setIsBulkSelectMode(false); bulkActions.setSelectedIds([]); }}>
                  一括選択解除
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Existing transactions for the day */}
        {selectedDateTransactions.length > 0 && (
          <div className={`space-y-2 overflow-auto transition-all duration-200 ${dialogState.showAllTransactions ? 'max-h-[40vh] min-h-[4rem]' : 'max-h-[96px] min-h-[96px]'}`}>
            {selectedDateTransactions.map((transaction) => (
              <div key={transaction.id} className={`flex items-center justify-between p-2 bg-gray-50 rounded ${bulkState.isBulkSelectMode && bulkState.selectedIds.includes(transaction.id) ? 'ring-2 ring-blue-400' : ''}`}>
                <div className="flex items-center space-x-2 flex-1">
                  {bulkState.isBulkSelectMode && (
                    <input
                      type="checkbox"
                      checked={bulkState.selectedIds.includes(transaction.id)}
                      onChange={e => {
                        bulkActions.setSelectedIds(
                          e.target.checked
                            ? [...bulkState.selectedIds, transaction.id]
                            : bulkState.selectedIds.filter(id => id !== transaction.id)
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
                  {!bulkState.isBulkSelectMode && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          dialogActions.startEdit(transaction);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          // 新しいトランザクションを即時追加
                          const rest = Object.fromEntries(Object.entries(transaction).filter(([k]) => !['id','created_at','updated_at','user_id'].includes(k)));
                          const newTransaction = {
                            ...rest,
                            date: format(calendarState.selectedDate, 'yyyy-MM-dd'),
                            type: transaction.type,
                            amount: transaction.amount,
                            category: transaction.category,
                            memo: transaction.memo,
                            isMock: transaction.isMock,
                            card_used_date: transaction.card_used_date,
                          } as Omit<import('@/types').Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
                          try {
                            await useTransactionStore.getState().addTransaction(newTransaction);
                            useTransactionStore.getState().fetchTransactions();
                            showSnackbar('トランザクションを複製しました', 'default');
                          } catch {
                            showSnackbar('複製に失敗しました', 'destructive');
                          }
                        }}
                        title="複製"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
          mode={dialogState.editingTransaction ? 'edit' : dialogState.copyingTransaction ? 'copy' : 'add'}
          selectedDate={calendarState.selectedDate}
          editingTransaction={dialogState.editingTransaction}
          copyingTransaction={dialogState.copyingTransaction}
          onEditCancel={() => {
            dialogActions.resetDialog();
            dialogActions.closeDialog();
          }}
          onCopyFinish={() => dialogActions.setCopyingTransaction(null)}
          testInitialFormData={calendarState.showMock ? { isMock: true } : undefined}
        />
      </DialogContent>
    </Dialog>
  );
};