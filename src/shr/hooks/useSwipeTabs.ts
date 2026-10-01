import { useEffect, useRef } from 'react';
import { startTransition } from 'react';

/**
 * useSwipeTabs — swipe چپ/راست بین تب‌ها
 * v3: attach to document (universal) + startTransition (non-blocking)
 */
export function useSwipeTabs(
  ids: string[],
  active: string,
  onChange: (id: string) => void,
  opts?: { threshold?: number; velocity?: number; edgeGuard?: number }
) {
  const idsRef = useRef(ids);
  const activeRef = useRef(active);
  const onChangeRef = useRef(onChange);
  const optsRef = useRef(opts);

  idsRef.current = ids;
  activeRef.current = active;
  onChangeRef.current = onChange;
  optsRef.current = opts;

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let activeTouch = false;
    let locked: 'none' | 'h' | 'v' = 'none';

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      // ignore if touch started inside an open modal/sheet
      const tgt = e.target as HTMLElement | null;
      if (tgt && tgt.closest('[role="dialog"], [data-sheet]')) {
        activeTouch = false;
        return;
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startT = Date.now();
      activeTouch = true;
      locked = 'none';
    };

    const onMove = (e: TouchEvent) => {
      if (!activeTouch || locked !== 'none') return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        locked = Math.abs(dx) > Math.abs(dy) * 1.6 ? 'h' : 'v';
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!activeTouch) return;
      activeTouch = false;
      if (locked !== 'h') { locked = 'none'; return; }

      const o = optsRef.current || {};
      const threshold = o.threshold ?? 60;
      const velocity = o.velocity ?? 0.4;
      const edgeGuard = o.edgeGuard ?? 30;

      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dt = Math.max(1, Date.now() - startT);
      const v = Math.abs(dx) / dt;
      const passed = Math.abs(dx) > threshold || v > velocity;
      if (!passed) { locked = 'none'; return; }

      if (startX < edgeGuard || startX > window.innerWidth - edgeGuard) {
        locked = 'none';
        return;
      }

      const idsArr = idsRef.current;
      const idx = idsArr.indexOf(activeRef.current);
      if (idx < 0) { locked = 'none'; return; }

      // RTL: swipe راست = قبلی (idx+1)? با RTL flex row: index 0 راست است.
      // swipe راست (dx>0) کاربر به سمت index بعدی میره
      // => در RTL: برو به previous در آرایه؟ بستگی به چیدمان داره
      // تصمیم: swipe راست → index کم‌تر (به سمت راست آرایه)، swipe چپ → index بیشتر
      let nextIdx = idx;
      if (dx > 0) nextIdx = idx - 1;  // ← تغییر از نسخه قبل
      else nextIdx = idx + 1;

      if (nextIdx < 0 || nextIdx >= idsArr.length) { locked = 'none'; return; }

      startTransition(() => {
        onChangeRef.current(idsArr[nextIdx]);
      });
      locked = 'none';
    };

    const onCancel = () => { activeTouch = false; locked = 'none'; };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onCancel, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onCancel);
    };
  }, []);
}
