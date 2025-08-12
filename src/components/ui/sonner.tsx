import { useEffect } from 'react';

// Snackbarのprops
export interface SnackbarProps {
  open: boolean;
  message: string;
  variant?: 'default' | 'destructive';
  onClose?: () => void;
  duration?: number;
}

export const Snackbar = ({ open, message, variant = 'default', onClose, duration = 2000 }: SnackbarProps) => {
  useEffect(() => {
    if (open && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, onClose, duration]);

  if (!open) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1400]">
      <div
        className={`px-6 py-3 rounded shadow-lg font-bold text-white text-center min-w-[200px] max-w-[90vw] transition-all ${
          variant === 'destructive' ? 'bg-red-500' : 'bg-gray-900'
        } animate-fade-in-out`}
      >
        {message}
      </div>
    </div>
  );
};
