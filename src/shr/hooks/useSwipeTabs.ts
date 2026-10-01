import { useEffect, useRef } from 'react';

/**
 * useSwipeTabs — swipe چپ/راست بین تب‌ها روی موبایل
 * نسخه v2: بدون re-bind، بدون re-render
 */
export function useSwipeTabs(
  ids: string[],
  active: string,
  onChange: (id: string) => void,
  opts?: { threshold?: number; velocity?: number; edgeGuard?: number }
) {
  const ref = useRef<HTMLDivElement>(null);
  const idsRef = useRef(ids);
  const activeRef = useRef(active);
  const onChangeRef = useRef(onChange);
  const optsRef = useRef(opts);

  // update refs بدون re-bind
  idsRef.current = ids;
  activeRef.current = active;
  onChangeRef.current = onChange;
  optsRef.current = opts;

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
      const threshold = o.threshold ?? 45;
      const velocity = o.velocity ?? 0.35;
      const edgeGuard = o.edgeGuard ?? 24;

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

      // RTL: swipe راست (dx>0) = قبلی، swipe چپ (dx<0) = بعدی
      let nextIdx = idx;
      if (dx > 0) nextIdx = idx + 1;
      else nextIdx = idx - 1;

      if (nextIdx < 0 || nextIdx >= idsArr.length) { locked = 'none'; return; }
      onChangeRef.current(idsArr[nextIdx]);
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
  }, []);  // ← بدون dependency → یک بار bind

  return ref;
}
