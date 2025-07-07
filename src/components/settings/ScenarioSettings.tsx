import { useEffect, useState } from 'react';
import { useScenarioStore } from '@/store/useScenarioStore';
import { Scenario } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSnackbar } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Star } from 'lucide-react';

export const ScenarioSettings = () => {
  const { scenarios, fetchScenarios, createScenario, updateScenario, deleteScenario, setDefaultScenario, loading } = useScenarioStore();
  const { showSnackbar } = useSnackbar();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      if (editId) {
        await updateScenario(editId, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        });
        showSnackbar('シナリオを更新しました');
      } else {
        await createScenario({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          is_default: scenarios.length === 0, // 最初のシナリオはデフォルトにする
        });
        showSnackbar('シナリオを作成しました');
      }
      setForm({ name: '', description: '' });
      setEditId(null);
      setIsDialogOpen(false);
    } catch {
      showSnackbar('保存に失敗しました', 'destructive');
    }
  };

  const handleEdit = (scenario: Scenario) => {
    setForm({ name: scenario.name, description: scenario.description || '' });
    setEditId(scenario.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScenario(id);
      showSnackbar('シナリオを削除しました');
      setDeleteTargetId(null);
    } catch {
      showSnackbar('削除に失敗しました', 'destructive');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultScenario(id);
      showSnackbar('デフォルトシナリオを設定しました');
    } catch {
      showSnackbar('デフォルト設定に失敗しました', 'destructive');
    }
  };

  return (
    <div className="pb-20 max-w-md mx-auto px-2 sm:px-0">
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600 leading-relaxed mt-4">
              予定収支をシナリオごとに分けて管理できます
            </p>
            <Button 
              size="sm"
              onClick={() => { setIsDialogOpen(true); setEditId(null); }}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              シナリオ追加
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">読み込み中...</div>
          ) : (
            <div className="space-y-4">
              {scenarios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>シナリオがありません</p>
                  <p className="text-sm mt-1">最初のシナリオを作成してください</p>
                </div>
              ) : (
                scenarios.map(scenario => (
                  <div key={scenario.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base break-all">{scenario.name}</span>
                        {scenario.is_default && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            デフォルト
                          </span>
                        )}
                      </div>
                      {scenario.description && (
                        <div className="text-sm text-gray-500 mt-1 break-words">
                          {scenario.description}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 mt-2 sm:mt-0 sm:flex-row sm:gap-2 w-full sm:w-auto">
                      {!scenario.is_default && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                          onClick={() => handleSetDefault(scenario.id)}
                        >
                          <Star className="h-4 w-4" />
                          デフォルトに設定
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => handleEdit(scenario)}
                      >
                        <Edit className="h-4 w-4" />
                        編集
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex items-center gap-1"
                        onClick={() => setDeleteTargetId(scenario.id)}
                        disabled={scenario.is_default}
                      >
                        <Trash2 className="h-4 w-4" />
                        削除
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 追加・編集モーダル */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs mx-auto">
            <h2 className="text-lg font-bold mb-4">{editId ? 'シナリオ編集' : 'シナリオ追加'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block mb-1">シナリオ名 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-base"
                  required
                  placeholder="例：楽観的シナリオ"
                />
              </div>
              <div>
                <label className="block mb-1">説明</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-base"
                  rows={3}
                  placeholder="シナリオの説明（任意）"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                <Button type="submit" className="w-full sm:flex-1">
                  {editId ? '更新' : '追加'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:flex-1"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditId(null);
                    setForm({ name: '', description: '' });
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs mx-auto">
            <h2 className="text-lg font-bold mb-4">削除確認</h2>
            <p className="mb-4">
              このシナリオを削除しますか？<br />
              関連する予定収支は削除されませんが、シナリオが未設定になります。
            </p>
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteTargetId)}
              >
                削除
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteTargetId(null)}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 