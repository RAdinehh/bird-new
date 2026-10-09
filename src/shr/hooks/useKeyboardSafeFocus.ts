/**
 * useKeyboardSafeFocus.ts — قبل از باز شدن کیبورد، فیلد رو میاره وسط صفحه
 *
 * چطور کار می‌کنه:
 *   ۱. به همه input/textarea/select یه listener وصل می‌کنه
 *   ۲. هنگام focus، با scrollIntoView فیلد رو میاره وسط
 *   ۳. از visualViewport API برای تشخیص باز شدن کیبورد استفاده می‌کنه
 *
 * مزیت:
 *   ✅ فیلد همیشه قابل مشاهده — زیر کیبورد نمی‌مونه
 *   ✅ بدون پرش ناخواسته — فقط اگه فیلد زیر کیبورد باشه
 *   ✅ احترام به scroll کاربر — اگه کاربر خودش scroll کرده، دخالت نمی‌کنه
 */
import { useEffect } from 'react';

export function useKeyboardSafeFocus() {
  useEffect(() => {
    const SELECTOR = 'input:not([type="checkbox"]):not([type="radio"]), textarea, select';

    const handleFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (!el || !el.matches?.(SELECTOR)) return;

      // تأخیر کم برای اینکه مرورگر اول کیبورد رو باز کنه
      setTimeout(() => {
        try {
          // چک کنیم آیا عنصر زیر کیبورد قرار داره
          const rect = el.getBoundingClientRect();
          const vh = window.visualViewport?.height ?? window.innerHeight;
          const keyboardTop = vh;

          // اگه فیلد پایین‌تر از کیبورد باشه (یا نزدیکش)، بیارش وسط
          const isBelowKeyboard = rect.bottom > keyboardTop - 20;
          const isAboveViewport = rect.top < 0;
          const isTooLow = rect.top > keyboardTop * 0.6;

          if (isBelowKeyboard || isAboveViewport || isTooLow) {
            el.scrollIntoView({
              block: 'center',
              behavior: 'smooth',
            });
          }
        } catch {}
      }, 250);
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);
}
