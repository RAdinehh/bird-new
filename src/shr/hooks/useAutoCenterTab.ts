import { useEffect, useRef } from 'react';

export function useAutoCenterTab(activeTab: string) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const el = bar.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement | null;
    if (!el) return;
    const barRect = bar.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset = (elRect.left + elRect.width / 2) - (barRect.left + barRect.width / 2);
    if (Math.abs(offset) > 2) {
      bar.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }, [activeTab]);

  return barRef;
}
