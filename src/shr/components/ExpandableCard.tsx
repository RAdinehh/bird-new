import React, { useEffect, useState } from 'react';
import { useSet } from '../../mod/set/store';

type AccentKey = 'accent' | 'warn' | 'dim' | 'purple' | 'info' | 'green' | 'amber' | 'blue' | 'gray';

interface Props {
  accent?: AccentKey;
  index?: number | string;
  icon?: React.ReactNode;
  iconEmoji?: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  summary?: React.ReactNode;
  stats?: React.ReactNode;
  compact?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  /** 🆕 شناسه آیتم برای Multi-Select */
  id?: string;
  /** 🆕 دستگیره Multi-Select (اگه پاس بشه، long-press و چک‌باکس فعال می‌شن) */
  ms?: any;
  /** 🆕 اکشن کلیک روی کارت وقتی selectionMode نیست (اختیاری) */
  onTap?: () => void;
}

const COLORS: Record<AccentKey, { c: string; s: string }> = {
  accent: { c: 'var(--accent)', s: 'var(--accent-soft)' },
  green:  { c: 'var(--accent)', s: 'var(--accent-soft)' },
  warn:   { c: 'var(--warn)',   s: 'var(--warn-soft)' },
  amber:  { c: 'var(--warn)',   s: 'var(--warn-soft)' },
  dim:    { c: 'var(--dim)',    s: 'var(--input-bg)' },
  gray:   { c: 'var(--dim)',    s: 'var(--input-bg)' },
  purple: { c: 'var(--purple)', s: 'var(--purple-soft)' },
  info:   { c: 'var(--info)',   s: 'var(--info-soft)' },
  blue:   { c: 'var(--info)',   s: 'var(--info-soft)' },
};

