/**
 * SelectSheetShell.tsx — پوسته مشترک Bottom Sheet (استاندارد Bird-new)
 *
 * طبق Material 3 + Apple HIG + UI-RULES.md:
 *   - هدر RTL: عنوان | [+] [🔍] [✕]
 *   - دکمه افزودن: سبز ظریف (بدون پس‌زمینه)
 *   - اسکرول‌بار باریک ۴px (iOS-like)
 *   - اسکرول ایندیکیتور ۳ نقطه پالسی
 *   - Esc + کلیک بیرون + swipe-down
 *   - focus trap + aria-modal
 *   - فونت‌ها طبق توکن‌های نرم‌افزار
 *
 * استفاده:
 *   <SelectSheetShell
 *     open={open}
 *     onClose={onClose}
 *     title="انتخاب زیرنوع"
 *     subtitle="۴ مورد"
 *     onAdd={handleAdd}
 *     searchable={items.length > 5}
 *     searchNode={<SearchInput />}
 *   >
 *     <SheetGroup title="پیش‌فرض‌ها" icon="📦" count={4}>
 *       <SheetItem icon="🌀" title="فن تونلی" onClick={...} />
 *     </SheetGroup>
 *   </SelectSheetShell>
 */
import { getGlobalFormat } from '../units/useFormat';


import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconBadge, EquipmentIcon } from '../icons/equipment';

