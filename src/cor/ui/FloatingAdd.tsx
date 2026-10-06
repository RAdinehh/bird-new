/**
 * FloatingAdd — دکمه‌ی شناور دایره‌ای افزودن
 *
 * توی Layout رندر می‌شه. بالای BottomNav.
 * اگه ماژول useFab ثبت کرده باشه، نشون داده می‌شه.
 */
import { useFabStore } from './fabStore';

export default function FloatingAdd() {
  const config = useFabStore(s => s.config);

  if (!config || config.hidden) return null;

  return (
    <button
      type="button"
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
      }}
      onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
      onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      +
    </button>
  );
}
