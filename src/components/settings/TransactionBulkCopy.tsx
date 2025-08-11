import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSnackbar } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

export const TransactionBulkCopy = () => {
  const { transactions, fetchTransactions, addTransaction } = useTransactionStore();
  const { showSnackbar } = useSnackbar();
  
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyStartDate, setCopyStartDate] = useState('');
  const [copyEndDate, setCopyEndDate] = useState('');
  const [copyFromType, setCopyFromType] = useState<'planned' | 'actual'>('planned');
  const [copyToType, setCopyToType] = useState<'planned' | 'actual'>('actual');
  const [isCopying, setIsCopying] = useState(false);

  const handleBulkCopy = async () => {
    if (!copyStartDate || !copyEndDate) {
      showSnackbar('開始日と終了日を入力してください', 'destructive');
      return;
    }

    if (copyFromType === copyToType) {
      showSnackbar('コピー元とコピー先は異なる種類を選択してください', 'destructive');
      return;
    }

    setIsCopying(true);
    try {
      await fetchTransactions();
      
      // コピー元のトランザクションを取得（シナリオ関連ロジック削除）
      const fromIsMock = copyFromType === 'planned';
      const toIsMock = copyToType === 'planned';
      
      const filteredTransactions = transactions.filter(t =>
        (t.isMock ?? false) === fromIsMock &&
        t.date >= copyStartDate && 
        t.date <= copyEndDate
      );

      let success = 0;
      let fail = 0;

      // 各トランザクションをコピー（scenario_id関連を削除）
      for (const transaction of filteredTransactions) {
        try {
          await addTransaction({
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
            date: transaction.date,
            memo: transaction.memo,
            isMock: toIsMock,
            card_used_date: transaction.card_used_date || undefined,
          });
          success++;
        } catch {
          fail++;
        }
      }

      showSnackbar(
        `コピー完了: ${success}件成功${fail > 0 ? `, ${fail}件失敗` : ''}`, 
        fail === 0 ? 'default' : 'destructive'
      );
      setIsCopyModalOpen(false);
    } catch {
      showSnackbar('コピー処理に失敗しました', 'destructive');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            トランザクション一括コピー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            予定の収支を実際の収支にコピー（またはその逆）できます
          </p>
          <Button 
            onClick={() => setIsCopyModalOpen(true)}
            className="w-full"
          >
            一括コピーを開始
          </Button>
        </CardContent>
      </Card>

      {/* 一括コピー用モーダル */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
            <h2 className="text-lg font-bold mb-4">トランザクション一括コピー</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">コピー元</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="copyFrom" 
                      value="planned" 
                      checked={copyFromType === 'planned'} 
                      onChange={() => setCopyFromType('planned')} 
                    />
                    <span>予定の収支</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="copyFrom" 
                      value="actual" 
                      checked={copyFromType === 'actual'} 
                      onChange={() => setCopyFromType('actual')} 
                    />
                    <span>実際の収支</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">コピー先</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="copyTo" 
                      value="planned" 
                      checked={copyToType === 'planned'} 
                      onChange={() => setCopyToType('planned')} 
                    />
                    <span>予定の収支</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="copyTo" 
                      value="actual" 
                      checked={copyToType === 'actual'} 
                      onChange={() => setCopyToType('actual')} 
                    />
                    <span>実際の収支</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium">開始日</label>
                  <input 
                    type="date" 
                    className="w-full border rounded px-3 py-2" 
                    value={copyStartDate} 
                    onChange={e => setCopyStartDate(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">終了日</label>
                  <input 
                    type="date" 
                    className="w-full border rounded px-3 py-2" 
                    value={copyEndDate} 
                    onChange={e => setCopyEndDate(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsCopyModalOpen(false)} 
                disabled={isCopying}
              >
                キャンセル
              </Button>
              <Button 
                onClick={handleBulkCopy} 
                disabled={isCopying}
              >
                {isCopying ? 'コピー中...' : 'コピー実行'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};