/**
 * toast.ts — سیستم Toast (پیام کوتاه بالای صفحه)
 */
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warn' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  add: (message: string, type?: ToastType, duration?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  add: (message, type = 'info', duration = 2500) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, duration);
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  useToast.getState().add(message, type, duration);
}
