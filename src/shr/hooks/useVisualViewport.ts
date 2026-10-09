/**
 * useVisualViewport.ts — ارتفاع واقعی صفحه با در نظر گرفتن کیبورد
 *
 * چرا لازمه؟
 *   وقتی کیبورد باز می‌شه، window.innerHeight عوض نمی‌شه
 *   ولی visualViewport.height کوچک می‌شه.
 *   برای Sheet که باید روی کیبورد شناور بمونه، این مقدار لازمه.
 *
 * منابع:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API
 *   - https://web.dev/visual-viewport/
 */
import { useEffect, useState } from 'react';

export interface ViewportInfo {
  /** ارتفاع قابل مشاهده (بدون کیبورد) */
  height: number;
  /** فاصله از بالای صفحه تا شروع visible */
  offsetTop: number;
  /** فاصله از چپ */
  offsetLeft: number;
  /** عرض قابل مشاهده */
  width: number;
  /** آیا کیبورد بازه؟ */
  keyboardOpen: boolean;
  /** ارتفاع تقریبی کیبورد */
  keyboardHeight: number;
}

export function useVisualViewport(): ViewportInfo {
  const get = (): ViewportInfo => {
    if (typeof window === 'undefined') {
      return { height: 0, offsetTop: 0, offsetLeft: 0, width: 0, keyboardOpen: false, keyboardHeight: 0 };
    }
    const vv = window.visualViewport;
    const wH = window.innerHeight;
    const vH = vv?.height ?? wH;
    const vTop = vv?.offsetTop ?? 0;
    const vLeft = vv?.offsetLeft ?? 0;
    const vW = vv?.width ?? window.innerWidth;
    // تخمین ارتفاع کیبورد: تفاوت بین دو ارتفاع
    const kbH = Math.max(0, wH - vH - vTop);
    const kbOpen = kbH > 120; // آستانه — معمولاً کیبورد موبایل > 150px
    return {
      height: vH,
      offsetTop: vTop,
      offsetLeft: vLeft,
      width: vW,
      keyboardOpen: kbOpen,
      keyboardHeight: kbOpen ? kbH : 0,
    };
  };

  const [info, setInfo] = useState<ViewportInfo>(get);

  useEffect(() => {
    const update = () => setInfo(get());
    const vv = window.visualViewport;
    update();
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }
    window.addEventListener('resize', update);
    return () => {
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
      window.removeEventListener('resize', update);
    };
  }, []);

  return info;
}
