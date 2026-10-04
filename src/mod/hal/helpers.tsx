import React from 'react';
/**
 * helpers.tsx — ماژول hal
 */
import type { ReactNode, CSSProperties } from 'react';
import { toFa } from '../../shr/utils/fa';
import { Field, Input, NumField, Select, Modal } from '../../shr/components/ui';
import EditableSelect from '../../shr/components/EditableSelect';
import { sourceIcon } from './store';

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
  customKey?: string;
  onChange: (sources: HallSource[]) => void;
}

export function SourceList({
  label, icon, sources, typeLabels, countUnit = 'عدد', countLabel = 'تعداد',
  customKey, onChange,
}: SourceListProps) {
  const [editId, setEditId] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const addWith = (type: string) => {
    onChange([...sources, { id: crypto.randomUUID(), type, count: null, notes: '' }]);
    setPickerOpen(false);
  };

  const remove = (id: string) => onChange(sources.filter(s => s.id !== id));
  const update = (id: string, patch: Partial<HallSource>) => {
    onChange(sources.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const editing = editId ? sources.find(s => s.id === editId) : null;

  const typeOptions = Object.entries(typeLabels).map(([k, v]) => ({
    value: k,
    label: v,
    icon: sourceIcon(k),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>{label}</span>
        {sources.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>({toFa(sources.length)})</span>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'var(--accent)', border: 'none',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 300, lineHeight: 1,
            fontFamily: 'inherit',
            boxShadow: '0 2px 6px rgba(22,163,74,.28)',
          }}
          aria-label={'افزودن ' + label}
        >+</button>
      </div>

      {sources.map((s) => (
        <div key={s.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px',
          background: 'var(--card-solid)',
          border: '1.5px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(15,23,42,.04)',
        }}>
          <span style={{
            width: 36, height: 36, borderRadius: 11,
            background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8ef 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>{sourceIcon(s.type)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {typeLabels[s.type] || s.type}
            </div>
            {(s.count !== null || s.notes) && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.count !== null ? toFa(s.count) + ' ' + countUnit : ''}
                {s.count !== null && s.notes ? ' · ' : ''}
                {s.notes || ''}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditId(s.id)}
            aria-label="ویرایش"
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--input-bg)', border: '1px solid var(--border)',
              cursor: 'pointer', fontSize: 13, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✏️</button>
          <button
            type="button"
            onClick={() => remove(s.id)}
            aria-label="حذف"
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--input-bg)', border: '1px solid var(--border)',
              cursor: 'pointer', fontSize: 13, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >🗑️</button>
        </div>
      ))}

      {sources.length === 0 && (
        <div style={{
          padding: '10px 12px',
          background: 'var(--input-bg)',
          border: '1px dashed var(--border)',
          borderRadius: 12,
          fontSize: 12, color: 'var(--muted)',
          textAlign: 'center',
        }}>
          هنوز {label}ی ثبت نشده
        </div>
      )}

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={'افزودن ' + label}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {typeOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => addWith(o.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', minHeight: 54,
                background: 'var(--card-solid)',
                border: '1.5px solid var(--border)',
                borderRadius: 14,
                color: 'var(--text)', fontFamily: 'inherit',
                fontSize: 'var(--fs-base)', fontWeight: 500,
                textAlign: 'right', cursor: 'pointer',
                width: '100%', boxSizing: 'border-box',
                boxShadow: '0 1px 2px rgba(15,23,42,.04)',
              }}
            >
              <span style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8ef 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>{o.icon}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{o.label}</span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditId(null)}
        title={label}
      >
        {editing && (
          <>
            <Field label={countLabel}>
              <NumField
                placeholder="۰"
                value={editing.count !== null ? String(editing.count) : ''}
                onChange={(e) => update(editing.id, { count: parseInt(e.target.value) || null })}
                unit={countUnit}
                min={0}
              />
            </Field>
            <Field label="یادداشت">
              <Input
                placeholder="مثلاً نیمه جنوبی..."
                value={editing.notes}
                onChange={(e) => update(editing.id, { notes: e.target.value })}
              />
            </Field>
            <div style={{ display: 'flex', gap: 6, paddingTop: 8 }}>
              <button
                type="button"
                onClick={() => setEditId(null)}
                style={{
                  flex: 1, padding: '12px',
                  background: 'var(--btn-bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)', color: 'var(--text)',
                  fontSize: 'var(--fs-base)', fontFamily: 'inherit',
                  fontWeight: 600, cursor: 'pointer',
                }}
              >بستن</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}


/** تشخیص زیرنوع‌های خانواده فن/تهویه */
export function isFanLike(type: string): boolean {
  return ['fan_tunnel', 'fan_ceiling', 'fan', 'cooler', 'cooling_pad', 'air_inlet'].includes(type);
}

/** تشخیص زیرنوع‌های خانواده لامپ/روشنایی */
export function isLampLike(type: string): boolean {
  return ['lamp_led', 'lamp_fluorescent', 'lamp', 'dimmer'].includes(type);
}

/** kg/m² بستر بر اساس زیرنوع */
export const LITTER_KG_PER_M2: Record<string, number> = {
  litter_wood_shavings: 4.5,
  wood_shavings: 4.5,
  litter_roll: 2.5,
  litter_sand: 30,
  sand: 30,
  litter_straw: 6,
  straw: 6,
};

/** تشخیص زیرنوع‌های بستر */
export function isLitterLike(type: string): boolean {
  return Object.keys(LITTER_KG_PER_M2).includes(type);
}

/** تشخیص زیرنوع‌های دانخوری */
export function isFeederLike(type: string): boolean {
  return type.startsWith('feeder') || type === 'feeder';
}

/** تشخیص زیرنوع‌های آبخوری */
export function isDrinkerLike(type: string): boolean {
  return ['nipple', 'cup', 'trough', 'fountain_drinker', 'drinker'].includes(type);
}