// ═══ آیکون‌ها ═══
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// ═══ اسکرول ایندیکیتور ═══
function ScrollIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', left: 6, top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 3,
        pointerEvents: 'none', opacity: 0.5, zIndex: 2,
      }}
    >
      <style>{`@keyframes sss-pulse { 0%,100% { opacity:.3 } 50% { opacity:1 } }`}</style>
      {[0, 0.2, 0.4].map(d => (
        <span key={d} style={{
          width: 3, height: 3, borderRadius: '50%',
          background: 'var(--muted)',
          animation: `sss-pulse 1.6s ease-in-out ${d}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ═══ Props ═══
interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** دکمه افزودن در هدر (اختیاری) */
  onAdd?: () => void;
  /** فعال‌سازی جستجو در هدر */
  searchable?: boolean;
  /** محتوای کادر جستجو */
  searchNode?: ReactNode;
  onSearchClear?: () => void;
  /** محتوای Sheet */
  children: ReactNode;
  /** فوتر اختیاری */
  footer?: ReactNode;
  placement?: 'bottom' | 'center';
  onClear?: () => void;
  clearLabel?: string;
  flush?: boolean;
}

// ═══ کامپوننت اصلی ═══
export default function SelectSheetShell({
  open, onClose, title, subtitle,
  onAdd, searchable = false, searchNode, onSearchClear, children, footer, placement = 'bottom', onClear, clearLabel = 'پاک کردن', flush = false,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const [dragY, setDragY] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => {
      const input = searchWrapRef.current?.querySelector<HTMLInputElement>('input');
      input?.focus();
      input?.scrollIntoView({ block: 'nearest' });
    }, 40);
    return () => clearTimeout(t);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen || !bodyRef.current) return;
    bodyRef.current.scrollTop = 0;
    checkScroll();
  }, [searchOpen, children]);
  const startY = useRef(0);

  // باز/بسته
  useEffect(() => {
    if (open) {
      setMounted(true);
      setSearchOpen(false);
      setTimeout(() => setAnimating(true), 20);
      setTimeout(checkScroll, 150);
    } else {
      setAnimating(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Esc + body lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  function checkScroll() {
    const b = bodyRef.current;
    if (!b) return;
    setShowIndicator(b.scrollHeight > b.clientHeight + 4);
  }

  // Swipe-down
  const onTS = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; setDragY(0); };
  const onTM = (e: React.TouchEvent) => {
    const d = Math.max(0, e.touches[0].clientY - startY.current);
    setDragY(d);
  };
  const onTE = () => { if (dragY > 100) onClose(); setDragY(0); };
  if (!mounted) return null;

  const sheet = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100dvh', zIndex: 10000,
        background: 'var(--overlay)',
        display: 'flex', alignItems: placement === 'center' ? 'center' : 'flex-end', justifyContent: 'center',
        padding: placement === 'center' ? '20px 18px' : 0,
        boxSizing: 'border-box',
        opacity: animating ? 1 : 0,
        transition: 'opacity .2s ease',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sss-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-solid)',
          borderRadius: placement === 'center' ? 'var(--r-lg, 14px)' : 'var(--r-lg, 16px) var(--r-lg, 16px) 0 0',
          width: '100%',
          maxWidth: placement === 'center' ? 440 : 540,
          maxHeight: placement === 'center' ? '72dvh' : '70dvh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          border: placement === 'center' ? '1px solid var(--border)' : 'none',
          boxShadow: placement === 'center' ? 'var(--shadow, 0 8px 24px rgba(15, 23, 42, 0.12))' : '0 -6px 24px rgba(0, 0, 0, 0.14)',
          transform: placement === 'center'
            ? (animating ? 'scale(1)' : 'scale(0.96)')
            : (animating ? `translateY(${dragY}px)` : 'translateY(100%)'),
          transition: placement === 'center'
            ? 'transform .2s cubic-bezier(.16,1,.3,1)'
            : (dragY === 0 ? 'transform .22s cubic-bezier(.16,1,.3,1)' : 'none'),
        }}
      >
        {/* Drag handle */}
        {placement !== 'center' && (
        <div
          onTouchStart={onTS}
          onTouchMove={onTM}
          onTouchEnd={onTE}
          style={{
            padding: '10px 0 6px',
            display: 'flex', justifyContent: 'center',
            flexShrink: 0, touchAction: 'none', cursor: 'grab',
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>
        )}

        <style>{`
  .sss-item { position: relative; border-bottom: none !important; }
  .sss-item:not(:last-child)::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 1px;
            background: color-mix(in srgb, var(--border) 38%, transparent);
            pointer-events: none;
          }
`}</style>
        {/* Header RTL */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid color-mix(in srgb, var(--border) 80%, transparent)',
    display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <div id="sss-title" style={{
              fontSize: 'var(--fs-lg, 16px)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{title}</div>
            {subtitle && (
              <div style={{
                fontSize: 'var(--fs-xs, 11.5px)', color: 'var(--muted)', fontWeight: 500, marginTop: 2,
              }}>{subtitle}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {onClear && (
              <button type="button" onClick={onClear} style={BTN_CLEAR}>
                {clearLabel}
              </button>
            )}
            {onAdd && (
              <button type="button" onClick={onAdd} aria-label="افزودن" style={BTN_ADD}>
                <IconPlus />
              </button>
            )}
            {searchable && (
              <button type="button" onClick={() => setSearchOpen(v => { const next = !v; if (!next) onSearchClear?.(); return next; })}
                aria-label="جستجو" aria-expanded={searchOpen} style={searchOpen ? BTN_SEARCH_ACTIVE : BTN_BASE}>
                <IconSearch />
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="بستن" style={BTN_BASE}>
              <IconClose />
            </button>
          </div>
        </div>

        {/* Search row */}
        {searchable && searchOpen && searchNode && (
          <div ref={searchWrapRef} style={{
            padding: '8px 10px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>{searchNode}</div>
        )}

        {/* Body + Indicator */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', minHeight: 0 }}>
          <ScrollIndicator visible={showIndicator} />
          <div ref={bodyRef} onScroll={checkScroll} style={{
            padding: flush ? '4px 0 14px' : '8px 0 16px',
            overflowY: 'auto', flex: 1,
            display: 'flex', flexDirection: 'column',
            gap: flush ? 0 : 10,
            overscrollBehavior: 'contain',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--scroll-thumb, rgba(142,142,147,.5)) transparent',
          }}>
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '8px 10px 12px',
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 6, flexShrink: 0,
          }}>{footer}</div>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

// ═══ دکمه‌ها ═══
const BTN_BASE: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 'var(--r-md, 9px)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--muted)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, padding: 0,
};
const BTN_ADD: React.CSSProperties = {
  ...BTN_BASE,
  color: 'var(--accent)',
  borderColor: 'var(--accent-border)',
};
const BTN_SEARCH_ACTIVE: React.CSSProperties = {
  ...BTN_BASE,
  color: 'var(--accent)',
  borderColor: 'var(--accent)',
  background: 'var(--accent-soft, rgba(22, 163, 74, 0.08))',
};
const BTN_CLEAR: React.CSSProperties = {
  height: 36,
  padding: '0 10px',
  borderRadius: 9,
  border: '1px solid color-mix(in srgb, var(--danger, #dc2626) 22%, transparent)',
  background: 'transparent',
  color: 'var(--danger, #dc2626)',
  fontFamily: 'inherit',
  fontSize: 'var(--fs-xs, 11.5px)',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

// ═══ سرگروه ═══
interface GroupProps { title: string; icon?: ReactNode; count?: number; children: ReactNode; }
export function SheetGroup({ title, icon, count, children }: GroupProps) {
  return (
    <div style={{
      background: 'var(--card-solid)',
      borderTop: '1px solid color-mix(in srgb, var(--border) 42%, transparent)',
      borderBottom: '1px solid color-mix(in srgb, var(--border) 42%, transparent)',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px',
        minHeight: 38,
        background: 'var(--card-solid)',
        fontSize: 'var(--fs-sm, 12px)', fontWeight: 700,
        color: 'var(--muted)',
        borderBottom: '1px solid color-mix(in srgb, var(--border) 55%, transparent)',
      }}>
        {icon && (
          <span style={{
            width: 16, height: 16, flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, lineHeight: 1,
          }}>{icon}</span>
        )}
        <span style={{ flex: 1 }}>{title}</span>
        {count != null && (
          <span style={{
            fontSize: 'var(--fs-xs, 11px)', fontWeight: 600,
            color: 'var(--muted)',
          }}>
            {getGlobalFormat().count(count)} مورد
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ═══ آیتم ═══
interface ItemProps {
  /** آیکون آماده (ReactNode) */
  icon?: ReactNode;
  /** نوع تجهیز — اگه داده بشه، آیکون از EquipmentIcon میاد */
  equipType?: string;
  /** دسته — برای رنگ IconBadge */
  category?: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  actions?: ReactNode;
}
export function SheetItem({ icon, equipType, category, title, subtitle, selected, disabled, onClick, actions }: ItemProps) {
  const iconNode = equipType ? (
    <IconBadge category={category} size="sm">
      <EquipmentIcon type={equipType} size={16} color="currentColor" />
    </IconBadge>
  ) : icon ? (
    <span style={{
      width: 28, height: 28, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18, lineHeight: 1,
    }}>
      {icon}
    </span>
  ) : null;

  return (
    <button className="sss-item"
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-selected={selected}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: subtitle ? '9px 16px' : '11px 16px',
        minHeight: subtitle ? 46 : 44,
        background: selected ? 'var(--accent-soft, rgba(22, 163, 74, 0.09))' : 'var(--card-solid)',
        border: 'none',
        borderBottom: 'none',
        fontFamily: 'inherit',
        width: '100%', textAlign: 'right',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        position: 'relative',
        flexShrink: 0,
        transition: 'background .12s ease',
      }}
    >
      {actions && <span style={{ display: 'flex', gap: 2, flexShrink: 0 }}>{actions}</span>}
      {iconNode}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{
          fontSize: 'var(--fs-base, 13.5px)',
          fontWeight: selected ? 700 : 500,
          color: selected ? 'var(--accent)' : 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title}
        </span>
        {subtitle && (
          <span style={{
            fontSize: 'var(--fs-xs, 11px)',
            fontWeight: 400,
            color: 'var(--muted)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {subtitle}
          </span>
        )}
      </span>
      {selected && (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}

// ═══ helper ═══
