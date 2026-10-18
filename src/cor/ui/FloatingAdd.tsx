/**
 * FloatingAdd — دکمه‌ی شناور دایره‌ای افزودن
 *
 * سه حالت:
 *   ۱. مخفی (config === null یا hidden)
 *   ۲. ثابت (wakeMode !== true)
 *   ۳. Wake (wakeMode === true): FAB ابتدا دیده می‌شه، با اسکرول تایمر ۳ث فعال و بعد از سکون محو می‌شه
 */
import { useEffect, useRef, useState } from 'react';
import { useFabStore } from './fabStore';

const HIDE_DELAY_MS = 3000;

export default function FloatingAdd() {
  const config = useFabStore(s => s.config);
  const [isHidden, setIsHidden] = useState(false);
  const hasScrolled = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wakeMode = config?.wakeMode === true;

  // با هر تغییر wakeMode، ریست کن
  useEffect(() => {
    hasScrolled.current = false;
    setIsHidden(false);
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, [wakeMode]);

  // wake: اسکرول/لمس → ظاهر + تایمر → محو
  useEffect(() => {
    if (!wakeMode) return;

    const scheduleHide = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setIsHidden(true), HIDE_DELAY_MS);
    };

    const onScroll = () => {
      hasScrolled.current = true;
      setIsHidden(false);
      scheduleHide();
    };

    const onTouch = () => {
      if (!hasScrolled.current) return;
      setIsHidden(false);
      scheduleHide();
    };

    document.addEventListener('scroll', onScroll, { capture: true, passive: true } as any);
    document.addEventListener('touchstart', onTouch, { passive: true });
    document.addEventListener('touchmove', onTouch, { passive: true });

    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true } as any);
      document.removeEventListener('touchstart', onTouch);
      document.removeEventListener('touchmove', onTouch);
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [wakeMode]);

  if (!config || config.hidden) return null;

  const wakeStyle: React.CSSProperties = wakeMode
    ? {
        opacity: isHidden ? 0 : 1,
        transform: isHidden ? 'translateY(120px) scale(0.85)' : 'translateY(0) scale(1)',
        transition: 'transform .3s cubic-bezier(.4,0,.2,1), opacity .3s cubic-bezier(.4,0,.2,1)',
        pointerEvents: isHidden ? 'none' : 'auto',
      }
    : {};

  return (
    <>
      <style>{`
        .floating-add:not([data-hidden="true"]):active {
          transform: scale(0.92) !important;
        }
      `}</style>
      <button
        type="button"
        className="floating-add"
        data-hidden={isHidden ? 'true' : 'false'}
        onClick={config.onClick}
        aria-label={config.label}
        title={config.label}
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)',
          left: 16,
          zIndex: 50,
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--accent)',
          color: 'var(--avatar-text, #fff)',
          border: 'none',
          borderRadius: '50%',
          fontFamily: 'inherit',
          fontSize: 28,
          fontWeight: 400,
          lineHeight: 1,
          cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14)',
          transition: 'transform .15s, box-shadow .15s',
          padding: 0,
          boxSizing: 'border-box',
          paddingBottom: 2,
          ...wakeStyle,
        }}
      >
        +
      </button>
    </>
  );
}
