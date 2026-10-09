/**
 * useFocusParam — خواندن ?focus=xxx از URL
 *
 * استفاده:
 *   const focusId = useFocusParam();
 *   useEffect(() => {
 *     if (focusId) setExpandedId(focusId);
 *   }, [focusId]);
 *
 * رفتار:
 *   - مقدار focus رو از URL می‌خونه
 *   - بعد از ۳ ثانیه خودکار از URL پاک می‌شه (تا رفرش بعدی باز نشه)
 *   - scroll خودکار به element با data-focus-id
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useFocusParam(autoClear = true): string | null {
  const [params, setParams] = useSearchParams();
  const focusId = params.get('focus');

  useEffect(() => {
    if (!focusId) return;

    // scroll به element بعد از رندر
    const t1 = setTimeout(() => {
      const el = document.querySelector(`[data-focus-id="${focusId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    // پاک کردن focus از URL بعد از ۳ ثانیه
    let t2: ReturnType<typeof setTimeout> | undefined;
    if (autoClear) {
      t2 = setTimeout(() => {
        setParams(prev => {
          const next = new URLSearchParams(prev);
          next.delete('focus');
          return next;
        }, { replace: true });
      }, 3000);
    }

    return () => {
      clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [focusId, autoClear, setParams]);

  return focusId;
}
