/**
 * AutocompleteSheet.tsx — فیلد ورودی با Bottom Sheet (استاندارد SelectSheetShell)
 *
 * طبق docs/STANDARDS.md بخش ۷.۵:
 *   - Bottom Sheet از پایین (SelectSheetShell)
 *   - ۵ مورد اول + «نمایش N مورد دیگر»
 *   - جستجو اختیاری (بدون focus خودکار)
 *   - گروه‌بندی بر اساس category
 *   - حداکثر ۷۰vh
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import SelectSheetShell, { SheetGroup, SheetItem } from './SelectSheetShell';

export interface AutoOption {
  value: string;
  label: string;
  icon?: string;
  group?: string;
  groupLabel?: string;
  groupIcon?: string;
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
  value, onChange, onSelect, onSubmit,
  options, placeholder, customLabel = 'افزودن مورد دلخواه',
  error, title = 'انتخاب کنید',
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [typedError, setTypedError] = useState<string | null>(null);
  const [matched, setMatched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const matchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = draft.trim().toLowerCase();
  const isSearching = query.length > 0;

  const filtered = useMemo(() => {
    if (!isSearching) return options;
    return options.filter(o =>
      o.label.toLowerCase().includes(query) ||
      o.groupLabel?.toLowerCase().includes(query)
    );
  }, [options, query, isSearching]);

  const showCount = isSearching
    ? Math.min(SEARCH_MAX, filtered.length)
    : Math.min(visibleCount, filtered.length);
  const toShow = filtered.slice(0, showCount);
  const remaining = filtered.length - showCount;

  const grouped = useMemo(() => {
    const groups: Record<string, { label: string; icon?: string; items: AutoOption[] }> = {};
    toShow.forEach(o => {
      const key = o.group || 'other';
      if (!groups[key]) groups[key] = { label: o.groupLabel || '', icon: o.groupIcon, items: [] };
      groups[key].items.push(o);
    });
    return groups;
  }, [toShow]);

  const hasExactMatch = useMemo(() => {
    return options.some(o => o.label.trim().toLowerCase() === query);
  }, [options, query]);

  const showCustom = isSearching && !hasExactMatch;

  const handleOpen = () => {
    setDraft('');
    setVisibleCount(INITIAL_COUNT);
    setOpen(true);
  };

  const handlePick = (opt: AutoOption) => {
    onChange(opt.label);
    onSelect(opt);
    setOpen(false);
  };

  const handleCustom = () => {
    if (!draft.trim()) return;
    onChange(draft.trim());
    onSubmit(draft.trim());
    setOpen(false);
  };

  const handleShowMore = () => setVisibleCount(c => c + STEP);

  return (
    <>
      {/* فیلد اصلی: input + دکمه ▼ */}
      <div style={{ display: 'flex', alignItems: 'stretch', width: '100%', minWidth: 0, maxWidth: '100%' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => {
            const v = e.target.value;
            onChange(v);
            setTypedError(null);
            setMatched(false);
            if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
            matchTimerRef.current = setTimeout(() => {
              const v2 = v.trim().toLowerCase();
              if (!v2) return;
              const exact = options.find(o => o.label.trim().toLowerCase() === v2);
              if (exact) { setMatched(true); onSelect(exact); }
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
            flex: '1 1 0%', minWidth: 0, height: 38, padding: '0 12px',
            background: 'var(--input-bg)',
            border: `1px solid ${typedError ? 'var(--warn)' : matched ? 'var(--accent)' : error ? 'var(--warn)' : 'var(--border)'}`,
            borderTopRightRadius: 'var(--r-md, 8px)',
            borderBottomRightRadius: 'var(--r-md, 8px)',
            borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
            color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-base)',
            textAlign: 'right', direction: 'rtl', outline: 'none',
            transition: 'border-color .15s ease',
          }}
        />
        {matched && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 32, background: 'var(--input-bg)',
            borderTop: '1px solid var(--accent)',
            borderBottom: '1px solid var(--accent)',
            color: 'var(--accent)', fontWeight: 900, fontSize: 16, flexShrink: 0,
          }}>✓</span>
        )}
        <button
          type="button"
          onClick={handleOpen}
          aria-label="باز کردن لیست"
          style={{
            height: 38, minWidth: 38, padding: '0 12px',
            background: 'var(--input-bg)',
            border: `1px solid ${typedError ? 'var(--warn)' : matched ? 'var(--accent)' : error ? 'var(--warn)' : 'var(--border)'}`,
            borderTopLeftRadius: 'var(--r-md, 8px)',
            borderBottomLeftRadius: 'var(--r-md, 8px)',
            borderTopRightRadius: 0, borderBottomRightRadius: 0,
            color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {(error || typedError) && (
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--warn)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>⚠️</span> {typedError || error}
        </div>
      )}

      {/* Sheet */}
      <SelectSheetShell
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        subtitle={options.length ? `${toFa(options.length)} مورد` : undefined}
        searchable={options.length > 5}
        searchNode={
          <input
            type="text"
            value={draft}
            onChange={e => { setDraft(e.target.value); setVisibleCount(INITIAL_COUNT); }}
            placeholder="جستجو... (اختیاری)"
            autoComplete="off"
            style={{
              width: '100%', padding: '9px 12px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--text)', fontFamily: 'inherit',
              fontSize: 'var(--fs-sm)', outline: 'none',
              direction: 'rtl', textAlign: 'right',
            }}
          />
        }
      >
        {filtered.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
            موردی یافت نشد
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([key, g]) => (
              <SheetGroup key={key} title={g.label || '—'} icon={g.icon} count={g.items.length}>
                {g.items.map(opt => (
                  <SheetItem
                    key={opt.value}
                    icon={opt.icon}
                    title={opt.label}
                    selected={opt.label.trim().toLowerCase() === value.trim().toLowerCase()}
                    onClick={() => handlePick(opt)}
                  />
                ))}
              </SheetGroup>
            ))}

            {!isSearching && remaining > 0 && (
              <button type="button" onClick={handleShowMore} style={BTN_MORE}>
                ↓ نمایش {toFa(remaining)} مورد دیگر
              </button>
            )}

            {showCustom && (
              <button type="button" onClick={handleCustom} style={BTN_CUSTOM}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>➕</span>
                <span style={{ flex: 1 }}>{customLabel} «{draft.trim()}»</span>
              </button>
            )}
          </>
        )}
      </SelectSheetShell>
    </>
  );
}

const BTN_MORE: React.CSSProperties = {
  width: '100%', padding: 12,
  background: 'var(--input-bg)',
  border: '1px solid var(--border)', borderRadius: 10,
  color: 'var(--accent)', fontWeight: 700,
  fontSize: 'var(--fs-sm)', cursor: 'pointer',
  fontFamily: 'inherit', textAlign: 'center',
};

const BTN_CUSTOM: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  width: '100%', minHeight: 48, padding: '11px 16px',
  background: 'var(--accent-soft)',
  border: '2px dashed var(--accent-border)', borderRadius: 10,
  color: 'var(--accent)', fontFamily: 'inherit',
  fontSize: 'var(--fs-sm)', fontWeight: 700,
  cursor: 'pointer', textAlign: 'right', direction: 'rtl',
};

// ═══ helper ═══
function toFa(n: number): string {
  return String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
}
