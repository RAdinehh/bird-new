import { useEffect, useRef } from 'react';

/**
 * useSwipeTabs — swipe چپ/راست بین تب‌ها روی موبایل
 *
 * @param ids        آرایه id تب‌ها به ترتیب نمایش
 * @param active     تب فعال فعلی
 * @param onChange   callback وقتی swipe کامل شد
 * @param opts       تنظیمات (اختیاری)
 */
export function useSwipeTabs(
  ids: string[],
  active: string,
  onChange: (id: string) => void,
  opts?: { threshold?: number; velocity?: number; edgeGuard?: number }
) {
  const ref = useRef<HTMLDivElement>(null);
  const threshold = opts?.threshold ?? 70;
  const velocity = opts?.velocity ?? 0.5;
  const edgeGuard = opts?.edgeGuard ?? 40;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let activeTouch = false;
    let locked: 'none' | 'h' | 'v' = 'none';

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startT = Date.now();
      activeTouch = true;
      locked = 'none';
    };

    const onMove = (e: TouchEvent) => {
      if (!activeTouch) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (locked === 'none') {
        if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
          locked = Math.abs(dx) > Math.abs(dy) * 1.3 ? 'h' : 'v';
        }
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!activeTouch) return;
      activeTouch = false;
      if (locked !== 'h') { locked = 'none'; return; }

      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dt = Math.max(1, Date.now() - startT);
      const v = Math.abs(dx) / dt;
      const passed = Math.abs(dx) > threshold || v > velocity;
      if (!passed) { locked = 'none'; return; }

      // edge guard: نگیر اگه انگشت از لبه شروع کرده (نزدیک به back gesture)
      if (startX < edgeGuard || startX > window.innerWidth - edgeGuard) {
        locked = 'none';
        return;
      }

      const idx = ids.indexOf(active);
      if (idx < 0) { locked = 'none'; return; }

      // RTL: swipe راست (dx>0) = قبلی، swipe چپ (dx<0) = بعدی
      // چون فارسی RTL است
      let nextIdx = idx;
      if (dx > 0) nextIdx = idx + 1;  // فینگر به راست → برو به تب بعد (سمت چپ بصری)
      else nextIdx = idx - 1;

      if (nextIdx < 0 || nextIdx >= ids.length) { locked = 'none'; return; }
      onChange(ids[nextIdx]);
      locked = 'none';
    };

    const onCancel = () => { activeTouch = false; locked = 'none'; };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onCancel, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onCancel);
    };
  }, [ids, active, onChange, threshold, velocity, edgeGuard]);

  return ref;
}
