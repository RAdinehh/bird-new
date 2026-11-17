import type { ReactNode } from 'react';
import { Modal, Btn, BtnRow } from '../ui';

export interface HistoryModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** اگر تعریف شود، دکمه CSV در فوتر نمایش داده می‌شود */
  onExport?: () => void;
  /** اندازه مودال (پیش‌فرض: md) */
  size?: 'sm' | 'md' | 'lg';
  /** دکمه‌های اضافی که قبل از CSV و بستن قرار می‌گیرند */
  footerExtra?: ReactNode;
  /** محتوای اصلی تاریخچه */
  children: ReactNode;
}

/**
 * HistoryModalShell — پوسته مشترک برای تمام مودال‌های تاریخچه
 * استاندارد: یکسان‌سازی UI در تمام ماژول‌ها
 * طبق نقشه راه: docs/DATA-ARCHITECTURE.md — لایه ۶
 */
export function HistoryModalShell({
  open,
  onClose,
  title,
  onExport,
  size = 'md',
  footerExtra,
  children,
}: HistoryModalShellProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <BtnRow>
          {footerExtra}
          {onExport && <Btn onClick={onExport}>CSV</Btn>}
          <Btn onClick={onClose}>بستن</Btn>
        </BtnRow>
      }
    >
      {children}
    </Modal>
  );
}
