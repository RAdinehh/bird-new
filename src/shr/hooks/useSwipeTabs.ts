import { useEffect, useRef } from 'react';

/**
 * useSwipeTabs — swipe چپ/راست بین تب‌ها روی موبایل
 * v5: ref-based + touch-action: pan-y روی کانتینر الزامی است
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

  idsRef.current = ids;
  activeRef.current = active;
  onChangeRef.current = onChange;
  optsRef.current = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0, startY = 0, startT = 0;
    let activeTouch = false;
    let locked: 'none' | 'h' | 'v' = 'none';

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const tgt = e.target as HTMLElement | null;
      if (tgt && tgt.closest('[role="dialog"]')) { activeTouch = false; return; }
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
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        locked = Math.abs(dx) > Math.abs(dy) * 1.5 ? 'h' : 'v';
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!activeTouch) return;
      const wasH = locked === 'h';
      activeTouch = false;
      locked = 'none';
      if (!wasH) return;

      const o = optsRef.current || {};
      const threshold = o.threshold ?? 55;
      const velocity = o.velocity ?? 0.35;
      const edgeGuard = o.edgeGuard ?? 30;

      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dt = Math.max(1, Date.now() - startT);
      const v = Math.abs(dx) / dt;
      if (!(Math.abs(dx) > threshold || v > velocity)) return;
      if (startX < edgeGuard || startX > window.innerWidth - edgeGuard) return;

      const idsArr = idsRef.current;
      const idx = idsArr.indexOf(activeRef.current);
      if (idx < 0) return;

      // swipe left (dx<0) → next (idx+1), swipe right (dx>0) → prev (idx-1)
      const nextIdx = dx < 0 ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= idsArr.length) return;

      onChangeRef.current(idsArr[nextIdx]);
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
  }, []);

  return ref;
}
