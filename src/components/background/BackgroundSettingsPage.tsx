import { motion } from 'framer-motion';
import { ThemeCustomizer } from '@/components/theme/ThemeCustomizer';

export const BackgroundSettingsPage = () => {

  return (
    <motion.div 
      className="pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
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