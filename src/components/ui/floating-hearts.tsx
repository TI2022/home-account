import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface FloatingHeartsProps {
  trigger: boolean;
  onComplete?: () => void;
}

export const FloatingHearts: React.FC<FloatingHeartsProps> = ({ trigger, onComplete }) => {
  const [hearts, setHearts] = useState<{ id: number; x: number; delay: number }[]>([]);

  useEffect(() => {
    if (trigger) {
      const newHearts = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        delay: i * 0.1
      }));
      setHearts(newHearts);

      const timer = setTimeout(() => {
        setHearts([]);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ 
              y: '100vh', 
              x: `${heart.x}vw`,
              scale: 0,
              rotate: 0,
              opacity: 0
            }}
            animate={{ 
              y: '-10vh', 
              scale: [0, 1.2, 1, 0.8, 0],
              rotate: [0, 15, -15, 10, 0],
              opacity: [0, 1, 1, 1, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 2,
              delay: heart.delay,
              ease: "easeOut"
            }}
            className="absolute"
          >
            <Heart className="w-6 h-6 text-pink-500 fill-pink-400" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};