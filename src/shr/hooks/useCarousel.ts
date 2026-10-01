import { useEffect, useRef, useCallback } from 'react';

/**
 * useCarousel v2 — transform-based swipe
 * - listener ها فقط یک بار bind میشن (باگ «گاهی میره گاهی نمیره» حل)
 * - refs برای active/ids/onChange (بدون re-bind)
 * - translate3d (GPU accelerated)
 */

/** بررسی می‌کنه که آیا عنصر یا والدینش اسکرول افقی داره */
function hasHorizontalScroller(el: HTMLElement | null, container: HTMLElement): boolean {
  let cur: HTMLElement | null = el;
  while (cur && cur !== container) {
    const style = window.getComputedStyle(cur);
    const ox = style.overflowX;
    if ((ox === 'auto' || ox === 'scroll') && cur.scrollWidth > cur.clientWidth + 4) {
      return true;
    }
    cur = cur.parentElement;
  }
  return false;
}

export function useCarousel(
  ids: string[],
  active: string,
  onChange: (id: string) => void
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const idsRef = useRef(ids);
  const activeRef = useRef(active);
  const onChangeRef = useRef(onChange);
  idsRef.current = ids;
  activeRef.current = active;
  onChangeRef.current = onChange;

  const wRef = useRef(0);
  const txRef = useRef(0);
  const clickToRef = useRef(false);

  const apply = useCallback((tx: number, animate: boolean) => {
    const tr = trackRef.current;
    if (!tr) return;
    tr.style.transition = animate
      ? 'transform 200ms cubic-bezier(.25,.8,.3,1)'
      : 'none';
    tr.style.transform = `translate3d(${tx}px, 0, 0)`;
    txRef.current = tx;
  }, []);

  // measure container + resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const changed = wRef.current !== w;
      wRef.current = w;
      if (changed) {
        const i = idsRef.current.indexOf(activeRef.current);
        if (i >= 0) apply(-i * w, false);
      }
    };
    measure();
    const t1 = setTimeout(measure, 60);
    const t2 = setTimeout(measure, 300);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { clearTimeout(t1); clearTimeout(t2); ro.disconnect(); };
  }, [apply]);

  // sync on active change
  useEffect(() => {
    const i = idsRef.current.indexOf(active);
    if (i < 0) return;
    const w = wRef.current;
    if (w <= 0) return;
    const target = -i * w;
    const isClick = clickToRef.current;
    clickToRef.current = false;
    if (Math.abs(txRef.current - target) < 1 && !isClick) return;
    apply(target, !isClick);
  }, [active, apply]);

  // listeners — یک بار bind، بدون deps به active/ids
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let dragging = false;
    let startX = 0;
    let startTx = 0;
    let startT = 0;
    let lastTx = 0;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const tgt = e.target as HTMLElement;
      if (tgt.closest('[role="dialog"]')) return;
      // اگه لمس داخل یه اسکرول افقی بود، carousel رو فعال نکن
      if (hasHorizontalScroller(tgt, el)) return;
      const t = e.touches[0];
      dragging = true;
      startX = t.clientX;
      startTx = txRef.current;
      lastTx = startTx;
      startT = Date.now();
      if (trackRef.current) trackRef.current.style.transition = 'none';
    };

    const onMove = (e: TouchEvent) => {
      if (!dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const w = wRef.current || el.clientWidth;
      if (w <= 0) return;
      const min = -(idsRef.current.length - 1) * w;
      let tx = startTx + dx;
      if (tx > 0) tx *= 0.35;
      else if (tx < min) tx = min + (tx - min) * 0.35;
      lastTx = tx;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${tx}px, 0, 0)`;
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!dragging) return;
      dragging = false;
      const w = wRef.current || el.clientWidth;
      if (w <= 0) return;
      const len = idsRef.current.length;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dt = Math.max(1, Date.now() - startT);
      const v = dx / dt;
      const startIdx = Math.round(-startTx / w);
      let idx = startIdx;
      if (v < -0.35) idx = startIdx + 1;
      else if (v > 0.35) idx = startIdx - 1;
      else idx = Math.round(-lastTx / w);
      idx = Math.max(0, Math.min(len - 1, idx));
      apply(-idx * w, true);
      const newId = idsRef.current[idx];
      if (newId !== activeRef.current) {
        onChangeRef.current(newId);
      }
    };

    const onCancel = () => { dragging = false; };

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
  }, [apply]);

  const setInstant = useCallback(() => { clickToRef.current = true; }, []);

  return { containerRef, trackRef, setInstant };
}
