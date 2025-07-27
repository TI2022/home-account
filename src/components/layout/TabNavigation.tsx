import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Settings, Calendar, PiggyBank, BarChart3 } from 'lucide-react';

export const TabNavigation = () => {
  const { currentTab, setCurrentTab } = useAppStore();

  const tabs = [
    { id: 'calendar' as const, label: 'カレンダー', icon: Calendar },
    { id: 'graph' as const, label: 'グラフ', icon: BarChart3 },
    { id: 'settings' as const, label: '収支設定', icon: Settings },
    { id: 'savings' as const, label: '貯金', icon: PiggyBank },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 z-[1100] backdrop-blur-sm border-t border-pink-100 safe-area-pb overflow-x-auto shadow-lg">
      <div className="flex">
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            className="flex-1"
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              className={`w-full h-16 rounded-none ${
                currentTab === tab.id
                  ? 'bg-pink-50 text-pink-600 border-t-2 border-pink-500'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
              onClick={() => setCurrentTab(tab.id)}
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
  );
};