/**
 * useTabBadge — نشانگر «آیتم جدید» روی Tab (۵ ثانیه)
 */
import { useState, useRef, useEffect } from 'react';
import type { TabId } from '../types-flocks';

export function useTabBadge() {
  const [badge, setBadge] = useState<TabId | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const trigger = (tabId: TabId) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setBadge(null);
    setTimeout(() => setBadge(tabId), 60);
    timerRef.current = window.setTimeout(() => setBadge(null), 5000);
  };

  return { badge, trigger };
}
