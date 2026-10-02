import { useEffect, useRef, useCallback } from 'react';

/**
 * useCarousel v3 — transform-based swipe با تشخیص جهت
 *
 * - listener ها یک بار bind میشن
 * - refs برای active/ids/onChange (بدون re-bind)
 * - translate3d (GPU accelerated)
 * - direction lock: عمودی = اسکرول عادی، افقی = swipe
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

    if (!animate) {
      tr.style.transition = 'none';
      tr.style.transform = `translate3d(${tx}px, 0, 0)`;
      void tr.offsetWidth;
      txRef.current = tx;
      return;
    }

    tr.style.transition = 'transform 260ms cubic-bezier(.25,.8,.3,1)';
    void tr.offsetWidth;
    requestAnimationFrame(() => {
      tr.style.transform = `translate3d(${tx}px, 0, 0)`;
    });
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

  // listeners — یک بار bind روی document.body
  // اینطوری مستقل از ارتفاع containerRef، swipe روی کل ویوپورت کار میکنه
  useEffect(() => {
    const el = document.body;
    if (!el) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startTx = 0;
    let startT = 0;
    let lastTx = 0;
    let direction: 'none' | 'h' | 'v' = 'none';

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const tgt = e.target as HTMLElement;
      if (tgt.closest('[role="dialog"]')) return;
      if (hasHorizontalScroller(tgt, el)) return;
      const t = e.touches[0];
      dragging = true;
      startX = t.clientX;
      startY = t.clientY;
      startTx = txRef.current;
      lastTx = startTx;
      startT = Date.now();
      direction = 'none';
      if (trackRef.current) trackRef.current.style.transition = 'none';
    };

    const onMove = (e: TouchEvent) => {
      if (!dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      // تشخیص جهت فقط یک بار
      if (direction === 'none') {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          // اگه حرکت عمودی غالب بود، carousel رو کنسل کن
          if (Math.abs(dy) > Math.abs(dx) * 1.3) {
            direction = 'v';
            dragging = false;
            // برگردون موقعیت قبلی
            if (trackRef.current) {
              trackRef.current.style.transform = `translate3d(${startTx}px, 0, 0)`;
              trackRef.current.style.transition = '';
            }
            return;
          }
          direction = 'h';
        } else {
          return;
        }
      }

      if (direction !== 'h') return;

      const w = wRef.current || containerRef.current?.clientWidth || 0;
      if (w <= 0) return;
      const min = -(idsRef.current.length - 1) * w;
      let tx = startTx + dx;
      if (tx > 0) tx *= 0.35;
      else if (tx < min) tx = min + (tx - min) * 0.35;
      lastTx = tx;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${tx}px, 0, 0)`;
      }
      // جلوگیری از اسکرول افقی صفحه در حین swipe
      if (e.cancelable) {
        try { e.preventDefault(); } catch { /* silent */ }
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!dragging) return;
      const wasH = direction === 'h';
      dragging = false;
      direction = 'none';
      if (!wasH) return;
      const w = wRef.current || containerRef.current?.clientWidth || 0;
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

    const onCancel = () => { dragging = false; direction = 'none'; };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
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
