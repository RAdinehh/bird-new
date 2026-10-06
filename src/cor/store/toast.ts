import { toFa } from '../../shr/utils/fa';
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


// ═══════════════════════════════════════════════════
// toastMsg — helper برای پیام‌های استاندارد
// ═══════════════════════════════════════════════════

/**
 * الگوی استاندارد پیام‌ها: «نام آیتم» + عمل + شد
 *
 * مثال:
 *   toastMsg.deleted('گله بهار')     → «گله بهار» حذف شد
 *   toastMsg.saved('نژاد مرندی')     → «نژاد مرندی» ذخیره شد
 *   toastMsg.hidden('گله بهار')      → «گله بهار» پنهان شد
 */
export const toastMsg = {
  // ─── افزودن ───
  added: (name: string, itemType?: string) =>
    showToast(`«${name}»${itemType ? ' ' + itemType : ''} افزوده شد`, 'success'),

  // ─── ذخیره ───
  saved: (name?: string) =>
    showToast(name ? `«${name}» ذخیره شد` : 'ذخیره شد', 'success'),

  updated: (name: string) =>
    showToast(`«${name}» به‌روز شد`, 'success'),

  // ─── حذف ───
  deleted: (name: string) =>
    showToast(`«${name}» حذف شد`, 'error'),

  deletedBulk: (count: number, itemType: string) =>
    showToast(`${toFa(count)} ${itemType} حذف شد`, 'error'),

  // ─── آرشیو ───
  archived: (name: string) =>
    showToast(`«${name}» آرشیو شد`, 'warn'),

  archivedBulk: (count: number, itemType: string) =>
    showToast(`${toFa(count)} ${itemType} آرشیو شد`, 'warn'),

  // ─── بازگردانی ───
  restored: (name: string) =>
    showToast(`«${name}» بازگردانی شد`, 'success'),

  restoredBulk: (count: number, itemType: string) =>
    showToast(`${toFa(count)} ${itemType} بازگردانی شد`, 'success'),

  // ─── پنهان / نمایان ───
  hidden: (name: string) =>
    showToast(`«${name}» پنهان شد`, 'warn'),

  visible: (name: string) =>
    showToast(`«${name}» نمایان شد`, 'success'),

  // ─── غیرفعال / فعال ───
  paused: (name: string) =>
    showToast(`«${name}» غیرفعال شد`, 'warn'),

  activated: (name: string) =>
    showToast(`«${name}» فعال شد`, 'success'),

  // ─── عمومی ───
  error: (msg: string) =>
    showToast(msg, 'error'),

  warn: (msg: string) =>
    showToast(msg, 'warn'),

  info: (msg: string) =>
    showToast(msg, 'info'),
};
