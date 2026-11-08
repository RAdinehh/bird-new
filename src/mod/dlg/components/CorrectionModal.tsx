/**
 * CorrectionModal.tsx — modal ثبت اصلاح (الگوی SexingModal)
 */
import { useEffect, useState } from 'react';
import { Modal, Btn, BtnRow, Field, NumField, Select, Input } from '../../../shr/components/ui';
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
  open: boolean;
  onClose: () => void;
  log: DailyLog | null;
  onSave: (logId: string, changes: Partial<DailyLog>, reason: string, notes?: string) => void;
}

export default function CorrectionModal({ open, onClose, log, onSave }: Props) {
  const [activeField, setActiveField] = useState<CorrectableKey>('temperature');
  const [value, setValue] = useState<string>('');
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (open) {
      setActiveField('temperature');
      setValue('');
      setReason(REASONS[0]);
      setNotes('');
    }
  }, [open]);

  useEffect(() => {
    if (!log) return;
    const cur = (log as any)[activeField];
    setValue(cur != null ? String(cur) : '');
  }, [activeField, log]);

  if (!log) return null;

  const currentField = CORRECTABLE_FIELDS.find(f => f.key === activeField);
  const oldValue = (log as any)[activeField];
  const oldDisplay = oldValue != null ? toFa(String(oldValue)) : '—';

  const handleSave = () => {
    if (value.trim() === '') {
      onSave(log.id, { [activeField]: null } as Partial<DailyLog>, reason, notes || undefined);
    } else {
      const num = parseFloat(toEn(value).replace('٫', '.'));
      if (isNaN(num)) return;
      onSave(log.id, { [activeField]: num } as Partial<DailyLog>, reason, notes || undefined);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت اصلاح"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleSave}>✓ ثبت اصلاح</Btn>
          <Btn onClick={onClose}>انصراف</Btn>
        </BtnRow>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-1)' }}>
          {CORRECTABLE_FIELDS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveField(f.key)}
              style={{
                padding: '6px 12px',
                background: activeField === f.key ? 'var(--accent)' : 'var(--card)',
                color: activeField === f.key ? 'white' : 'var(--muted)',
                border: `1px solid ${activeField === f.key ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--r-sm)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >{f.label}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--sp-3)' }}>
          <Field label="مقدار جدید">
            <NumField value={value} onChange={e => setValue(e.target.value)} unit={currentField?.unit} />
          </Field>
          <Field label="مقدار قبلی">
            <div style={{
              height: 44, padding: '0 12px',
              background: 'var(--input-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)',
            }}>{oldDisplay}</div>
          </Field>
        </div>

        <Field label="دلیل">
          <Select value={reason} onChange={e => setReason(e.target.value)}>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>

        <Field label="توضیح (اختیاری)">
          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="..." />
        </Field>
      </div>
    </Modal>
  );
}
