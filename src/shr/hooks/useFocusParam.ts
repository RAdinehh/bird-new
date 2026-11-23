/**
 * useFocusParam — خواندن ?focus=xxx از URL و برجسته‌سازی استاندارد کارت هدف
 *
 * رفتار:
 *   - مقدار focus رو از URL می‌خونه
 *   - ارتفاع واقعی هدر و کادر راهنمای بالای تب (HelpBanner) رو محاسبه می‌کنه تا کارت زیر راهنما نمونه
 *   - بررسی می‌کنه آیا کانتینر واقعی اسکرول‌شونده وجود داره و کارت خارج از دید هست یا نه؛ در صفحات بدون اسکرول هیچ جابه‌جایی انجام نمی‌ده
 *   - کلاس .pm-entity-focused رو روی کارت اعمال می‌کنه بدون باز کردن کارت
 *   - بعد از اتمام، focus از URL پاک می‌شه
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function findScrollableAncestor(el: Element): HTMLElement | null {
  let curr = el.parentElement;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    const style = window.getComputedStyle(curr);
    const overflowY = style.overflowY;
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      curr.scrollHeight > curr.clientHeight + 4
    ) {
      return curr;
    }
    curr = curr.parentElement;
  }
  const docEl = document.scrollingElement || document.documentElement;
  if (docEl && docEl.scrollHeight > docEl.clientHeight + 4) {
    return docEl as HTMLElement;
  }
  return null;
}

function getTopObstructionBottom(targetEl: Element): number {
  let maxBottom = 64; // حداقل ارتفاع هدر پیش‌فرض

  // ۱. هدر ثابت بالای صفحه و نوار تب‌ها
  const topBars = document.querySelectorAll('header, [role="tablist"]');
  topBars.forEach((bar) => {
    const r = bar.getBoundingClientRect();
    if (r.height > 0 && r.top >= -4 && r.top < 160 && r.bottom > maxBottom) {
      maxBottom = r.bottom;
    }
  });

  // ۲. کادر راهنمای بالای تب (اگر داخل پنل/صفحه فعال باز باشد)
  const panelRoot = targetEl.closest('[data-tab-panel]') || targetEl.parentElement?.parentElement || document;
  const banners = panelRoot.querySelectorAll('[data-help-banner], .pm-help-banner, [role="region"][aria-label*="راهنما"]');
  banners.forEach((banner) => {
    const r = banner.getBoundingClientRect();
    // فقط بنرهایی که بالای کارت هدف و در نیمه بالایی صفحه هستند را لحاظ کن
    if (r.height > 0 && r.top >= 0 && r.top < 260 && r.bottom > maxBottom) {
      maxBottom = r.bottom;
    }
  });

  return maxBottom + 12;
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
        const scrollContainer = findScrollableAncestor(targetEl);
        if (scrollContainer) {
          const rect = targetEl.getBoundingClientRect();
          const vh = window.innerHeight || document.documentElement.clientHeight;
          const topSafe = getTopObstructionBottom(targetEl);
          const bottomSafe = vh - 24;

          if (rect.top < topSafe) {
            const delta = rect.top - topSafe;
            scrollContainer.scrollBy({ top: delta, behavior: 'smooth' });
          } else if (rect.bottom > bottomSafe) {
            const delta = rect.bottom - bottomSafe;
            scrollContainer.scrollBy({ top: delta, behavior: 'smooth' });
          }
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
