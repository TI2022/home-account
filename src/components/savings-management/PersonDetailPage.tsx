import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSavingsManagementStore } from '@/store/useSavingsManagementStore';
import { useAppStore } from '@/store/useAppStore';
import { useSnackbar } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Edit, Trash2, Target, PiggyBank, User } from 'lucide-react';
import type { SavingsAccount } from '@/types';

export const PersonDetailPage = () => {
  const {
    selectedPersonId,
    navigateToSavingsManagement,
    navigateToAccountDetail
  } = useAppStore();
  const { showSnackbar } = useSnackbar();

  const {
    persons,
    loading,
    fetchPersons,
    fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    getPersonAccounts,
    getPersonTotalBalance
  } = useSavingsManagementStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SavingsAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: ''
  });

  const person = persons.find(p => p.id === selectedPersonId);
  const personAccounts = selectedPersonId ? getPersonAccounts(selectedPersonId) : [];
  const totalBalance = selectedPersonId ? getPersonTotalBalance(selectedPersonId) : 0;

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchPersons();
        if (selectedPersonId) {
          await fetchAccounts(selectedPersonId);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        showSnackbar('データの取得に失敗しました', 'destructive');
      }
    };
    loadData();
  }, [fetchPersons, fetchAccounts, selectedPersonId, showSnackbar]);

  const handleOpenDialog = (account?: SavingsAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        target_amount: account.target_amount ? account.target_amount.toString() : ''
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        target_amount: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showSnackbar('積立口座名を入力してください', 'destructive');
      return;
    }

    if (!selectedPersonId) {
      showSnackbar('個人情報が見つかりません', 'destructive');
      return;
    }

    const targetAmount = formData.target_amount.trim() ?
      parseInt(formData.target_amount.replace(/,/g, '')) : undefined;

    if (targetAmount !== undefined && (isNaN(targetAmount) || targetAmount < 0)) {
      showSnackbar('目標金額は正の数値で入力してください', 'destructive');
      return;
    }

    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, {
          name: formData.name.trim(),
          target_amount: targetAmount
        });
        showSnackbar('積立口座を更新しました', 'default');
      } else {
        await addAccount({
          person_id: selectedPersonId,
          name: formData.name.trim(),
          target_amount: targetAmount,
          current_balance: 0
        });
        showSnackbar('新しい積立口座を追加しました', 'default');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('操作エラー:', error);
      showSnackbar('操作に失敗しました', 'destructive');
    }
  };

  const handleDelete = async (account: SavingsAccount) => {
    if (!window.confirm(`「${account.name}」を削除してもよろしいですか？\n関連するすべての取引履歴も削除されます。`)) {
      return;
    }

    try {
      await deleteAccount(account.id);
      showSnackbar('積立口座と関連データを削除しました', 'default');
    } catch (error) {
      console.error('削除エラー:', error);
      showSnackbar('削除に失敗しました', 'destructive');
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP');
  };

  const getTargetProgress = (account: SavingsAccount) => {
    if (!account.target_amount) return null;
    const progress = (account.current_balance / account.target_amount) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (!person) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">個人が見つかりません</p>
        <Button onClick={() => navigateToSavingsManagement()}>
          積立管理に戻る
        </Button>
      </div>
    );
  }

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
          <Button variant="ghost" onClick={() => navigateToSavingsManagement()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            {person.avatar ? (
              <img
                src={person.avatar}
                alt={person.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-gray-400" />
            )}
            <div>
              <h1 className="text-2xl font-bold">{person.name}</h1>
              <p className="text-gray-500">積立口座管理</p>
            </div>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          口座追加
        </Button>
      </motion.div>

      {/* 総残高カード */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                ¥{formatAmount(totalBalance)}
              </div>
              <div className="text-blue-100">
                総積立残高
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 積立口座一覧 */}
      {personAccounts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-12"
        >
          <div className="bg-gray-50 rounded-lg p-8">
            <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">まだ積立口座がありません</p>
            <Button onClick={() => handleOpenDialog()}>
              最初の積立口座を作成
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {personAccounts.map((account, index) => {
            const progress = getTargetProgress(account);
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigateToAccountDetail(selectedPersonId!, account.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="truncate">{account.name}</span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(account)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* 現在残高 */}
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${account.current_balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          ¥{formatAmount(account.current_balance)}
                        </div>
                        <div className="text-sm text-gray-500">現在残高</div>
                      </div>

                      {/* 目標金額と進捗 */}
                      {account.target_amount && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              目標
                            </span>
                            <span>¥{formatAmount(account.target_amount)}</span>
                          </div>
                          {progress !== null && (
                            <div className="space-y-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <div className="text-xs text-center text-gray-500">
                                {progress.toFixed(1)}% 達成
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* 口座追加・編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? '積立口座編集' : '新しい積立口座'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">口座名 *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例：旅行積立、車購入資金"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_amount">目標金額（任意）</Label>
              <Input
                id="target_amount"
                type="number"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                placeholder="例：1000000"
                min="0"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit">
                {editingAccount ? '更新' : '作成'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};