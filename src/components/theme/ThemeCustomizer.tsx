import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useThemeStore, PRESET_THEMES } from '@/store/useThemeStore';
import { useToast } from '@/hooks/use-toast';
import { Palette, Plus, Trash2, Check, Sparkles } from 'lucide-react';

export const ThemeCustomizer = () => {
  const { currentTheme, customThemes, setTheme, addCustomTheme, deleteCustomTheme } = useThemeStore();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedColors, setSelectedColors] = useState({
    color1: '#fef7f0',
    color2: '#fdf2f8',
    color3: '#f0f9ff'
  });

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    toast({
      title: '背景を変更しました',
      description: '新しい背景テーマが適用されました✨',
    });
  };

  const handleCreateCustomTheme = () => {
    if (!customName.trim()) {
      toast({
        title: 'エラー',
        description: 'テーマ名を入力してください',
        variant: 'destructive',
      });
      return;
    }

    const gradient = `linear-gradient(135deg, ${selectedColors.color1} 0%, ${selectedColors.color2} 50%, ${selectedColors.color3} 100%)`;
    
    addCustomTheme({
      name: customName,
      gradient,
    });

    toast({
      title: 'カスタムテーマを作成しました',
      description: `「${customName}」が追加されました🎨`,
    });

    setCustomName('');
    setSelectedColors({
      color1: '#fef7f0',
      color2: '#fdf2f8',
      color3: '#f0f9ff'
    });
    setIsCreateDialogOpen(false);
  };

  const handleDeleteCustomTheme = (themeId: string, themeName: string) => {
    if (currentTheme === themeId) {
      setTheme('default');
    }
    deleteCustomTheme(themeId);
    toast({
      title: 'テーマを削除しました',
      description: `「${themeName}」を削除しました`,
    });
  };

  const previewGradient = `linear-gradient(135deg, ${selectedColors.color1} 0%, ${selectedColors.color2} 50%, ${selectedColors.color3} 100%)`;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">背景テーマ</h2>
        <p className="text-gray-600 text-sm">気分に合わせて背景を変更できます</p>
      </div>

      {/* Preset Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span>プリセットテーマ</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {PRESET_THEMES.map((theme) => (
              <motion.div
                key={theme.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  currentTheme === theme.id
                    ? 'border-purple-500 shadow-lg'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => handleThemeSelect(theme.id)}
              >
                <div className={`w-full h-16 rounded-md mb-2 ${theme.preview}`} />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="text-lg">{theme.icon}</span>
                      <span className="font-medium text-sm">{theme.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{theme.mood}</p>
                  </div>
                  {currentTheme === theme.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-purple-500 text-white rounded-full p-1"
                    >
                      <Check className="h-3 w-3" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-pink-600" />
              <span>カスタムテーマ</span>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-pink-500 hover:bg-pink-600">
                  <Plus className="h-4 w-4 mr-1" />
                  作成
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>カスタムテーマを作成</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme-name">テーマ名</Label>
                    <Input
                      id="theme-name"
                      placeholder="例: 私の特別な背景"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>グラデーション色</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="color1" className="text-xs">開始色</Label>
                        <input
                          id="color1"
                          type="color"
                          value={selectedColors.color1}
                          onChange={(e) => setSelectedColors(prev => ({ ...prev, color1: e.target.value }))}
                          className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="color2" className="text-xs">中間色</Label>
                        <input
                          id="color2"
                          type="color"
                          value={selectedColors.color2}
                          onChange={(e) => setSelectedColors(prev => ({ ...prev, color2: e.target.value }))}
                          className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="color3" className="text-xs">終了色</Label>
                        <input
                          id="color3"
                          type="color"
                          value={selectedColors.color3}
                          onChange={(e) => setSelectedColors(prev => ({ ...prev, color3: e.target.value }))}
                          className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>プレビュー</Label>
                    <div 
                      className="w-full h-20 rounded-lg border"
                      style={{ background: previewGradient }}
                    />
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="flex-1"
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleCreateCustomTheme}
                      className="flex-1 bg-pink-500 hover:bg-pink-600"
                    >
                      作成
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customThemes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Palette className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">まだカスタムテーマがありません</p>
              <p className="text-xs mt-1">「作成」ボタンから独自のテーマを作ってみましょう</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <AnimatePresence>
                {customThemes.map((theme) => (
                  <motion.div
                    key={theme.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ scale: 1.01 }}
                    className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      currentTheme === theme.id
                        ? 'border-pink-500 shadow-lg'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                    onClick={() => handleThemeSelect(theme.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-md border"
                        style={{ background: theme.gradient }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{theme.name}</span>
                          {currentTheme === theme.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-pink-500 text-white rounded-full p-1"
                            >
                              <Check className="h-3 w-3" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          作成日: {new Date(theme.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomTheme(theme.id, theme.name);
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};