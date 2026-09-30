/**
 * useAutoLock.ts — قفل خودکار بعد از بی‌کاری
 */
import { useEffect, useRef, useState } from 'react';
import { useSet } from '../../mod/set/store';

export function useAutoLock() {
  const pinEnabled = useSet(s => s.security?.pinEnabled);
  const pin = useSet(s => s.security?.pin);
  const autoLockMin = useSet(s => s.security?.autoLockMin) || 5;

  const [locked, setLocked] = useState(false);
  const lastActivity = useRef(Date.now());

  const shouldLock = !!(pinEnabled && pin && pin.length === 4);

  useEffect(() => {
    if (!shouldLock) { setLocked(false); return; }

    const onActivity = () => { lastActivity.current = Date.now(); };
    const events: (keyof DocumentEventMap)[] = ['touchstart','click','keydown','scroll','mousemove'];
    events.forEach(e => document.addEventListener(e, onActivity, { passive: true }));

    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current >= autoLockMin * 60_000) setLocked(true);
    }, 30_000);

    return () => {
      events.forEach(e => document.removeEventListener(e, onActivity));
      clearInterval(timer);
    };
  }, [shouldLock, autoLockMin]);

  useEffect(() => {
    if (!shouldLock) return;
    const onVis = () => { if (document.hidden) setLocked(true); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [shouldLock]);

  return { locked: locked && shouldLock, unlock: () => setLocked(false) };
}
