/**
 * useFocusParam — خواندن ?focus=xxx از URL و برجسته‌سازی استاندارد کارت هدف
 *
 * رفتار:
 *   - مقدار focus رو از URL می‌خونه
 *   - بررسی می‌کنه آیا کارت خارج از دید (Viewport) هست یا نه؛ اگر همین الان در دید کاربر باشه (مثل صفحات کوتاه بدون اسکرول) هیچ اسکرولی انجام نمی‌ده تا چیدمان صفحه به هم نریزه
 *   - کلاس .pm-entity-focused رو روی کارت اعمال می‌کنه بدون باز کردن کارت
 *   - بعد از اتمام، focus از URL پاک می‌شه
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function isElementOutOfView(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const topSafe = 72; // فضای هدر ثابت بالای صفحه
  const bottomSafe = vh - 24;
  return rect.top < topSafe || rect.bottom > bottomSafe;
}

export function useFocusParam(autoClear = true): string | null {
  const [params, setParams] = useSearchParams();
  const focusId = params.get('focus');

  useEffect(() => {
    if (!focusId) return;

    let targetEl: Element | null = null;

    const t1 = setTimeout(() => {
      targetEl = document.querySelector(`[data-focus-id="${focusId}"]`);
      if (targetEl) {
        if (isElementOutOfView(targetEl)) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
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
    }, 3400);

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
