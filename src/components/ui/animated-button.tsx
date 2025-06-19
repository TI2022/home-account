import React from 'react';
import { motion } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends Omit<ButtonProps, 'variant'> {
  children: React.ReactNode;
  sparkle?: boolean;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, sparkle = false, ...rest }, ref) => {
    // variantはAnimatedButtonではサポートしません。呼び出し元でvariantを指定しないでください。

    const getVariantStyles = () => {
      return '';
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
          {...rest}
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