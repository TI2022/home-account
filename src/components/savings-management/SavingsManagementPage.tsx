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
import { User, Plus, Edit, Trash2, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Person } from '@/types';

export const SavingsManagementPage = () => {
  const { navigateToPersonDetail } = useAppStore();
  const { showSnackbar } = useSnackbar();
  const {
    persons,
    loading,
    fetchPersons,
    addPerson,
    updatePerson,
    deletePerson,
    getPersonTotalBalance,
    fetchAccounts
  } = useSavingsManagementStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    avatar: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('=== データ取得開始 ===');

        // まず、Supabase接続をテスト
        const { data: { user } } = await supabase.auth.getUser();
        console.log('認証ユーザー:', user);

        if (user) {
          // personsテーブルの存在確認
          console.log('personsテーブルのクエリテスト中...');
          const { data: testData, error: testError } = await supabase
            .from('persons')
            .select('count', { count: 'exact' })
            .limit(0);

          console.log('personsテーブルテスト結果:');
          console.log('data:', testData);
          console.log('error:', testError);

          if (testError) {
            console.error('personsテーブルが存在しないか、アクセスできません:', testError);
            showSnackbar(`テーブルエラー: ${testError.message}`, 'destructive');
            return;
          }
        }

        await fetchPersons();
        await fetchAccounts();
      } catch (error) {
        console.error('データ取得エラー:', error);
        showSnackbar('データの取得に失敗しました', 'destructive');
      }
    };
    loadData();
  }, [fetchPersons, fetchAccounts, showSnackbar]);

  const handleOpenDialog = (person?: Person) => {
    if (person) {
      setEditingPerson(person);
      setFormData({
        name: person.name,
        avatar: person.avatar || ''
      });
    } else {
      setEditingPerson(null);
      setFormData({
        name: '',
        avatar: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showSnackbar('名前を入力してください', 'destructive');
      return;
    }

    try {
      console.log('=== 個人追加/更新フォーム送信 ===');
      console.log('editingPerson:', editingPerson);
      console.log('formData:', formData);

      if (editingPerson) {
        const updateData = {
          name: formData.name.trim(),
          avatar: formData.avatar.trim() || undefined
        };
        console.log('更新データ:', updateData);

        await updatePerson(editingPerson.id, updateData);
        showSnackbar('個人情報を更新しました', 'default');
      } else {
        const addData = {
          name: formData.name.trim(),
          avatar: formData.avatar.trim() || undefined
        };
        console.log('追加データ:', addData);

        await addPerson(addData);
        showSnackbar('新しい個人を追加しました', 'default');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('=== 個人操作エラー ===');
      console.error('エラーオブジェクト:', error);
      console.error('エラーメッセージ:', error instanceof Error ? error.message : 'Unknown error');
      console.error('エラーの詳細:', JSON.stringify(error, null, 2));

      let errorMessage = '操作に失敗しました';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }

      showSnackbar(errorMessage, 'destructive');
    }
  };

  const handleDelete = async (person: Person) => {
    if (!window.confirm(`「${person.name}」を削除してもよろしいですか？\n関連する積立口座もすべて削除されます。`)) {
      return;
    }

    try {
      await deletePerson(person.id);
      showSnackbar('個人と関連データを削除しました', 'default');
    } catch (error) {
      console.error('削除エラー:', error);
      showSnackbar('削除に失敗しました', 'destructive');
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP');
  };

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
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          積立管理
        </h1>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          個人追加
        </Button>
      </motion.div>

      {/* 個人カード一覧 */}
      {loading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : persons.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-12"
        >
          <div className="bg-gray-50 rounded-lg p-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">まだ個人が登録されていません</p>
            <Button onClick={() => handleOpenDialog()}>
              最初の個人を追加
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {persons.map((person, index) => {
            const totalBalance = getPersonTotalBalance(person.id);
            return (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigateToPersonDetail(person.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-2">
                        {person.avatar ? (
                          <img
                            src={person.avatar}
                            alt={person.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-gray-400" />
                        )}
                        <span>{person.name}</span>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(person)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(person)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ¥{formatAmount(totalBalance)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        総積立残高
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* 個人追加・編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPerson ? '個人情報編集' : '新しい個人追加'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前 *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例：太郎"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">アバター画像URL（任意）</Label>
              <Input
                id="avatar"
                type="url"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit">
                {editingPerson ? '更新' : '追加'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};