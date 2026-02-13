import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { Menu, LogOut, User, Palette, Plus, Settings, Tag } from 'lucide-react';

export const BudgetHeader: React.FC = () => {
  const { signOut, user } = useAuthStore();
  const { navigateToBudgetManagement, navigateToCategoriesManagement, setCurrentTab } = useAppStore();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleMainTabTransition = (target: Parameters<typeof setCurrentTab>[0]) => {
    return () => setCurrentTab(target);
  };

  const handleBudgetManagement = () => {
    navigateToBudgetManagement();
  };

  const handleCategoriesManagement = () => {
    navigateToCategoriesManagement();
  };

  return (
    <header className="py-3 safe-area-pt bg-transparent" data-testid="budget-header">
      <div className="flex items-center justify-center relative">
        <h1 className="text-xl font-bold text-gray-800">予算管理</h1>

        <Sheet>
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

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  onClick={handleMainTabTransition('add')}
                  className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Plus className="h-4 w-4 mr-3" />
                  収支を記録
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleMainTabTransition('background')}
                  className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  <Palette className="h-4 w-4 mr-3" />
                  背景設定
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleMainTabTransition('settings')}
                  className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  収支設定
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleBudgetManagement}
                  className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  予算管理
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleCategoriesManagement}
                  className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  <Tag className="h-4 w-4 mr-3" />
                  カテゴリ管理
                </Button>

                <div className="border-t border-gray-200 pt-4">
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid="logout-button"
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

export default BudgetHeader;
