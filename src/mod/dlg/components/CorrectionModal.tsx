/**
 * CorrectionModal.tsx — modal ثبت اصلاح چند-فیلدی
 * استاندارد: ALCOA+ / 21 CFR Part 11 §11.10(e)
 * - چند فیلد را هم‌زمان می‌توان اصلاح کرد (یک correction واحد)
 * - یک دلیل مشترک برای همه
 * - Audit Trail برای هر فیلد جداگانه (در buildCorrectionEvents)
 * - کادر دو-قسمتی: راست = ورودی جدید (خالی)، چپ = مقدار قبلی (خواندنی)
 * - خالی کردن = برگشت به حالت تغییر نیافته (به جز weightGender)
 * - چیدمان دو ستونه برای فیلدهای هم‌خانواده (مثل ثبت روزانه)
 */
import { useFormat, getGlobalFormat } from '../../../shr/units/useFormat';

import { useEffect, useMemo, useState } from 'react';
import { Modal, Btn, BtnRow, Field, Select, Input, Grid2 } from '../../../shr/components/ui';
import type { DailyLog } from '../store';
import { toEn, toFa } from '../../../shr/utils/fa';
import { v4 as uuid } from 'uuid';
import { applyCorrections } from '../api/applyCorrections';

const CORRECTABLE_FIELDS = [
  { key: 'temperatureMin', label: '🌡 حداقل دما',    unit: '°C' },
  { key: 'temperatureMax', label: '🌡 حداکثر دما',   unit: '°C' },
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
  { title: '🌡 محیط',  keys: ['temperatureMin', 'temperatureMax', 'humidityMin', 'humidityMax'] },
  { title: '🌾 تغذیه', keys: ['feedDelivered', 'feedRemaining', 'feedWaste', 'waterAmount', 'waterFillCount', 'waterFillVolume'] },
  { title: '🥚 تولید', keys: ['deathsCount', 'eatingEggs', 'fertileEggs', 'brokenEggs', 'otherEggs', 'weightGender'] },
] as const;

type CorrectableKey = typeof CORRECTABLE_FIELDS[number]['key'];

// هم‌خانواده‌ها (مثل ثبت روزانه)
const PAIRS: [CorrectableKey, CorrectableKey][] = [
  ['temperatureMin', 'temperatureMax'],
  ['humidityMin', 'humidityMax'],
  ['eatingEggs', 'fertileEggs'],
  ['brokenEggs', 'otherEggs'],
  ['feedRemaining', 'feedWaste'],
  ['waterFillCount', 'waterFillVolume'],
];

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

