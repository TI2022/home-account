import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSavingsManagementStore } from '@/store/useSavingsManagementStore';
import { useAppStore } from '@/store/useAppStore';
import { useSnackbar } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { SavingsTransaction } from '@/types';

export const AccountDetailPage = () => {
  const {
    selectedPersonId,
    selectedAccountId,
    navigateToPersonDetail
  } = useAppStore();
  const { showSnackbar } = useSnackbar();

  const {
    persons,
    accounts,
    loading,
    fetchPersons,
    fetchAccounts,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getAccountTransactions
  } = useSavingsManagementStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<SavingsTransaction | null>(null);
  const [formData, setFormData] = useState({
    type: 'deposit' as 'deposit' | 'withdrawal',
    amount: '',
    memo: '',
    date: new Date().toISOString().split('T')[0]
  });

  const person = persons.find(p => p.id === selectedPersonId);
  const account = accounts.find(a => a.id === selectedAccountId);
  const accountTransactions = selectedAccountId ? getAccountTransactions(selectedAccountId) : [];

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchPersons();
        await fetchAccounts();
        if (selectedAccountId) {
          await fetchTransactions(selectedAccountId);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        showSnackbar('データの取得に失敗しました', 'destructive');
      }
    };
    loadData();
  }, [fetchPersons, fetchAccounts, fetchTransactions, selectedAccountId, showSnackbar]);

  const handleOpenDialog = (transaction?: SavingsTransaction, defaultType?: 'deposit' | 'withdrawal') => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        memo: transaction.memo,
        date: transaction.date
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        type: defaultType || 'deposit',
        amount: '',
        memo: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount.trim()) {
      showSnackbar('金額を入力してください', 'destructive');
      return;
    }

    const amount = parseInt(formData.amount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) {
      showSnackbar('正の数値を入力してください', 'destructive');
      return;
    }

    if (!selectedAccountId) {
      showSnackbar('口座情報が見つかりません', 'destructive');
      return;
    }

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          type: formData.type,
          amount,
          memo: formData.memo.trim(),
          date: formData.date
        });
        showSnackbar('取引を更新しました', 'default');
      } else {
        await addTransaction({
          account_id: selectedAccountId,
          type: formData.type,
          amount,
          memo: formData.memo.trim(),
          date: formData.date
        });
        showSnackbar('取引を追加しました', 'default');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('操作エラー:', error);
      showSnackbar('操作に失敗しました', 'destructive');
    }
  };

  const handleDelete = async (transaction: SavingsTransaction) => {
    if (!window.confirm('この取引を削除してもよろしいですか？')) {
      return;
    }

    try {
      await deleteTransaction(transaction.id);
      showSnackbar('取引を削除しました', 'default');
    } catch (error) {
      console.error('削除エラー:', error);
      showSnackbar('削除に失敗しました', 'destructive');
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP');
  };

  const getTargetProgress = () => {
    if (!account?.target_amount) return null;
    const progress = (account.current_balance / account.target_amount) * 100;
    return Math.min(progress, 100);
  };

  const getTotalDeposits = () => {
    return accountTransactions
      .filter(t => t.type === 'deposit')
      .reduce((total, t) => total + t.amount, 0);
  };

  const getTotalWithdrawals = () => {
    return accountTransactions
      .filter(t => t.type === 'withdrawal')
      .reduce((total, t) => total + t.amount, 0);
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (!person || !account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">口座が見つかりません</p>
        <Button onClick={() => navigate('/savings-management')}>
          積立管理に戻る
        </Button>
      </div>
    );
  }

  const targetProgress = getTargetProgress();
  const totalDeposits = getTotalDeposits();
  const totalWithdrawals = getTotalWithdrawals();

  return (
    <motion.div
      className="pb-20 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigateToPersonDetail(selectedPersonId!)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-gray-500">{person.name}の積立口座</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={() => handleOpenDialog()}
            className="flex items-center justify-center gap-2 bg-green-100 text-green-700 hover:bg-green-200 border-green-300 px-4 py-2 font-medium"
          >
            <TrendingUp className="h-3 w-3" />
            積立を記録
          </Button>
          <Button
            onClick={() => {
              handleOpenDialog(undefined, 'withdrawal');
            }}
            className="flex items-center justify-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 border-red-300 px-4 py-2 font-medium"
          >
            <TrendingDown className="h-3 w-3" />
            使用を記録
          </Button>
        </div>
      </motion.div>

      {/* サマリーカード */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* 現在残高 */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                ¥{formatAmount(account.current_balance)}
              </div>
              <div className="text-blue-100 text-sm">現在残高</div>
            </div>
          </CardContent>
        </Card>

        {/* 総積立額 */}
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                ¥{formatAmount(totalDeposits)}
              </div>
              <div className="text-green-100 text-sm">総積立額</div>
            </div>
          </CardContent>
        </Card>

        {/* 総使用額 */}
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                ¥{formatAmount(totalWithdrawals)}
              </div>
              <div className="text-red-100 text-sm">総使用額</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 目標達成度 */}
      {account.target_amount && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                目標達成度
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>目標金額</span>
                  <span>¥{formatAmount(account.target_amount)}</span>
                </div>
                {targetProgress !== null && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all ${
                          targetProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(targetProgress, 100)}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <span className={`text-lg font-bold ${
                        targetProgress >= 100 ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {targetProgress.toFixed(1)}% 達成
                      </span>
                      {targetProgress >= 100 && (
                        <div className="text-sm text-green-600 mt-1">
                          🎉 目標達成おめでとうございます！
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 取引履歴 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              取引履歴
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accountTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">まだ取引がありません</p>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-green-100 text-green-700 hover:bg-green-200 border-green-300 px-4 py-2 font-medium"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  最初の積立を記録
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {accountTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.type === 'deposit' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="font-medium">
                          {transaction.memo || (transaction.type === 'deposit' ? '積立' : '使用')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(transaction.date), 'yyyy年M月d日', { locale: ja })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}¥{formatAmount(transaction.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(transaction)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 取引追加・編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? '取引編集' : '新しい取引'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>取引種類</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="deposit"
                    checked={formData.type === 'deposit'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'deposit' | 'withdrawal' })}
                  />
                  <span className="text-green-600">積立</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="withdrawal"
                    checked={formData.type === 'withdrawal'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'deposit' | 'withdrawal' })}
                  />
                  <span className="text-red-600">使用</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">金額 *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="例：10000"
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">日付 *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memo">メモ</Label>
              <Textarea
                id="memo"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="例：お年玉、ボーナス、旅行代"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit">
                {editingTransaction ? '更新' : '追加'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};