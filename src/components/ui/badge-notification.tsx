import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/store/useGameStore';
import { X, Award } from 'lucide-react';

interface BadgeNotificationProps {
  badge: Badge | null;
  show: boolean;
  onClose: () => void;
}

export const BadgeNotification = ({ badge, show, onClose }: BadgeNotificationProps) => {
  if (!badge) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-sm bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-2xl">
              <CardContent className="p-6 text-center relative">
                <button
                  onClick={onClose}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                  className="mb-4"
                >
                  <div className="text-6xl mb-2">{badge.icon}</div>
                  <Award className="h-8 w-8 text-yellow-600 mx-auto" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    バッジ獲得！
                  </h3>
                  <h4 className="text-lg font-semibold text-yellow-700 mb-2">
                    {badge.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {badge.description}
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                  className="mt-4"
                >
                  <div className="text-xs text-yellow-600 font-medium">
                    おめでとうございます！🎉
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};