/**
 * CorrectionModal.tsx — modal ثبت اصلاح (الگوی SexingModal)
 */
import { useEffect, useState } from 'react';
import { Modal, Btn, BtnRow, Field, NumField, Select, Input } from '../../../shr/components/ui';
import type { DailyLog } from '../store';
import { toEn, toFa } from '../../../shr/utils/fa';
import { v4 as uuid } from 'uuid';

const CORRECTABLE_FIELDS = [
  { key: 'temperature',    label: '🌡 دما (میا.)',   unit: '°C' },
  { key: 'temperatureMin', label: '🌡 حداقل دما',    unit: '°C' },
  { key: 'temperatureMax', label: '🌡 حداکثر دما',   unit: '°C' },
  { key: 'humidity',       label: '💧 رطوبت (میا.)', unit: '٪' },
  { key: 'humidityMin',    label: '💧 حداقل رطوبت',  unit: '٪' },
  { key: 'humidityMax',    label: '💧 حداکثر رطوبت', unit: '٪' },
  { key: 'feedDelivered',  label: '🌾 دان داده',     unit: 'kg' },
  { key: 'feedRemaining',  label: '🌾 دان باقی',     unit: 'kg' },
  { key: 'waterAmount',    label: '💧 آب',           unit: 'L' },
  { key: 'deathsCount',    label: '💀 تلفات',        unit: '' },
  { key: 'eatingEggs',     label: '🥚 خوراکی',       unit: 'عدد' },
  { key: 'fertileEggs',    label: '🌱 نطفه‌دار',     unit: 'عدد' },
  { key: 'brokenEggs',     label: '💔 شکسته',        unit: 'عدد' },
  { key: 'otherEggs',      label: '📦 سایر',         unit: 'عدد' },
  { key: 'feedWaste',      label: '🌾 هدر رفته',     unit: 'kg' },
  { key: 'waterFillCount', label: '💧 دفعات آب',     unit: 'نوبت' },
  { key: 'waterFillVolume',label: '💧 حجم هر نوبت',  unit: 'L' },
  { key: 'weightGender',   label: '⚖️ جنسیت وزن',   unit: '' },
] as const;

const FIELD_GROUPS = [
  { title: '🌡 محیط', keys: ['temperature', 'temperatureMin', 'temperatureMax', 'humidity', 'humidityMin', 'humidityMax'] },
  { title: '🌾 تغذیه', keys: ['feedDelivered', 'feedRemaining', 'feedWaste', 'waterAmount', 'waterFillCount', 'waterFillVolume'] },
  { title: '🥚 تولید', keys: ['deathsCount', 'eatingEggs', 'fertileEggs', 'brokenEggs', 'otherEggs', 'weightGender'] },
];

type CorrectableKey = typeof CORRECTABLE_FIELDS[number]['key'];

/** آیا این لاگ چند رکورد تلفات دارد؟ */
function hasMultiDeaths(log: DailyLog | null): boolean {
  return (log?.deaths?.length || 0) > 1;
}

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
  onSave: (logId: string, changes: Partial<DailyLog>, reason: string, notes?: string) => void | Promise<void>;
}

export default function CorrectionModal({ open, onClose, log, onSave }: Props) {
  const [activeField, setActiveField] = useState<CorrectableKey>('temperature');
  const [value, setValue] = useState<string>('');
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (open) {
      setActiveField('temperatureMin');
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
  const oldDisplay = (() => {
    if (oldValue == null) return '—';
    if (activeField === 'weightGender') {
      const opts = [{ value: '', label: '—' }, { value: 'male', label: 'نر' }, { value: 'female', label: 'ماده' }, { value: 'mixed', label: 'مخلوط' }];
      return opts.find(o => o.value === oldValue)?.label || String(oldValue);
    }
    return toFa(String(oldValue));
  })();

  const handleSave = async () => {
    if (!log) return;

    // L2-guard: multi-record deathsCount — رد
    if (activeField === 'deathsCount' && hasMultiDeaths(log)) {
      return;
    }

    // 🆕 جنسیت وزن (enum)
    if (activeField === 'weightGender') {
      await onSave(log.id, { weightGender: value as any }, reason, notes || undefined);
      return;
    }

    if (value.trim() === '') {
      // تعداد تلفات باید عدد صحیح باشد؛ حذف مقدار از این مسیر مجاز نیست.
      if (activeField === 'deathsCount') return;
      await onSave(log.id, { [activeField]: null } as Partial<DailyLog>, reason, notes || undefined);
      return;
    }

    const num = parseFloat(toEn(value).replace('٫', '.'));
    if (!Number.isFinite(num)) return;
    if (activeField === 'deathsCount' && (!Number.isInteger(num) || num < 0)) return;

    const changes: Partial<DailyLog> = { [activeField]: num };

    // buildLogData تعداد نهایی را از آرایهٔ deaths محاسبه می‌کند.
    // رکورد موجود را همراه تعداد کل تغییر بده؛ شناسه و علت حفظ شوند.
    if (activeField === 'deathsCount' && log.deaths?.length === 1) {
      changes.deaths = [{ ...log.deaths[0], count: num }];
    }

    // L2-synth: deathsCount با deaths=[] — synthesize record
    if (activeField === 'deathsCount' && (log.deaths?.length || 0) === 0 && num > 0) {
      changes.deaths = [{
        id: uuid(),
        count: num,
        cause: 'unknown',
        notes: 'اصلاح خودکار',
      }];
    }

    await onSave(log.id, changes, reason, notes || undefined);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت اصلاح"
      footer={
        <BtnRow>
          <Btn
            variant="primary"
            onClick={handleSave}
            disabled={activeField === 'deathsCount' && hasMultiDeaths(log)}
          >✓ ثبت اصلاح</Btn>
          <Btn onClick={onClose}>انصراف</Btn>
        </BtnRow>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {FIELD_GROUPS.map(group => (
            <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
                {group.title}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-1)' }}>
                {group.keys.map(key => {
                  const f = CORRECTABLE_FIELDS.find(x => x.key === key);
                  if (!f) return null;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setActiveField(f.key as CorrectableKey)}
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--sp-3)' }}>
          {activeField === 'deathsCount' && hasMultiDeaths(log) && (
          <div style={{
            padding: 'var(--pad-normal)',
            background: 'var(--warn-soft)',
            border: '1px dashed var(--warn)',
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-sm)',
            color: 'var(--warn)',
            lineHeight: 1.7,
          }}>
            ⚠ این لاگ {toFa(log.deaths.length)} رکورد تلفات دارد.
            اصلاح تعداد کل روی مجموع اعمال نمی‌شود.
            برای اصلاح، ابتدا از ویرایش لاگ رکوردها را تغییر دهید.
          </div>
        )}

        <Field label="مقدار جدید">
            {activeField === 'weightGender' ? (
              <Select value={value} onChange={e => setValue(e.target.value)}>
                <option value="">— نامشخص —</option>
                <option value="male">نر</option>
                <option value="female">ماده</option>
                <option value="mixed">مخلوط</option>
              </Select>
            ) : (
              <NumField value={value} onChange={e => setValue(e.target.value)} unit={currentField?.unit} />
            )}
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
