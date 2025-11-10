import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, PiggyBank, BarChart3, Wallet } from 'lucide-react';

export const TabNavigation = () => {
  const { currentTab, setCurrentTab } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

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
                location.pathname.startsWith('/savings-management')
                  ? (tab.id === 'savings-management' ? 'bg-pink-50 text-pink-600 border-t-2 border-pink-500' : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50')
                  : (currentTab === tab.id ? 'bg-pink-50 text-pink-600 border-t-2 border-pink-500' : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50')
              }`}
              onClick={() => {
                if (tab.id === 'savings-management') {
                  navigate('/savings-management');
                } else {
                  // 積立画面以外のタブをクリックした場合は、メイン画面に戻る
                  if (location.pathname.startsWith('/savings-management')) {
                    setCurrentTab(tab.id); // 先にタブを設定
                    navigate('/');
                  } else {
                    setCurrentTab(tab.id);
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