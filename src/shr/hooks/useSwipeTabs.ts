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
    if (!root) {
      console.log('[swipe] NO ROOT REF');
      return;
    }
    console.log('[swipe] mounted, root:', root);

    let startX = 0, startY = 0, startT = 0;
    let activeTouch = false;
    let locked: 'none' | 'h' | 'v' = 'none';

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const tgt = e.target as HTMLElement;
      if (tgt.closest('[role="dialog"]')) {
        console.log('[swipe] SKIP: inside dialog');
        return;
      }
      const inside = root.contains(tgt);
      console.log('[swipe] start. target:', tgt.tagName, tgt.className || '', 'insideRoot:', inside);
      if (!inside) return;
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
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          locked = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'h' : 'v';
          console.log('[swipe] locked:', locked, 'dx:', dx, 'dy:', dy);
        }
      }
      if (locked === 'h' && e.cancelable) {
        e.preventDefault();
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!activeTouch) return;
      activeTouch = false;
      const wasH = locked === 'h';
      const oldLocked = locked;
      locked = 'none';
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dt = Math.max(1, Date.now() - startT);
      const v = Math.abs(dx) / dt;
      console.log('[swipe] end. wasH:', wasH, 'lock:', oldLocked, 'dx:', dx, 'v:', v.toFixed(2));

      if (!wasH) return;

      const o = optsRef.current || {};
      const threshold = o.threshold ?? 35;
      const velocity = o.velocity ?? 0.2;
      const edgeGuard = o.edgeGuard ?? 15;

      if (!(Math.abs(dx) > threshold || v > velocity)) {
        console.log('[swipe] NOT passed: dx=', dx, 'v=', v);
        return;
      }
      if (startX < edgeGuard || startX > window.innerWidth - edgeGuard) {
        console.log('[swipe] edge guard');
        return;
      }

      const idsArr = idsRef.current;
      const idx = idsArr.indexOf(activeRef.current);
      console.log('[swipe] idx:', idx, 'ids:', idsArr, 'active:', activeRef.current);
      if (idx < 0) return;
      const nextIdx = dx < 0 ? idx + 1 : idx - 1;
      console.log('[swipe] nextIdx:', nextIdx);
      if (nextIdx < 0 || nextIdx >= idsArr.length) {
        console.log('[swipe] out of bounds');
        return;
      }
      console.log('[swipe] CHANGING to:', idsArr[nextIdx]);
      onChangeRef.current(idsArr[nextIdx]);
    };

    const onCancel = () => {
      console.log('[swipe] cancel');
      activeTouch = false;
      locked = 'none';
    };

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
