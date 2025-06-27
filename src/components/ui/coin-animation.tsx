import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinAnimationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export const CoinAnimation = ({ trigger, onComplete }: CoinAnimationProps) => {
  const [coins, setCoins] = useState<Array<{ id: number; x: number; delay: number }>>([]);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (trigger) {
      // Generate multiple coins with random positions
      const newCoins = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
        delay: i * 0.1
      }));
      
      setCoins(newCoins);
      setShowAnimation(true);
      
      const timer = setTimeout(() => {
        setShowAnimation(false);
        setCoins([]);
        onComplete?.();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  return (
    <>
      <AnimatePresence>
        {showAnimation && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {/* Sparkle background effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-yellow-100/20 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
            
            {/* Coins */}
            {coins.map((coin) => (
              <motion.div
                key={coin.id}
                className="absolute w-10 h-10"
                style={{
                  left: coin.x,
                  top: -50,
                }}
                initial={{ 
                  y: -50, 
                  opacity: 0, 
                  scale: 0,
                  rotate: 0
                }}
                animate={{ 
                  y: window.innerHeight + 100, 
                  opacity: [0, 1, 1, 0.8, 0],
                  scale: [0, 1.3, 1, 0.9, 0.7],
                  rotate: [0, 180, 360, 540, 720]
                }}
                transition={{ 
                  duration: 2.5,
                  delay: coin.delay,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 rounded-full flex items-center justify-center font-bold text-yellow-900 shadow-lg border-2 border-yellow-200">
                  ¥
                </div>
                
                {/* Coin shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full"
                  animate={{
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: coin.delay
                  }}
                />
              </motion.div>
            ))}
            
            {/* Success message */}
            <motion.div
              className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: -20 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💰</span>
                  <span className="text-lg font-bold text-yellow-700">記録完了！</span>
                  <span className="text-2xl">✨</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};