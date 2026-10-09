/**
 * AutocompleteSheet.tsx — فیلد ورودی با Bottom Sheet
 *
 * طبق استاندارد (docs/STANDARDS.md بخش ۷.۵):
 *   - Bottom Sheet از پایین
 *   - ۵ مورد اول + دکمه «نمایش N مورد دیگر»
 *   - جستجو اختیاری (بدون focus خودکار)
 *   - گروه‌بندی بر اساس category
 *   - حداکثر ۷۰vh
 *   - انیمیشن ۲۲۰ms
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

export interface AutoOption {
  value: string;
  label: string;
  icon?: string;
  /** برای گروه‌بندی */
  group?: string;
  /** برچسب گروه برای نمایش */
  groupLabel?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelect: (opt: AutoOption) => void;
  onSubmit: (text: string) => void;
  options: AutoOption[];
  placeholder?: string;
  customLabel?: string;
  error?: string;
  title?: string;
}

const INITIAL_COUNT = 5;
const SEARCH_MAX = 5;
const STEP = 5;

export default function AutocompleteSheet({
  value,
  onChange,
  onSelect,
  onSubmit,
  options,
  placeholder,
  customLabel = 'افزودن مورد دلخواه',
  error,
  title = 'انتخاب کنید',
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [draft, setDraft] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const searchRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typedError, setTypedError] = useState<string | null>(null);
  const matchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const [matched, setMatched] = useState(false);

  // فیلتر بر اساس جستجو
  const query = draft.trim().toLowerCase();
  const isSearching = query.length > 0;

  const filtered = useMemo(() => {
    if (!isSearching) return options;
    return options.filter(o =>
      o.label.toLowerCase().includes(query) ||
      o.groupLabel?.toLowerCase().includes(query)
    );
  }, [options, query, isSearching]);

  // تعداد قابل نمایش
  const showCount = isSearching
    ? Math.min(SEARCH_MAX, filtered.length)
    : Math.min(visibleCount, filtered.length);

  const toShow = filtered.slice(0, showCount);
  const remaining = filtered.length - showCount;

  // گروه‌بندی
  const grouped = useMemo(() => {
    const groups: Record<string, { label: string; items: AutoOption[] }> = {};
    toShow.forEach(o => {
      const key = o.group || 'other';
      if (!groups[key]) {
        groups[key] = { label: o.groupLabel || '', items: [] };
      }
      groups[key].items.push(o);
    });
    return groups;
  }, [toShow]);

  const hasExactMatch = useMemo(() => {
    return options.some(o => o.label.trim().toLowerCase() === query);
  }, [options, query]);

  const showCustom = isSearching && !hasExactMatch;

  // مدیریت باز/بسته
  useEffect(() => {
    if (open) {
      setMounted(true);
      setTimeout(() => setAnimating(true), 20);
    } else {
      setAnimating(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  // قفل scroll بدنه + Esc
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleOpen = () => {
    setDraft('');
    setVisibleCount(INITIAL_COUNT);
    setLockedHeight(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    searchRef.current?.blur();
  };

  const handleShowMore = () => {
    // قفل ارتفاع در اولین کلیک — جلوگیری از رشد Sheet
    if (!lockedHeight && sheetRef.current) {
      setLockedHeight(sheetRef.current.offsetHeight);
    }
    setVisibleCount(c => c + STEP);
  };

  const handlePick = (opt: AutoOption) => {
    onChange(opt.label);
    onSelect(opt);
    setOpen(false);
  };

  const handleCustom = () => {
    if (!query) return;
    onChange(draft.trim());
    onSubmit(draft.trim());
    setOpen(false);
  };

  return (
    <>
      {/* فیلد اصلی: input + دکمه ▼ */}
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        width: '100%',
      }}>
        <input
          type="text"
          value={value}
          onChange={e => {
            const v = e.target.value;
            onChange(v);
            setTypedError(null);
            setMatched(false);
            // ⚡ auto-match زنده با debounce ۲۰۰ms
            if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
            matchTimerRef.current = setTimeout(() => {
              const v2 = v.trim().toLowerCase();
              if (!v2) return;
              const exact = options.find(o => o.label.trim().toLowerCase() === v2);
              if (exact) {
                setMatched(true);
                onSelect(exact);
              }
            }, 200);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const v2 = value.trim().toLowerCase();
              const exact = options.find(o => o.label.trim().toLowerCase() === v2);
              if (exact) {
                onSelect(exact);
                setMatched(true);
                setTypedError(null);
                inputRef.current?.blur();
              } else {
                setTypedError('در لیست نیست — از ▼ بزن یا «افزودن دلخواه»');
                setTimeout(() => setTypedError(null), 3000);
              }
            }
          }}
          placeholder={placeholder || 'تایپ کن یا ▼ بزن'}
          autoComplete="off"
          style={{
            flex: 1,
            minHeight: 44,
            padding: '10px 12px',
            background: 'var(--input-bg)',
            borderTop: '1px solid ' + (typedError ? 'var(--warn)' : matched ? 'var(--accent)' : error ? 'var(--warn)' : 'var(--border)'),
            borderBottom: '1px solid ' + (typedError ? 'var(--warn)' : matched ? 'var(--accent)' : error ? 'var(--warn)' : 'var(--border)'),
            borderRight: '1px solid ' + (typedError ? 'var(--warn)' : matched ? 'var(--accent)' : error ? 'var(--warn)' : 'var(--border)'),
            borderLeft: 'none',
            borderTopRightRadius: 'var(--r-md, 8px)',
            borderBottomRightRadius: 'var(--r-md, 8px)',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-base)',
            textAlign: 'right',
            direction: 'rtl',
            outline: 'none',
            transition: 'border-color .15s ease',
          }}
        />
        {matched && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 32,
            background: 'var(--input-bg)',
            borderTop: '1px solid var(--accent)',
            borderBottom: '1px solid var(--accent)',
            color: 'var(--accent)',
            fontWeight: 900,
            fontSize: 16,
            flexShrink: 0,
          }}>✓</span>
        )}
        <button
          type="button"
          onClick={handleOpen}
          aria-label="باز کردن لیست"
          style={{
            minHeight: 44,
            minWidth: 44,
            padding: '0 12px',
            background: 'var(--input-bg)',
            borderTop: '1px solid ' + (typedError ? 'var(--warn)' : matched ? 'var(--accent)' : error ? 'var(--warn)' : 'var(--border)'),
            borderBottom: '1px solid ' + (typedError ? 'var(--warn)' : matched ? 'var(--accent)' : error ? 'var(--warn)' : 'var(--border)'),
            borderLeft: '1px solid ' + (typedError ? 'var(--warn)' : matched ? 'var(--accent)' : error ? 'var(--warn)' : 'var(--border)'),
            borderRight: 'none',
            borderTopLeftRadius: 'var(--r-md, 8px)',
            borderBottomLeftRadius: 'var(--r-md, 8px)',
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            color: 'var(--muted)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >▾</button>
      </div>

      {(error || typedError) && (
        <div style={{
          marginTop: 4, fontSize: 11, color: 'var(--warn)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span>⚠️</span> {typedError || error}
        </div>
      )}

      {/* Sheet */}
      {mounted && createPortal(
        <div
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(15,23,42,.5)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            opacity: animating ? 1 : 0,
            transition: 'opacity .2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            ref={sheetRef}
            style={{
              width: '100%', maxWidth: 540,
              background: 'var(--card-solid, #fff)',
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              boxShadow: '0 -10px 40px rgba(0,0,0,.2)',
              display: 'flex', flexDirection: 'column',
              maxHeight: '70vh',
              height: lockedHeight ? lockedHeight : 'auto',
              transform: animating ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform .22s cubic-bezier(.2,.7,.3,1)',
              overflow: 'hidden',
            }}
          >
            {/* دستگیره */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--dim)', opacity: 0.5 }} />
            </div>

            {/* هدر */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 16px 10px',
            }}>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text)' }}>{title}</div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="بستن"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32,
                  background: 'var(--btn-bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)', color: 'var(--muted)',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
                }}
              >✕</button>
            </div>

            {/* جستجو */}
            <div style={{ padding: '4px 16px 8px', borderBottom: '1px solid var(--border)' }}>
              <input
                ref={searchRef}
                type="text"
                value={draft}
                onChange={e => { setDraft(e.target.value); setVisibleCount(INITIAL_COUNT); }}
                placeholder="جستجو... (اختیاری)"
                autoComplete="off"
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
                  outline: 'none', direction: 'rtl', textAlign: 'right',
                }}
              />
            </div>

            {/* لیست */}
            <div style={{
              flex: 1, overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}>
              {filtered.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
                  موردی یافت نشد
                </div>
              )}

              {Object.entries(grouped).map(([key, g]) => (
                <div key={key}>
                  {!isSearching && g.label && (
                    <div style={{
                      padding: '8px 16px 4px',
                      fontSize: 11, fontWeight: 700,
                      color: 'var(--muted)',
                      background: 'var(--input-bg)',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      {g.label}
                    </div>
                  )}
                  {g.items.map(opt => {
                    const selected = opt.label.trim().toLowerCase() === value.trim().toLowerCase();
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handlePick(opt)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          width: '100%', minHeight: 48, padding: '11px 16px',
                          background: 'transparent', border: 'none',
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text)', fontFamily: 'inherit',
                          fontSize: 'var(--fs-sm)', cursor: 'pointer',
                          textAlign: 'right', direction: 'rtl',
                        }}
                      >
                        {opt.icon && <span style={{ fontSize: 17, flexShrink: 0 }}>{opt.icon}</span>}
                        <span style={{ flex: 1, fontWeight: 600 }}>{opt.label}</span>
                        {selected && <span style={{ color: 'var(--accent)', fontWeight: 900 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* نمایش بیشتر */}
              {!isSearching && remaining > 0 && (
                <button
                  type="button"
                  onClick={handleShowMore}
                  style={{
                    width: '100%', padding: 12,
                    background: 'var(--input-bg)',
                    border: 'none', borderTop: '1px solid var(--border)',
                    color: 'var(--accent)', fontWeight: 700,
                    fontSize: 'var(--fs-sm)', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'center',
                  }}
                >
                  ↓ نمایش {remaining} مورد دیگر
                </button>
              )}

              {/* افزودن دلخواه */}
              {showCustom && (
                <button
                  type="button"
                  onClick={handleCustom}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', minHeight: 48, padding: '11px 16px',
                    background: 'var(--accent-soft)',
                    border: 'none', borderTop: '2px dashed var(--border)',
                    color: 'var(--accent)', fontFamily: 'inherit',
                    fontSize: 'var(--fs-sm)', fontWeight: 700,
                    cursor: 'pointer', textAlign: 'right', direction: 'rtl',
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>➕</span>
                  <span style={{ flex: 1 }}>{customLabel} «{draft.trim()}»</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
