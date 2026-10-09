/**
 * AutocompleteInline.tsx — فیلد ورودی با لیست پیشنهاد inline
 *
 * چرا inline و نه overlay؟
 *   - Sheet روی Sheet نمی‌شه
 *   - لیست داخل خود فرم → با کیبورد بالا/پایین میاد
 *   - کاربر همه چیز رو یه‌جا می‌بینه
 *
 * الگو: Stripe, GitHub, Shopify — فرم‌های موبایل با autocomplete
 */
import { useState, useRef, useEffect, useMemo } from 'react';

export interface AutoOption {
  value: string;
  label: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelect: (opt: AutoOption) => void;
  onSubmit: (text: string) => void;
  options: AutoOption[];
  placeholder?: string;
  customLabel?: string;
  maxSuggestions?: number;
  error?: string;
}

export default function AutocompleteInline({
  value,
  onChange,
  onSelect,
  onSubmit,
  options,
  placeholder,
  customLabel = 'افزودن مورد دلخواه',
  maxSuggestions = 5,
  error,
}: Props) {
  const [showList, setShowList] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return options
      .filter(o =>
        o.label.toLowerCase().includes(q) ||
        o.subtitle?.toLowerCase().includes(q)
      )
      .slice(0, maxSuggestions);
  }, [value, options, maxSuggestions]);

  const hasExactMatch = useMemo(() => {
    const q = value.trim().toLowerCase();
    return options.some(o => o.label.toLowerCase() === q);
  }, [value, options]);

  const isSelected = (label: string) =>
    label.trim().toLowerCase() === value.trim().toLowerCase();

  // بستن با کلیک بیرون
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowList(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showList || filtered.length === 0) {
      if (e.key === 'Enter' && value.trim() && !hasExactMatch) {
        onSubmit(value.trim());
        setShowList(false);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setActiveIdx(i => Math.max(i - 1, -1));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && filtered[activeIdx]) {
        pick(filtered[activeIdx]);
      } else if (value.trim() && !hasExactMatch) {
        onSubmit(value.trim());
        setShowList(false);
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setShowList(false);
      setActiveIdx(-1);
    }
  };

  const pick = (opt: AutoOption) => {
    onChange(opt.label);
    onSelect(opt);
    setShowList(false);
    setActiveIdx(-1);
  };

  const showCustom = value.trim().length > 0 && !hasExactMatch;
  const hasResults = filtered.length > 0;
  const isOpen = showList && value.trim().length > 0 && (hasResults || showCustom);

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <input
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setShowList(true);
          setActiveIdx(-1);
        }}
        onFocus={() => { if (value.trim()) setShowList(true); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'var(--input-bg)',
          border: (isOpen ? '1.5px solid var(--accent)' : '1px solid ' + (error ? 'var(--warn)' : 'var(--border)')),
          borderBottom: isOpen ? '1px solid var(--accent)' : undefined,
          borderRadius: isOpen ? '8px 8px 0 0' : 'var(--r-md, 8px)',
          color: 'var(--text)',
          fontFamily: 'inherit',
          fontSize: 'var(--fs-base)',
          outline: 'none',
          direction: 'rtl',
          textAlign: 'right',
          minHeight: 44,
          transition: 'border-radius .15s ease, border-color .15s ease',
        }}
      />

      {isOpen && (
        <div
          role="listbox"
          style={{
            marginTop: -1,
            background: 'var(--card-solid, #fff)',
            border: '1.5px solid var(--accent)',
            borderTop: 'none',
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            boxShadow: '0 10px 28px rgba(0,0,0,.15), 0 2px 6px rgba(34,197,94,.12)',
            overflow: 'hidden',

          }}
        >
          {filtered.map((opt, idx) => (
            <button
              key={opt.value + idx}
              type="button"
              role="option"
              aria-selected={idx === activeIdx}
              onClick={() => pick(opt)}
              onMouseEnter={() => setActiveIdx(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                minHeight: 42,
                padding: '8px 14px',
                background: idx === activeIdx ? 'var(--accent-soft)' : 'transparent',
                border: 'none',
                borderBottom: idx < filtered.length - 1 || showCustom
                  ? '1px solid var(--border)'
                  : 'none',
                color: 'var(--text)',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-sm)',
                cursor: 'pointer',
                textAlign: 'right',
                transition: 'background .1s ease',
              }}
            >
              {opt.icon && <span style={{ fontSize: 15, flexShrink: 0 }}>{opt.icon}</span>}
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
                {opt.label}
              </div>
              {isSelected(opt.label) && (
                <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: 14 }}>✓</span>
              )}
            </button>
          ))}

          {showCustom && (
            <button
              type="button"
              onClick={() => { onSubmit(value.trim()); setShowList(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                minHeight: 40,
                padding: '6px 12px',
                background: 'var(--accent-soft)',
                border: 'none',
                color: 'var(--accent)',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'right',
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>➕</span>
              <span style={{ flex: 1 }}>{customLabel} «{value.trim()}»</span>
            </button>
          )}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 4,
          fontSize: 11,
          color: 'var(--warn)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span>⚠️</span> {error}
        </div>
      )}

    </div>
  );
}
