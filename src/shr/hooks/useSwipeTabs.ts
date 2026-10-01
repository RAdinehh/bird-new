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

    // ─── on-screen debug panel ───
    const dbg = document.createElement('div');
    dbg.id = 'swipe-debug';
    dbg.style.cssText = [
      'position:fixed','top:0','left:0','right:0',
      'background:rgba(0,0,0,.85)','color:#0f0',
      'font-size:11px','padding:4px 6px','z-index:99999',
      'font-family:monospace','direction:ltr','text-align:left',
      'pointer-events:none','white-space:pre-wrap','max-height:40vh','overflow:hidden',
    ].join(';');
    dbg.textContent = '[swipe] mounted. ready.';
    document.body.appendChild(dbg);

    const log = (s: string) => {
      dbg.textContent = s;
    };

    let startX = 0, startY = 0, startT = 0;
    let activeTouch = false;
    let locked: 'none' | 'h' | 'v' = 'none';

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const tgt = e.target as HTMLElement;
      if (tgt.closest('[role="dialog"]')) { log('start: DIALOG (skip)'); return; }
      const inside = root.contains(tgt);
      log(`start: <${tgt.tagName.toLowerCase()}> inside=${inside}`);
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
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          locked = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'h' : 'v';
        }
      }
      if (locked === 'h' && e.cancelable) e.preventDefault();
      log(`move: dx=${dx.toFixed(0)} dy=${dy.toFixed(0)} lock=${locked}`);
    };

    const onEnd = (e: TouchEvent) => {
      if (!activeTouch) return;
      activeTouch = false;
      const wasH = locked === 'h';
      locked = 'none';
      if (!wasH) { log('end: was not H'); return; }
      const o = optsRef.current || {};
      const threshold = o.threshold ?? 35;
      const velocity = o.velocity ?? 0.2;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dt = Math.max(1, Date.now() - startT);
      const v = Math.abs(dx) / dt;
      if (!(Math.abs(dx) > threshold || v > velocity)) { log(`end: too small dx=${dx.toFixed(0)} v=${v.toFixed(2)}`); return; }
      const idsArr = idsRef.current;
      const idx = idsArr.indexOf(activeRef.current);
      const nextIdx = dx < 0 ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= idsArr.length) { log(`end: OOB idx=${idx} next=${nextIdx}`); return; }
      log(`end: CHANGING ${idsArr[idx]} → ${idsArr[nextIdx]}`);
      onChangeRef.current(idsArr[nextIdx]);
    };

    const onCancel = () => { activeTouch = false; locked = 'none'; log('cancel'); };

    document.addEventListener('touchstart', onStart, { passive: true, capture: true });
    document.addEventListener('touchmove', onMove, { passive: false, capture: true });
    document.addEventListener('touchend', onEnd, { passive: true, capture: true });
    document.addEventListener('touchcancel', onCancel, { passive: true, capture: true });
    return () => {
      document.removeEventListener('touchstart', onStart, { capture: true } as any);
      document.removeEventListener('touchmove', onMove, { capture: true } as any);
      document.removeEventListener('touchend', onEnd, { capture: true } as any);
      document.removeEventListener('touchcancel', onCancel, { capture: true } as any);
      dbg.remove();
    };
  }, []);

  return ref;
}
