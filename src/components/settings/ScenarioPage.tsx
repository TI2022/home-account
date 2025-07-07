import { motion } from 'framer-motion';
import { ScenarioSettings } from './ScenarioSettings';

export const ScenarioPage = () => {
  return (
    <motion.div 
      className="pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ScenarioSettings />
      </motion.div>
    </motion.div>
  );
}; 