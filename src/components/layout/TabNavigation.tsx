import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Calendar, PiggyBank, BarChart3, Wallet } from 'lucide-react';

// MainTabの型ガード
const isMainTab = (tabId: string): tabId is 'calendar' | 'graph' | 'savings' => {
  return ['calendar', 'graph', 'savings'].includes(tabId);
};

export const TabNavigation = () => {
  const {
    currentTab,
    setCurrentTab,
    currentScreen,
    navigateToSavingsManagement,
    navigateToMain
  } = useAppStore();

  const tabs = [
    { id: 'calendar' as const, label: 'カレンダー', icon: Calendar },
    { id: 'graph' as const, label: 'グラフ', icon: BarChart3 },
    { id: 'savings' as const, label: '貯金', icon: PiggyBank },
    { id: 'savings-management' as const, label: '積立', icon: Wallet },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 z-[1100] backdrop-blur-sm border-t border-pink-100 safe-area-pb overflow-x-auto shadow-lg" data-testid="tab-navigation">
      <div className="flex justify-center">
        <div className="flex max-w-md w-full">
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            className="flex-1"
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              className={`w-full h-16 rounded-none ${
                currentScreen === 'savings-management'
                  ? (tab.id === 'savings-management' ? 'bg-pink-50 text-pink-600 border-t-2 border-pink-500' : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50')
                  : (currentTab === tab.id ? 'bg-pink-50 text-pink-600 border-t-2 border-pink-500' : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50')
              }`}
              onClick={() => {
                if (tab.id === 'savings-management') {
                  // 積立管理画面に遷移（既にいる場合は何もしない）
                  if (currentScreen !== 'savings-management') {
                    navigateToSavingsManagement();
                  }
                } else {
                  // メインアプリのタブをクリックした場合
                  if (isMainTab(tab.id)) {
                    if (currentScreen === 'savings-management') {
                      // 積立画面からメイン画面に戻る
                      navigateToMain(tab.id);
                    } else {
                      // メイン画面内でのタブ切り替え
                      setCurrentTab(tab.id);
                    }
                  }
                }
              }}
              data-testid={`tab-${tab.id}`}
            >
              <div className="flex flex-col items-center space-y-1">
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </div>
            </Button>
          </motion.div>
        ))}
        </div>
      </div>
    </div>
  );
};