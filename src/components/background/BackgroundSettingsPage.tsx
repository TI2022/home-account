import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThemeCustomizer } from '@/components/theme/ThemeCustomizer';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft } from 'lucide-react';

export const BackgroundSettingsPage = () => {
  const { setCurrentTab } = useAppStore();

  const handleBack = () => {
    setCurrentTab('home');
  };

  return (
    <motion.div 
      className="pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Back Button */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-gray-600 hover:text-gray-900 p-2"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          戻る
        </Button>
      </motion.div>

      {/* Theme Customizer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ThemeCustomizer />
      </motion.div>
    </motion.div>
  );
};