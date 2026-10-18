/**
 * MultiSelectBar — نوار شناور پایین صفحه برای Multi-Select
 *
 * الگو: اولویت + منوی سرریز (Material Design 3 + Carbon IBM)
 * - حذف و آرشیو (پرتکرارترین): همیشه در bar
 * - customAction + customActions: در منوی ⋯
 * - لغو: آیکون ✕ در انتها
 */
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import type { MultiSelectState } from './useMultiSelect';

interface Props<T> {
  ms: MultiSelectState<T>;
  deleteLabel?: string;
  archiveLabel?: string;
}

export default function MultiSelectBar<T>({
  ms,
  deleteLabel = 'حذف',
  archiveLabel = 'آرشیو',
}: Props<T>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // بستن منو با کلیک بیرون یا Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // وقتی انتخاب کاملاً لغو شد، منو هم بسته شود
  useEffect(() => {
    if (!ms.selectionMode || ms.count === 0) setMenuOpen(false);
  }, [ms.selectionMode, ms.count]);

  if (!ms.selectionMode || ms.count === 0) return null;

  const hasOverflow = !!ms.customAction || (ms.customActions && ms.customActions.length > 0);

  const btnBase: React.CSSProperties = {
    flexShrink: 0,
    padding: '10px 14px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: 'var(--fs-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    whiteSpace: 'nowrap',
  };

  const iconBtn: React.CSSProperties = {
    flexShrink: 0,
    padding: 0,
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: 22,
    color: 'var(--text)',
    fontFamily: 'inherit',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const menuItemStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'transparent',
    border: 'none',
    borderRadius: 10,
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: 'var(--fs-base)',
    fontWeight: 600,
    textAlign: 'right',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    transition: 'background .12s',
  };

  const runMenuAction = (fn: () => void | Promise<void>) => {
    setMenuOpen(false);
    Promise.resolve().then(fn);
  };

  const bar = (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        bottom: 90,
        left: 10,
        right: 10,
        zIndex: 90, // زیر Modal (100+) — تا روی دیالوگ‌ها نیاد
        maxWidth: 480,
        margin: '0 auto',
        direction: 'rtl',
      }}
    >
      {/* منوی سرریز */}
      {menuOpen && hasOverflow && (
        <div
          role="menu"
          aria-label="عملیات بیشتر"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'var(--card-solid)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            padding: 6,
            animation: 'msMenuIn .15s cubic-bezier(.4,0,.2,1)',
          }}
        >
          {ms.customAction && (
            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(ms.doCustom)}
              style={{
                ...menuItemStyle,
                color: ms.customAction.danger ? 'var(--danger)' : 'var(--text)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--input-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {ms.customAction.icon && (
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{ms.customAction.icon}</span>
              )}
              <span>{ms.customAction.label}</span>
            </button>
          )}
          {ms.customActions && ms.customActions.map(a => (
            <button
              key={a.key}
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(() => ms.doCustomByKey(a.key))}
              style={{
                ...menuItemStyle,
                color: a.danger ? 'var(--danger)' : 'var(--text)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--input-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {a.icon && (
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{a.icon}</span>
              )}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* نوار اصلی */}
      <div
        role="toolbar"
        aria-label="اکشن‌های گروهی"
        style={{
          background: 'var(--card-solid)',
          border: '1px solid ' + (ms.customAction?.danger ? 'var(--danger)' : 'rgba(59,130,246,0.4)'),
          borderRadius: 22,
          boxShadow: '0 16px 44px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.1)',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          direction: 'rtl',
        }}
      >
        <span
          style={{
            fontSize: 'var(--fs-sm)',
            fontWeight: 700,
            color: 'var(--info)',
            paddingLeft: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {ms.count} انتخاب
        </span>

        <span style={{ flex: 1 }} />

        {ms.hasDelete && (
          <button
            type="button"
            onClick={ms.doDelete}
            style={{
              ...btnBase,
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontWeight: 700,
            }}
          >
            🗑 {deleteLabel}
          </button>
        )}

        {ms.hasArchive && (
          <button type="button" onClick={ms.doArchive} style={btnBase}>
            📦 {archiveLabel}
          </button>
        )}

        {hasOverflow && (
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="عملیات بیشتر"
            title="عملیات بیشتر"
            style={{
              ...iconBtn,
              background: menuOpen ? 'var(--accent-soft)' : 'var(--input-bg)',
              borderColor: menuOpen ? 'var(--accent)' : 'var(--border)',
              color: menuOpen ? 'var(--accent)' : 'var(--text)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <circle cx="4" cy="10" r="1.7" />
              <circle cx="10" cy="10" r="1.7" />
              <circle cx="16" cy="10" r="1.7" />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={ms.exitSelection}
          aria-label="لغو انتخاب"
          title="لغو"
          style={{
            ...iconBtn,
            background: 'transparent',
            borderColor: 'transparent',
            color: 'var(--muted)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );

  return createPortal(
    <>
      <style>{`
        @keyframes msMenuIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {bar}
    </>,
    document.body
  );
}
