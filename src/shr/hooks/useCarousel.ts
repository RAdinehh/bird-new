import { useEffect, useRef } from 'react';

/**
 * useCarousel — swipe افقی بدون scroll، فقط transform
 * 100% مستقل از RTL / مرورگر
 */
export function useCarousel(
  ids: string[],
  active: string,
  onChange: (id: string) => void
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const clickToRef = useRef(false);

  const st = useRef({
    w: 0,
    tx: 0,
    dragging: false,
    startX: 0,
    startTx: 0,
    t0: 0,
  });

  const apply = (tx: number, animate: boolean) => {
    const tr = trackRef.current;
    if (!tr) return;
    tr.style.transition = animate ? 'transform 260ms cubic-bezier(.22,.61,.36,1)' : 'none';
    tr.style.transform = `translate3d(${tx}px,0,0)`;
  };

  // measure + apply on mount / resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      st.current.w = w;
      const i = ids.indexOf(active);
      if (i >= 0) {
        st.current.tx = -i * w;
        apply(st.current.tx, false);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);  // eslint-disable-line

  // active change (tab click or swipe end)
  useEffect(() => {
    const i = ids.indexOf(active);
    if (i < 0) return;
    const w = st.current.w || containerRef.current?.clientWidth || 0;
    if (!w) return;
    const target = -i * w;
    if (Math.abs(st.current.tx - target) < 1 && !clickToRef.current) return;
    st.current.tx = target;
    apply(target, !clickToRef.current);
    clickToRef.current = false;
  }, [active, ids.join(',')]);  // eslint-disable-line

  // touch handlers
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const s = st.current;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const tgt = e.target as HTMLElement;
      if (tgt.closest('[role="dialog"]')) return;
      const t = e.touches[0];
      s.startX = t.clientX;
      s.startTx = s.tx;
      s.t0 = Date.now();
      s.dragging = true;
      if (trackRef.current) trackRef.current.style.transition = 'none';
    };

    const onMove = (e: TouchEvent) => {
      if (!s.dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - s.startX;
      let tx = s.startTx + dx;
      const min = -(ids.length - 1) * s.w;
      if (tx > 0) tx *= 0.35;
      else if (tx < min) tx = min + (tx - min) * 0.35;
      s.tx = tx;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${tx}px,0,0)`;
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!s.dragging) return;
      s.dragging = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.startX;
      const dt = Math.max(1, Date.now() - s.t0);
      const v = dx / dt;
      const startIdx = Math.round(-s.startTx / s.w);
      let idx = Math.round(-s.tx / s.w);
      if (Math.abs(v) > 0.35) {
        idx = v < 0 ? startIdx + 1 : startIdx - 1;
      }
      idx = Math.max(0, Math.min(ids.length - 1, idx));
      const target = -idx * s.w;
      s.tx = target;
      apply(target, true);
      if (ids[idx] !== active) onChange(ids[idx]);
    };

    const onCancel = () => { s.dragging = false; };

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
  }, [ids.join(','), active]);  // eslint-disable-line

  const setInstant = () => { clickToRef.current = true; };

  return { containerRef, trackRef, setInstant };
}
