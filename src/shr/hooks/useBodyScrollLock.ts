/**
 * useBodyScrollLock — قفل اسکرول بدن وقتی هر مودالی بازه
 * استفاده: useBodyScrollLock(anyOpen)
 */
import { useEffect } from 'react';

export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      touch: body.style.touchAction,
      position: body.style.position,
      top: body.style.top,
    };
    const scrollY = window.scrollY;
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    return () => {
      body.style.overflow = prev.overflow;
      body.style.touchAction = prev.touch;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