const WEIGHT_GENDER_OPTS = [
  { value: '', label: '— نامشخص —' },
  { value: 'male', label: 'نر' },
  { value: 'female', label: 'ماده' },
  { value: 'mixed', label: 'مخلوط' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  log: DailyLog | null;
  onSave: (logId: string, changes: Partial<DailyLog>, reason: string, notes?: string) => void | Promise<void>;
}

function stripEmoji(str: string): string {
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatOldValue(key: CorrectableKey, val: any): string {
  if (val == null || val === '') return '';
  if (key === 'weightGender') {
    return WEIGHT_GENDER_OPTS.find(o => o.value === val)?.label || String(val);
  }
  return getGlobalFormat().code(String(val));
}

export default function CorrectionModal({ open, onClose, log, onSave }: Props) {
  const fmt = useFormat();
  const [selected, setSelected] = useState<Set<CorrectableKey>>(new Set());
  const [values, setValues] = useState<Partial<Record<CorrectableKey, string>>>({});
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setValues({});
      setReason(REASONS[0]);
      setNotes('');
    }
  }, [open]);

  const effectiveLog = useMemo(() => (log ? applyCorrections(log) : null), [log]);

  if (!log || !effectiveLog) return null;

  const isChanged = (key: CorrectableKey): boolean => {
    if (!selected.has(key)) return false;
    const cur = (effectiveLog as any)[key];
    const nv = values[key];

    if (key === 'weightGender') {
      if (nv === undefined) return false;
      return nv !== (cur || '');
    }

    if (nv === undefined || nv.trim() === '') return false;

    const num = parseFloat(toEn(nv).replace('٫', '.'));
    if (!Number.isFinite(num)) return false;
    return num !== cur;
  };

  const toggle = (key: CorrectableKey) => {
    if (selected.has(key)) {
      setSelected(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setValues(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    }
  };

  const setVal = (key: CorrectableKey, v: string) => {
    setValues(prev => ({ ...prev, [key]: v }));
  };

  const changedCount = Array.from(selected).filter(isChanged).length;
  const multiDeathsBlocked = selected.has('deathsCount') && hasMultiDeaths(log);

  const buildChanges = (): Partial<DailyLog> | null => {
    if (selected.size === 0) return null;
    const changes: Partial<DailyLog> = {};
    let deathsCountNew: number | null = null;

    for (const key of selected) {
      if (key === 'weightGender') {
        const nv = values[key];
        if (nv === undefined) continue;
        const cur = (effectiveLog as any).weightGender || '';
        if (nv === cur) continue;
        (changes as any).weightGender = nv;
        continue;
      }

      const trimmed = (values[key] ?? '').trim();
      if (trimmed === '') continue;

      if (key === 'deathsCount') {
        const num = parseFloat(toEn(trimmed).replace('٫', '.'));
        if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0) continue;
        (changes as any).deathsCount = num;
        deathsCountNew = num;
        continue;
      }

      const num = parseFloat(toEn(trimmed).replace('٫', '.'));
      if (!Number.isFinite(num)) continue;
      (changes as any)[key] = num;
    }

    if (deathsCountNew !== null) {
      if (log.deaths?.length === 1) {
        changes.deaths = [{ ...log.deaths[0], count: deathsCountNew }];
      } else if ((log.deaths?.length || 0) === 0 && deathsCountNew > 0) {
        changes.deaths = [{
          id: uuid(),
          count: deathsCountNew,
          cause: 'unknown',
          notes: 'اصلاح خودکار',
        }];
      }
    }

    if (Object.keys(changes).length === 0) return null;
    return changes;
  };

  const handleSave = async () => {
    if (multiDeathsBlocked) return;
    const changes = buildChanges();
    if (!changes) return;
    await onSave(log.id, changes, reason, notes || undefined);
  };

  const saveDisabled = changedCount === 0 || multiDeathsBlocked;

  // ─── ساخت گروه‌های دو ستونه ───
  const pairedKeys = new Set<string>();
  const groups: CorrectableKey[][] = [];

  for (const [a, b] of PAIRS) {
    const sel = [a, b].filter(k => selected.has(k));
    if (sel.length > 0) {
      groups.push(sel);
      sel.forEach(k => pairedKeys.add(k));
    }
  }

  for (const key of Array.from(selected)) {
    if (!pairedKeys.has(key)) {
      groups.push([key]);
    }
  }

  const renderField = (key: CorrectableKey) => {
    const field = CORRECTABLE_FIELDS.find(f => f.key === key);
    if (!field) return null;
    const oldVal = (effectiveLog as any)[key];
    const isCh = isChanged(key);

    return (
      <div
        key={key}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-2)',
          padding: 'var(--sp-1) 0',
          minHeight: 48,
        }}
      >
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{
            fontSize: 'var(--fs-sm)',
            fontWeight: 700,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {stripEmoji(field.label)}
          </span>
          {isCh && (
            <span style={{
              fontSize: 'var(--fs-2xs, 10px)',
              color: 'var(--accent)',
              background: 'var(--accent-soft, rgba(59,130,246,0.15))',
              padding: '1px 6px',
              borderRadius: '999px',
              fontWeight: 700,
              alignSelf: 'flex-start',
              lineHeight: 1.4,
            }}>
              تغییر کرد
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            height: 36,
            width: 180,
            flexShrink: 0,
            border: `1px solid ${isCh ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--r-sm)',
            overflow: 'hidden',
            background: 'var(--card)',
          }}
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 6px', minWidth: 0 }}>
            {key === 'weightGender' ? (
              <Select
                value={values[key] || ''}
                onChange={e => setVal(key, e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', color: 'var(--text)', textAlign: 'center', cursor: 'pointer' }}
              >
                {WEIGHT_GENDER_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            ) : (
              <>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fmt.code(values[key] || '')}
                  onChange={e => setVal(key, toEn(e.target.value))}
                  placeholder=""
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'monospace', fontSize: 'var(--fs-sm)', color: 'var(--text)', textAlign: 'center', minWidth: 0, fontWeight: 700 }}
                />
                {field.unit && (
                  <span style={{ fontSize: 'var(--fs-2xs, 10px)', color: 'var(--muted)', fontWeight: 600, marginRight: 4, whiteSpace: 'nowrap' }}>
                    {field.unit}
                  </span>
                )}
              </>
            )}
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: `1px solid ${isCh ? 'var(--accent)' : 'var(--border)'}`,
              background: 'transparent',
              color: (oldVal != null && oldVal !== '') ? 'var(--danger)' : 'transparent',
              fontFamily: 'monospace',
              fontSize: 'var(--fs-sm)',
              fontWeight: 700,
              minWidth: 0,
              padding: '0 4px',
            }}
            title="مقدار قبلی"
          >
            {formatOldValue(key, oldVal)}
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggle(key)}
          title="حذف از انتخاب"
          style={{
            width: 24,
            height: 24,
            flexShrink: 0,
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            background: 'var(--card)',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-2xs, 10px)',
          }}
        >
          ✕
        </button>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت اصلاح"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleSave} disabled={saveDisabled}>
            ✓ ثبت اصلاح{changedCount > 0 ? ` (${fmt.count(changedCount)})` : ''}
          </Btn>
          <Btn onClick={onClose}>انصراف</Btn>
        </BtnRow>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.6 }}>
          فیلدهای مورد نظر را انتخاب کنید، سپس مقدار جدید را وارد کنید. می‌توانید چند فیلد را هم‌زمان اصلاح کنید.
        </div>

        {FIELD_GROUPS.map(group => (
          <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
              {group.title}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-1)' }}>
              {group.keys.map(k => {
                const key = k as CorrectableKey;
                const f = CORRECTABLE_FIELDS.find(x => x.key === key);
                if (!f) return null;
                const isSel = selected.has(key);
                const isCh = isChanged(key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggle(key)}
                    style={{
                      padding: '6px 12px',
                      background: isCh
                        ? 'var(--accent)'
                        : isSel
                          ? 'var(--accent-soft, rgba(59,130,246,0.12))'
                          : 'var(--card)',
                      color: isCh ? 'white' : isSel ? 'var(--accent)' : 'var(--muted)',
                      border: `1px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-sm)',
                      fontSize: 'var(--fs-sm)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {f.label}
                    {isCh && <span style={{ fontSize: 'var(--fs-2xs, 11px)' }}>●</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {multiDeathsBlocked && (
          <div style={{
            padding: 'var(--pad-normal)',
            background: 'var(--warn-soft)',
            border: '1px dashed var(--warn)',
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-sm)',
            color: 'var(--warn)',
            lineHeight: 1.7,
          }}>
            ⚠ این لاگ {fmt.count(log.deaths.length)} رکورد تلفات دارد.
            اصلاح تعداد کل روی مجموع اعمال نمی‌شود.
            برای اصلاح، ابتدا از ویرایش لاگ رکوردها را تغییر دهید.
          </div>
        )}

        {selected.size > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-2)',
            padding: 'var(--sp-3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            background: 'var(--card)'
          }}>
            <div style={{
              fontSize: 'var(--fs-sm)',
              fontWeight: 700,
              color: 'var(--text)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--sp-1)'
            }}>
              <span>ویرایش فیلدهای انتخاب‌شده ({fmt.count(selected.size)})</span>
              {changedCount > 0 && (
                <span style={{
                  fontSize: 'var(--fs-2xs, 11px)',
                  color: 'var(--accent)',
                  background: 'var(--accent-soft, rgba(59,130,246,0.12))',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 700,
                }}>
                  {fmt.count(changedCount)} فیلد تغییر کرده
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {groups.map((group, idx) => {
              const fields = group.map(key => renderField(key));
              if (group.length > 1) {
                return <Grid2 key={idx}>{fields}</Grid2>;
              }
              return <div key={idx}>{fields}</div>;
            })}
            </div>
          </div>
        )}

        <Field label="دلیل اصلاح">
          <Select value={reason} onChange={e => setReason(e.target.value)}>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>

        <Field label="توضیحات">
          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="توضیحات" />
        </Field>
      </div>
    </Modal>
  );
}
