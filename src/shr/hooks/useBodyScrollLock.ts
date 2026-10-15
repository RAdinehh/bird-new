/**
 * useBodyScrollLock — قفل اسکرول بدن وقتی هر مودالی بازه
 * استفاده: useBodyScrollLock(anyOpen)
 *
 * روش ساده و امن: فقط overflow: hidden روی html/body
 * (بدون position:fixed که layout shift ایجاد می‌کنه)
 */
import { useEffect } from 'react';

export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [locked]);
}
