/**
 * CorrectionForm.tsx — فرم inline ثبت اصلاح (الگوی flk)
 */
import { useEffect, useState } from 'react';
import { Btn, Field, NumField, Select, Input } from '../../../shr/components/ui';
import type { DailyLog } from '../store';
import { toEn, toFa } from '../../../shr/utils/fa';

const CORRECTABLE_FIELDS = [
  { key: 'temperature',   label: '🌡 دما',       unit: '°C' },
  { key: 'humidity',      label: '💧 رطوبت',     unit: '٪' },
  { key: 'feedDelivered', label: '🌾 دان داده',  unit: 'kg' },
  { key: 'feedRemaining', label: '🌾 دان باقی',  unit: 'kg' },
  { key: 'waterAmount',   label: '💧 آب',        unit: 'L' },
  { key: 'deathsCount',   label: '💀 تلفات',     unit: '' },
  { key: 'eatingEggs',    label: '🥚 خوراکی',    unit: 'عدد' },
  { key: 'fertileEggs',   label: '🌱 نطفه‌دار',  unit: 'عدد' },
  { key: 'brokenEggs',    label: '💔 شکسته',     unit: 'عدد' },
  { key: 'otherEggs',     label: '📦 سایر',      unit: 'عدد' },
] as const;

type CorrectableKey = typeof CORRECTABLE_FIELDS[number]['key'];

const REASONS = [
  'اشتباه شمارش',
  'اشتباه خواندن سنسور',
  'تایپ اشتباه',
  'فراموشی ثبت',
  'سایر',
];

interface Props {
  log: DailyLog;
  onSave: (changes: Partial<DailyLog>, reason: string, notes?: string) => void;
  onCancel: () => void;
}

export function CorrectionForm({ log, onSave, onCancel }: Props) {
  const [activeField, setActiveField] = useState<CorrectableKey>('temperature');
  const [value, setValue] = useState<string>('');
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    const cur = (log as any)[activeField];
    setValue(cur != null ? String(cur) : '');
  }, [activeField, log]);

  const currentField = CORRECTABLE_FIELDS.find(f => f.key === activeField);
  const oldValue = (log as any)[activeField];
  const oldDisplay = oldValue != null ? toFa(String(oldValue)) : '—';

  const handleSave = () => {
    if (value.trim() === '') {
      onSave({ [activeField]: null } as Partial<DailyLog>, reason, notes || undefined);
      return;
    }
    const num = parseFloat(toEn(value).replace('٫', '.'));
    if (isNaN(num)) return;
    onSave({ [activeField]: num } as Partial<DailyLog>, reason, notes || undefined);
  };

  return (
    <div style={{
      background: 'var(--warn-soft)',
      border: '1px solid var(--warn)',
      borderRadius: 'var(--r-md)',
      padding: 'var(--pad-normal)',
      marginTop: 'var(--sp-2)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--sp-2)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px dashed var(--warn)',
        paddingBottom: 8,
      }}>
        <span style={{ fontWeight: 700, color: 'var(--warn)', fontSize: 'var(--fs-base)' }}>ثبت اصلاح</span>
        <button type="button" onClick={onCancel} style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          fontSize: 18, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
        }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-1)' }}>
        {CORRECTABLE_FIELDS.map(f => (
          <button key={f.key} type="button" onClick={() => setActiveField(f.key)} style={{
            padding: '5px 10px',
            background: activeField === f.key ? 'var(--warn)' : 'var(--card)',
            color: activeField === f.key ? 'white' : 'var(--muted)',
            border: `1px solid ${activeField === f.key ? 'var(--warn)' : 'var(--border)'}`,
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--sp-2)' }}>
        <Field label="مقدار جدید">
          <NumField value={value} onChange={e => setValue(e.target.value)} unit={currentField?.unit} />
        </Field>
        <Field label="مقدار قبلی">
          <div style={{
            height: 40, padding: '0 12px',
            background: 'var(--card)', border: '1px solid var(--warn)',
            borderRadius: 'var(--r-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)',
          }}>{oldDisplay}</div>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
        <Field label="دلیل">
          <Select value={reason} onChange={e => setReason(e.target.value)}>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
        <Field label="توضیح (اختیاری)">
          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="..." />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
        <Btn variant="primary" onClick={handleSave}>✓ ثبت اصلاح</Btn>
        <Btn onClick={onCancel}>لغو</Btn>
      </div>
    </div>
  );
}
