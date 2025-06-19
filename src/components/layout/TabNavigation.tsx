import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Home, Plus, History, Settings, Calendar } from 'lucide-react';

export const TabNavigation = () => {
  const { currentTab, setCurrentTab } = useAppStore();

  const tabs = [
    { id: 'home' as const, label: 'ホーム', icon: Home },
    { id: 'calendar' as const, label: 'カレンダー', icon: Calendar },
    { id: 'add' as const, label: '記録', icon: Plus },
    { id: 'history' as const, label: '履歴', icon: History },
    { id: 'settings' as const, label: '設定', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-pink-100 safe-area-pb overflow-x-auto shadow-lg">
      <div className="flex">
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            className="flex-1"
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentTab(tab.id)}
              className={`w-full h-16 flex flex-col items-center justify-center space-y-1 rounded-none relative ${
                currentTab === tab.id
                  ? 'text-pink-600'
                  : 'text-gray-600 hover:text-pink-500'
              }`}
            >
              {currentTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-t from-pink-50 to-transparent"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                animate={currentTab === tab.id ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative z-10"
              >
                <tab.icon className="h-5 w-5" />
              </motion.div>
              <span className="text-xs whitespace-nowrap relative z-10">{tab.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};