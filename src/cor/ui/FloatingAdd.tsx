/**
 * FloatingAdd — دکمه‌ی شناور افزودن
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
      style={{
        position: 'fixed',
        bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 12px)',
        left: 16,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        background: 'var(--accent)',
        color: 'var(--avatar-text, #fff)',
        border: 'none',
        borderRadius: 24,
        fontFamily: 'inherit',
        fontSize: 'var(--fs-sm)',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.12)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '1.15em', lineHeight: 1 }}>{config.icon || '+'}</span>
      <span>{config.label}</span>
    </button>
  );
}
