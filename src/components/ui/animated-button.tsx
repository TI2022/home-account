import React from 'react';
import { motion } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'cute' | 'success' | 'danger' | 'outline' | 'ghost';
  sparkle?: boolean;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, variant = 'default', sparkle = false, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'cute':
          return 'bg-gradient-to-r from-pink-400 via-pink-500 to-rose-500 hover:from-pink-500 hover:via-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200';
        case 'success':
          return 'bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 hover:from-emerald-500 hover:via-green-600 hover:to-teal-600 text-white shadow-lg shadow-green-200';
        case 'danger':
          return 'bg-gradient-to-r from-red-400 via-red-500 to-pink-500 hover:from-red-500 hover:via-red-600 hover:to-pink-600 text-white shadow-lg shadow-red-200';
        default:
          return '';
      }
    };

    return (
      <motion.div
        animate={sparkle ? { scale: [1, 1.02, 1] } : {}}
        transition={sparkle ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {}}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button
          ref={ref}
          className={cn(
            getVariantStyles(),
            'relative overflow-hidden transition-all',
            sparkle && 'animate-pulse',
            className
          )}
          {...props}
        >
          {sparkle && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            />
          )}
          <span className="relative z-10">{children}</span>
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';