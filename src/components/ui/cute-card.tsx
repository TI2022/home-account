import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardProps } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CuteCardProps extends CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'pink' | 'green' | 'blue' | 'purple';
  hover?: boolean;
  glow?: boolean;
}

export const CuteCard = React.forwardRef<HTMLDivElement, CuteCardProps>(
  ({ children, className, variant = 'default', hover = true, glow = false, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'pink':
          return 'bg-gradient-to-br from-pink-50 to-rose-100 border-pink-200 shadow-pink-100';
        case 'green':
          return 'bg-gradient-to-br from-emerald-50 to-green-100 border-green-200 shadow-green-100';
        case 'blue':
          return 'bg-gradient-to-br from-blue-50 to-sky-100 border-blue-200 shadow-blue-100';
        case 'purple':
          return 'bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-violet-100';
        default:
          return 'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-gray-100';
      }
    };

    const cardVariants = {
      initial: { scale: 1, y: 0 },
      hover: { 
        scale: 1.02, 
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 17 }
      }
    };

    return (
      <motion.div
        variants={hover ? cardVariants : undefined}
        initial="initial"
        whileHover={hover ? "hover" : undefined}
        transition={{ duration: 0.2 }}
      >
        <Card
          ref={ref}
          className={cn(
            getVariantStyles(),
            'transition-all duration-300 border-2',
            glow && 'shadow-2xl',
            className
          )}
          {...props}
        >
          {children}
        </Card>
      </motion.div>
    );
  }
);

CuteCard.displayName = 'CuteCard';