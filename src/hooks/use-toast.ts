import { create } from 'zustand';

export type SnackbarVariant = 'default' | 'destructive';

interface SnackbarState {
  open: boolean;
  message: string;
  variant: SnackbarVariant;
  showSnackbar: (message: string, variant?: SnackbarVariant, duration?: number) => void;
}

export const useSnackbarStore = create<SnackbarState>((set) => ({
  open: false,
  message: '',
  variant: 'default',
  showSnackbar: (message, variant = 'default', duration = 2000) => {
    set({ open: true, message, variant });
    setTimeout(() => set({ open: false }), duration);
  },
}));

export function useSnackbar() {
  const { open, message, variant, showSnackbar } = useSnackbarStore();
  return { open, message, variant, showSnackbar };
}
