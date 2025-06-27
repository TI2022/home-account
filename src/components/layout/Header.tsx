import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { Menu, LogOut, User, Palette, Home, History, Plus, BarChart3 } from 'lucide-react';

export const Header = () => {
  const { signOut, user } = useAuthStore();
  const { currentTab, setCurrentTab } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const handleBackgroundSettings = () => {
    setCurrentTab('background');
    setIsMenuOpen(false);
  };

  const handleStatus = () => {
    setCurrentTab('home');
    setIsMenuOpen(false);
  };

  const handleAddRecord = () => {
    setCurrentTab('add');
    setIsMenuOpen(false);
  };

  const handleHistory = () => {
    setCurrentTab('history');
    setIsMenuOpen(false);
  };

  const handleGraph = () => {
    setCurrentTab('graph');
    setIsMenuOpen(false);
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'home':
        return 'ステータス';
      case 'calendar':
        return 'カレンダー';
      case 'add':
        return '収支の記録';
      case 'history':
        return '履歴';
      case 'settings':
        return '収支設定';
      case 'background':
        return '背景設定';
      case 'savings':
        return '貯金';
      case 'graph':
        return 'グラフ';
      default:
        return 'ステータス';
    }
  };

  return (
    <header className="py-3 safe-area-pt bg-transparent">
      <div className="flex items-center justify-center relative">
        <motion.h1 
          key={currentTab}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-bold text-gray-800"
        >
          {getPageTitle()}
        </motion.h1>
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 absolute right-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="text-left">メニュー</SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              {/* User Info Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500 p-2 rounded-full">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">アカウント</p>
                    <p className="text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  onClick={handleStatus}
                  className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Home className="h-4 w-4 mr-3" />
                  ステータス
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={handleAddRecord}
                  className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Plus className="h-4 w-4 mr-3" />
                  収支を記録
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={handleHistory}
                  className="w-full justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  <History className="h-4 w-4 mr-3" />
                  履歴
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={handleBackgroundSettings}
                  className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  <Palette className="h-4 w-4 mr-3" />
                  背景設定
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={handleGraph}
                  className="w-full justify-start text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  グラフ
                </Button>
                
                <div className="border-t border-gray-200 pt-4">
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    ログアウト
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};