/**
 * toast.ts — سیستم Toast (پیام کوتاه بالای صفحه)
 *
 * زمان‌ها طبق استاندارد Material Design 3:
 *   success: 2s  |  info: 2.5s  |  warn: 3s  |  error: 4s
 */
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warn' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 2000,
  info: 2500,
  warn: 3000,
  error: 4000,
};

interface ToastState {
  toasts: Toast[];
  add: (message: string, type?: ToastType, duration?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  add: (message, type = 'info', duration) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const dur = duration ?? DEFAULT_DURATION[type];
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration: dur }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, dur);
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  useToast.getState().add(message, type, duration);
}