export default function ExpandableCard({
  accent = 'accent', index, icon, iconEmoji = '📋', compact = false,
  title, subtitle, badge, summary, stats, isOpen, onToggle, children,
  id, ms, onTap,
}: Props) {
  const lowPower = useSet((st: any) => st.lowPowerMode);
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReduced(mq.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch { /* silent */ }
  }, []);
  const noAnim = !!(lowPower || prefersReduced);

  // ─── Multi-Select ───
  const isSelectionMode = !!(ms && ms.selectionMode);
  const isSelected = !!(id && ms && ms.isSelected && ms.isSelected(id));

  const safeAccent = COLORS[accent] ? accent : 'accent';
  const { c: color, s: soft } = COLORS[safeAccent];

  return (
    <div style={{
      position: 'relative',
      background: 'var(--card)',
      border: '1px solid ' + (isSelected ? color : (isOpen ? color : 'var(--border)')),
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      marginBottom: 8,
      transition: 'border-color var(--dur-base), background var(--dur-base)',
      boxShadow: isSelected ? '0 0 0 2px ' + soft : 'none',
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: color, zIndex: 1 }} />

      {/* چک‌باکس انتخاب در حالت Multi-Select */}
      {isSelectionMode && (
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: isSelected ? color : 'var(--card-solid)',
          border: '2px solid ' + (isSelected ? color : 'var(--border)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 800,
          color: '#fff',
          zIndex: 5,
          pointerEvents: 'none',
        }}>
          {isSelected ? '✓' : ''}
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={(isOpen ? 'بستن ' : 'باز کردن ') + title}
        onClick={() => {
          if (isSelectionMode && id && ms) {
            ms.toggleSelect(id);
            return;
          }
          if (ms && ms.didLongPressFire && ms.didLongPressFire()) {
            ms.resetLongPressFire();
            return;
          }
          if (onTap) { onTap(); return; }
          onToggle();
        }}
        onTouchStart={() => {
          if (ms && id && !isSelectionMode) ms.startLongPress(id);
        }}
        onTouchEnd={() => {
          if (ms) ms.cancelLongPress();
        }}
        onTouchCancel={() => {
          if (ms) ms.cancelLongPress();
        }}
        onTouchMove={() => {
          if (ms) ms.cancelLongPress();
        }}
        onMouseDown={() => {
          if (ms && id && !isSelectionMode) ms.startLongPress(id);
        }}
        onMouseUp={() => {
          if (ms) ms.cancelLongPress();
        }}
        onMouseLeave={() => {
          if (ms) ms.cancelLongPress();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isSelectionMode && id && ms) ms.toggleSelect(id);
            else onToggle();
          }
        }}
        className="ec-trigger"
        style={{
          padding: compact ? '8px 14px 8px 12px' : '12px 18px 12px 16px',
          cursor: 'pointer',
          outline: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: compact ? 34 : 42, height: compact ? 34 : 42, borderRadius: 'var(--r-md)',
            background: soft, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0, position: 'relative',
          }}>
            {iconEmoji}
            {index !== undefined && index !== '' && (
              <span style={{
                position: 'absolute', top: -4, left: -4, width: 18, height: 18, borderRadius: '50%',
                background: color, color: 'var(--avatar-text)',
                fontSize: 'var(--fs-xs)', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--card-solid)',
              }}>{index}</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: compact ? 'var(--fs-sm)' : 'var(--fs-md)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            <div style={{ fontSize: compact ? 'var(--fs-xs)' : 'var(--fs-sm)', color: 'var(--muted)', marginTop: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4, wordBreak: 'break-word' }}>{subtitle}</div>
          </div>

          {badge && <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>{badge}</div>}

          {!isSelectionMode && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isOpen ? color : 'var(--dim)'} strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: noAnim ? 'none' : 'transform var(--dur-slow)', flexShrink: 0 }}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </div>

        {(summary || stats) && !compact && (
          <div style={{
            display: 'flex', gap: 10, marginTop: 8, paddingTop: 8,
            borderTop: '1px dashed var(--border)',
            fontSize: 'var(--fs-xs)', color: 'var(--muted)', flexWrap: 'wrap',
            alignItems: 'center',
            lineHeight: 1.6,
          }}>
            {summary}
            {stats}
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        transition: noAnim ? 'none' : 'grid-template-rows 250ms cubic-bezier(.16,1,.3,1)',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0 18px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── کامپوننت‌های نمایش اطلاعات فشرده ───────────

/** آیتم کوچیک برای ردیف summary — بدون ارتفاع اضافی */
export function InfoItem({ icon, value, tone = 'default' }: { icon?: string; value: string; tone?: 'default' | 'accent' | 'warn' | 'danger' | 'info' | 'purple' }) {
  const colorMap: Record<string, string> = {
    default: 'var(--muted)',
    accent: 'var(--accent)',
    warn: 'var(--warn)',
    danger: 'var(--danger)',
    info: 'var(--info)',
    purple: 'var(--purple)',
  };
  const fg = colorMap[tone] || colorMap.default;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', maxWidth: '35%', overflow: 'hidden' }}>
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      <b style={{ color: fg, fontWeight: 700, direction: 'ltr', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</b>
    </span>
  );
}

/** عنصر Label: Value — با رنگ شرطی */
export function StatBox({ icon, value, label, tone = 'default' }: { icon?: string; value: string; label: string; tone?: 'default' | 'accent' | 'warn' | 'danger' | 'info' | 'purple' }) {
  const colorMap: Record<string, string> = {
    default: 'var(--text)',
    accent: 'var(--accent)',
    warn: 'var(--warn)',
    danger: 'var(--danger)',
    info: 'var(--info)',
    purple: 'var(--purple)',
  };
  const fg = colorMap[tone] || colorMap.default;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', maxWidth: '40%', overflow: 'hidden' }}>
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      <span style={{ color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}:</span>
      <b style={{ color: fg, fontWeight: 700, direction: 'ltr', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</b>
    </span>
  );
}

/** جداکننده‌ی نقطه‌ای بین آیتم‌ها */
export function Dot() {
  return <span aria-hidden="true" style={{ color: 'var(--dim)', margin: '0 2px' }}>·</span>;
}
