/**
 * helpers.tsx — ماژول hal
 */
import type { ReactNode, CSSProperties } from 'react';
import { toFa } from '../../shr/utils/fa';
import { Field, Input, NumField, Select } from '../../shr/components/ui';

export function chip(active: boolean): CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  };
}

export function Row({ l, v, accent }: { l: string; v: string; accent?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)',
      padding: 'var(--pad-tight)',
      background: accent ? 'var(--accent-soft)' : 'var(--input-bg)',
      borderRadius: 'var(--r-sm)',
      color: accent ? 'var(--accent)' : undefined,
      fontWeight: accent ? 700 : undefined,
    }}>
      <span style={{ color: accent ? 'var(--accent)' : 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );
}

export function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ padding: '4px 10px', background: 'var(--input-bg)', borderRadius: 6, fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
      {label}: <b style={{ color: 'var(--text)' }}>{value}</b>
    </span>
  );
}

// ═══════════════════════════════════════════════
// SourceList — لیست منابع توزیع‌شده
// ═══════════════════════════════════════════════

export interface HallSource {
  id: string;
  type: string;
  count: number | null;
  notes: string;
}

interface SourceListProps {
  label: string;
  icon: string;
  sources: HallSource[];
  typeLabels: Record<string, string>;
  countUnit?: string;
  countLabel?: string;
  onChange: (sources: HallSource[]) => void;
}

export function SourceList({
  label, icon, sources, typeLabels, countUnit = 'عدد', countLabel = 'تعداد',
  onChange,
}: SourceListProps) {
  const add = () => {
    const firstType = Object.keys(typeLabels)[0] || '';
    onChange([...sources, { id: crypto.randomUUID(), type: firstType, count: null, notes: '' }]);
  };

  const remove = (id: string) => {
    onChange(sources.filter(s => s.id !== id));
  };

  const update = (id: string, patch: Partial<HallSource>) => {
    onChange(sources.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>
          {icon} {label}
        </span>
        {sources.length > 0 && (
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            ({toFa(sources.length)})
          </span>
        )}
      </div>

      {sources.map((s, i) => (
        <div
          key={s.id}
          style={{
            padding: '8px 10px',
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600, minWidth: 20 }}>
              #{toFa(i + 1)}
            </span>
            <div style={{ flex: 1 }}>
              <Select value={s.type} onChange={e => update(s.id, { type: e.target.value })}>
                <option value="">— انتخاب —</option>
                {Object.entries(typeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
            <button
              type="button"
              onClick={() => remove(s.id)}
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)', color: 'var(--danger)',
                cursor: 'pointer', fontFamily: 'inherit',
                width: 32, height: 32, flexShrink: 0, fontSize: 14,
              }}
              aria-label="حذف"
            >✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <Field label={countLabel}>
              <NumField
                placeholder="۰"
                value={s.count !== null ? String(s.count) : ''}
                onChange={e => update(s.id, { count: parseInt(e.target.value) || null })}
                unit={countUnit}
                min={0}
              />
            </Field>
            <Field label="یادداشت">
              <Input
                placeholder="مثلاً نیمه جنوبی..."
                value={s.notes}
                onChange={e => update(s.id, { notes: e.target.value })}
              />
            </Field>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        style={{
          padding: '8px 12px',
          background: 'var(--btn-bg)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--r-md)',
          color: 'var(--accent)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
        }}
      >
        + افزودن {label}
      </button>
    </div>
  );
}
