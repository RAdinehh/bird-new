/**
 * useFocusParam — خواندن ?focus=xxx از URL و برجسته‌سازی استاندارد کارت هدف
 *
 * رفتار:
 *   - مقدار focus رو از URL می‌خونه
 *   - به صورت نرم به element با [data-focus-id="xxx"] اسکرول می‌کنه
 *   - کلاس .pm-entity-focused (حاشیه + پالس استاندارد) رو به مدت ۳.۲ ثانیه روی کارت اعمال می‌کنه
 *   - بدون باز کردن کارت (کارت در حالت بسته باقی می‌مونه)
 *   - بعد از اتمام، focus از URL پاک می‌شه تا در رفرش بعدی تکرار نشه
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useFocusParam(autoClear = true): string | null {
  const [params, setParams] = useSearchParams();
  const focusId = params.get('focus');

  useEffect(() => {
    if (!focusId) return;

    let targetEl: Element | null = null;

    const t1 = setTimeout(() => {
      targetEl = document.querySelector(`[data-focus-id="${focusId}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.remove('pm-entity-focused');
        void (targetEl as HTMLElement).offsetWidth;
        targetEl.classList.add('pm-entity-focused');
      }
    }, 180);

    const t2 = setTimeout(() => {
      if (targetEl) {
        targetEl.classList.remove('pm-entity-focused');
      }
      if (autoClear) {
        setParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete('focus');
            return next;
          },
          { replace: true },
        );
      }
    }, 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (targetEl) {
        targetEl.classList.remove('pm-entity-focused');
      }
    };
  }, [focusId, autoClear, setParams]);

  return focusId;
}
