/**
 * SexingModal — تفکیک جنسیت گله (اولین یا بازشماری)
 * فیلدهای نر، ماده، نامشخص همه editable.
 * Invariant: male + female + unknown === currentCount
 */
import { useState, useEffect } from 'react';
import { Modal, Btn, BtnRow, Field, Grid2, NumField, Input } from '../../../shr/components/ui';
import { HelpIcon } from '../../../shr/components/ui/HelpIcon';
import DatePicker from '../../../shr/components/DatePicker';
import { HELP } from '../../../shr/help/helpTexts';
import { useFlk, type Flock } from '../store';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  flock: Flock | null;
}

function todayJalali(): string {
  try {
    const d = new Date();
    const parts = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(d);
    const y = parts.find(p => p.type === 'year')?.value || '';
    const m = parts.find(p => p.type === 'month')?.value || '';
    const dd = parts.find(p => p.type === 'day')?.value || '';
    return `${y}/${m}/${dd}`;
  } catch { return ''; }
}

function toEnNum(s: string): number {
  const en = s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const n = parseInt(en.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

export default function SexingModal({ open, onClose, flock }: Props) {
  const recordSexing = useFlk(s => s.recordSexing);

  const [maleStr, setMaleStr] = useState('');
  const [femaleStr, setFemaleStr] = useState('');
  const [unknownStr, setUnknownStr] = useState('');
  const [date, setDate] = useState(todayJalali());
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const currentCount = flock?.currentCount ?? 0;
  const maleRaw = toEnNum(maleStr);
  const femaleRaw = toEnNum(femaleStr);
  const unknownRaw = toEnNum(unknownStr);

  const isMaleEmpty = maleStr.trim() === '';
  const isFemaleEmpty = femaleStr.trim() === '';
  const isUnknownEmpty = unknownStr.trim() === '';

  // 🆕 Smart Total: سه‌فیلد هوشمند
  const remaining = Math.max(0, currentCount - maleRaw - femaleRaw - unknownRaw);
  let maleNum = maleRaw;
  let femaleNum = femaleRaw;
  let unknownNum = unknownRaw;

  let autoFillField: 'male' | 'female' | 'unknown' | null = null;
  let autoFillValue = 0;

  if (isUnknownEmpty && remaining > 0) {
    unknownNum = remaining;
    autoFillField = 'unknown';
    autoFillValue = remaining;
  } else if (!isUnknownEmpty && isMaleEmpty && remaining > 0) {
    maleNum = remaining;
    autoFillField = 'male';
    autoFillValue = remaining;
  } else if (!isUnknownEmpty && !isMaleEmpty && isFemaleEmpty && remaining > 0) {
    femaleNum = remaining;
    autoFillField = 'female';
    autoFillValue = remaining;
  }

  const totalInput = maleNum + femaleNum + unknownNum;
  const diff = totalInput - currentCount;
  const mismatch = diff !== 0;
  const userFilledCount = (!isMaleEmpty ? 1 : 0) + (!isFemaleEmpty ? 1 : 0) + (!isUnknownEmpty ? 1 : 0);
  const isIncomplete = userFilledCount < 2;
  const noInput = userFilledCount === 0;

  useEffect(() => {
    if (open && flock) {
      setMaleStr(String(flock.maleCount ?? 0));
      setFemaleStr(String(flock.femaleCount ?? 0));
      setUnknownStr(flock.unknownCount ? String(flock.unknownCount) : '');
      setDate(todayJalali());
      setNote('');
      setErr('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flock?.id]);

  const handleSave = async () => {
    if (!flock) return;
    if (mismatch) {
      setErr(`جمع (${totalInput}) با تعداد زنده (${currentCount}) برابر نیست — اختلاف: ${diff}`);
      return;
    }
    if (noInput) { setErr('حداقل یکی از نر یا ماده باید بیشتر از صفر باشد'); return; }

    // 🆕 کانفرم قبل از ثبت (فاز ۳ تکمیلی)
    const _isFirst = !flock.genderSplitAt;
    const _before = {
      m: flock.maleCount ?? 0,
      f: flock.femaleCount ?? 0,
      u: flock.unknownCount ?? 0,
    };
    const _msg = _isFirst
      ? `تفکیک اولیه گله «${flock.name}»:\n♂ ${maleNum} · ♀ ${femaleNum} · ? ${unknownNum}\nجمع: ${totalInput} = زنده: ${currentCount}`
      : `تغییر تفکیک گله «${flock.name}»:\nاز: ♂ ${_before.m} · ♀ ${_before.f} · ? ${_before.u}\nبه: ♂ ${maleNum} · ♀ ${femaleNum} · ? ${unknownNum}\n\nتاریخچه قبلی حفظ می‌شود.`;
    const _ok = await showConfirmAsync('تأیید تفکیک جنسیت', _msg, {
      confirmText: _isFirst ? 'ثبت تفکیک' : 'اعمال تغییر',
    });
    if (!_ok) return;

    try {
      recordSexing(flock.id, {
        male: maleNum,
        female: femaleNum,
        unknown: unknownNum,
        date: date || todayJalali(),
        note: note.trim() || undefined,
      });
      toastMsg.success('تفکیک جنسیت ثبت شد');
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'خطا در ثبت');
    }
  };

  if (!flock) return null;

  const isFirst = !flock.genderSplitAt;
  const isFinal = unknownNum === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📋 تفکیک جنسیت"
      size="md"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleSave} disabled={mismatch || isIncomplete}>
            ✓ ثبت تفکیک
          </Btn>
          <Btn onClick={onClose}>انصراف</Btn>
        </BtnRow>
      }
    >
      <div style={{
        padding: 'var(--pad-normal)',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        display: 'flex', flexDirection: 'column', gap: 4,
        fontSize: 'var(--fs-sm)', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontWeight: 700 }}>{flock.name}</span>
          <HelpIcon text={HELP.flk.sexing} />
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
          تعداد زنده: <b style={{ color: 'var(--text)' }}>{toFa(currentCount.toLocaleString('fa-IR'))}</b> پرنده
        </div>
      </div>

      <Grid2>
        <Field label="تعداد نر" required>
          <NumField
            value={maleStr}
            onChange={e => setMaleStr(e.target.value)}
            placeholder="۰"
            unit="پرنده"
          />
        </Field>
        <Field label="تعداد ماده" required>
          <NumField
            value={femaleStr}
            onChange={e => setFemaleStr(e.target.value)}
            placeholder="۰"
            unit="پرنده"
          />
        </Field>
      </Grid2>

      <Grid2>
        <Field label="تعداد نامشخص">
          <NumField
            value={unknownStr}
            onChange={e => setUnknownStr(e.target.value)}
            placeholder="۰"
            unit="پرنده"
          />
        </Field>
        <Field label="جمع کل">
          <div style={{
            padding: '10px 12px',
            background: 'var(--card)',
            border: `1px solid ${isIncomplete ? 'var(--border)' : mismatch ? 'var(--danger)' : 'var(--accent)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 700,
            color: isIncomplete ? 'var(--muted)' : mismatch ? 'var(--danger)' : 'var(--accent)',
            textAlign: 'center',
          }}>
            {isIncomplete
              ? `— / ${toFa(currentCount.toLocaleString('fa-IR'))}`
              : mismatch
                ? `✗ ${toFa(totalInput.toLocaleString('fa-IR'))} / ${toFa(currentCount.toLocaleString('fa-IR'))}`
                : `✓ ${toFa(totalInput.toLocaleString('fa-IR'))} = ${toFa(currentCount.toLocaleString('fa-IR'))}`}
          </div>
        </Field>
      </Grid2>

      {/* 🆕 Smart Guide — اولویت‌بندی بر اساس completeness */}
      {mismatch ? (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', marginBottom: 8, lineHeight: 1.6 }}>
          ⚠️ {toFa(Math.abs(diff))} پرنده {diff > 0 ? 'بیشتر' : 'کمتر'} — ثبت‌شده {toFa(totalInput)}، نیاز {toFa(currentCount)}
        </div>
      ) : isIncomplete && noInput ? (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 8, lineHeight: 1.6 }}>
          💡 تعداد نر یا ماده را وارد کنید — سومین فیلد خودکار محاسبه می‌شود
        </div>
      ) : isIncomplete ? (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--info)', marginBottom: 8, lineHeight: 1.6 }}>
          💡 یک فیلد دیگر وارد کنید — سومین فیلد خودکار محاسبه می‌شود
        </div>
      ) : autoFillField ? (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--info)', marginBottom: 8, lineHeight: 1.6 }}>
          💡 {autoFillField === 'male' ? 'نر' : autoFillField === 'female' ? 'ماده' : 'نامشخص'} = <b>{toFa(autoFillValue)}</b> (خودکار محاسبه شد)
        </div>
      ) : null}

      <Field label="تاریخ تفکیک">
        <DatePicker value={date} onChange={setDate} />
      </Field>

      <Field label="یادداشت (اختیاری)">
        <Input value={note} onChange={e => setNote(e.target.value)} placeholder="مثلاً بازشماری دقیق" />
      </Field>

      <div style={{
        marginTop: 12, padding: 'var(--pad-tight)',
        background: 'var(--input-bg)',
        borderRadius: 'var(--r-sm)',
        fontSize: 'var(--fs-xs)',
        color: 'var(--muted)',
      }}>
        {isFirst
          ? 'ℹ️ این اولین تفکیک است. پس از ثبت، گله به‌عنوان «تفکیک‌شده» علامت می‌خورد.'
          : isFinal && flock.unknownCount && flock.unknownCount > 0
            ? 'ℹ️ تکمیل تفکیک — همه پرنده‌ها تعیین جنسیت می‌شوند.'
            : 'ℹ️ تفکیک مجدد — تاریخچه قبلی حفظ می‌شود.'}
      </div>

      {err && (
        <div style={{
          marginTop: 8, padding: 'var(--pad-tight)',
          background: 'var(--danger-soft)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--r-sm)',
          fontSize: 'var(--fs-xs)', color: 'var(--danger)',
        }}>
          ⚠️ {err}
        </div>
      )}
    </Modal>
  );
}
