import { useEffect, useRef } from 'react';

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
    const root = ref.current;
    if (!root) return;

    let startX = 0, startY = 0, startT = 0;
    let activeTouch = false;
    let locked: 'none' | 'h' | 'v' = 'none';

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const tgt = e.target as HTMLElement;
      if (tgt.closest('[role="dialog"]')) { activeTouch = false; return; }
      // اگه داخل swipe root نبود، ignore
      if (!root.contains(tgt)) { activeTouch = false; return; }
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
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          locked = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'h' : 'v';
        }
      }
      if (locked === 'h' && e.cancelable) e.preventDefault();
    };

    const onEnd = (e: TouchEvent) => {
      if (!activeTouch) return;
      activeTouch = false;
      const wasH = locked === 'h';
      locked = 'none';
      if (!wasH) return;

      const o = optsRef.current || {};
      const threshold = o.threshold ?? 45;
      const velocity = o.velocity ?? 0.3;
      const edgeGuard = o.edgeGuard ?? 20;

      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dt = Math.max(1, Date.now() - startT);
      const v = Math.abs(dx) / dt;
      if (!(Math.abs(dx) > threshold || v > velocity)) return;
      if (startX < edgeGuard || startX > window.innerWidth - edgeGuard) return;

      const idsArr = idsRef.current;
      const idx = idsArr.indexOf(activeRef.current);
      if (idx < 0) return;
      // RTL: swipe راست (dx>0) = tab بعدی
      const nextIdx = dx > 0 ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= idsArr.length) return;
      onChangeRef.current(idsArr[nextIdx]);
    };

    const onCancel = () => { activeTouch = false; locked = 'none'; };

    document.addEventListener('touchstart', onStart, { passive: true, capture: true });
    document.addEventListener('touchmove', onMove, { passive: false, capture: true });
    document.addEventListener('touchend', onEnd, { passive: true, capture: true });
    document.addEventListener('touchcancel', onCancel, { passive: true, capture: true });
    return () => {
      document.removeEventListener('touchstart', onStart, { capture: true } as any);
      document.removeEventListener('touchmove', onMove, { capture: true } as any);
      document.removeEventListener('touchend', onEnd, { capture: true } as any);
      document.removeEventListener('touchcancel', onCancel, { capture: true } as any);
    };
  }, []);

  return ref;
}
