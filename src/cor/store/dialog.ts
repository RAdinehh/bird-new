import { create } from 'zustand';

export type DialogType = 'alert' | 'success' | 'error' | 'confirm' | 'danger' | 'info';

export interface DialogConfig {
  type: DialogType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogState {
  open: boolean;
  config: DialogConfig | null;
  show: (cfg: DialogConfig) => void;
  close: () => void;
}

export const useDialog = create<DialogState>((set) => ({
  open: false,
  config: null,
  show: (cfg) => set({ open: true, config: cfg }),
  close: () => set({ open: false })
}));

/* ============ توابع کمکی ============ */

export function showAlert(message: string, title = '') {
  useDialog.getState().show({ type: 'alert', title, message, confirmText: 'تأیید' });
}

export function showSuccess(message: string, title = 'انجام شد') {
  useDialog.getState().show({ type: 'success', title, message, confirmText: 'عالی' });
}

export function showError(message: string, title = 'خطا') {
  useDialog.getState().show({ type: 'error', title, message, confirmText: 'متوجه شدم' });
}

export function showInfo(message: string, title = 'اطلاع') {
  useDialog.getState().show({ type: 'info', title, message, confirmText: 'باشه' });
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: { danger?: boolean; confirmText?: string; cancelText?: string }
) {
  useDialog.getState().show({
    type: options?.danger ? 'danger' : 'confirm',
    title,
    message,
    confirmText: options?.confirmText || (options?.danger ? 'حذف کن' : 'تأیید'),
    cancelText: options?.cancelText || 'لغو',
    onConfirm
  });
}


/** نسخه‌ی Promise از showConfirm — برای async/await */
export function showConfirmAsync(
  title: string,
  message: string,
  options?: { danger?: boolean; confirmText?: string; cancelText?: string }
): Promise<boolean> {
  return new Promise((resolve) => {
    useDialog.getState().show({
      type: options?.danger ? 'danger' : 'confirm',
      title,
      message,
      confirmText: options?.confirmText || (options?.danger ? 'حذف کن' : 'تأیید'),
      cancelText: options?.cancelText || 'لغو',
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false)
    });
  });
}
