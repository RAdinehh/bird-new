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
  const maleNum = toEnNum(maleStr);
  const femaleNum = toEnNum(femaleStr);
  const unknownNum = toEnNum(unknownStr);
  const totalInput = maleNum + femaleNum + unknownNum;
  const diff = totalInput - currentCount;
  const mismatch = diff !== 0;
  const noInput = maleNum + femaleNum === 0;

  useEffect(() => {
    if (open && flock) {
      setMaleStr(String(flock.maleCount ?? 0));
      setFemaleStr(String(flock.femaleCount ?? 0));
      setUnknownStr(String(flock.unknownCount ?? 0));
      setDate(todayJalali());
      setNote('');
      setErr('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flock?.id]);

  const handleSave = () => {
    if (!flock) return;
    if (mismatch) {
      setErr(`جمع (${totalInput}) با تعداد زنده (${currentCount}) برابر نیست — اختلاف: ${diff}`);
      return;
    }
    if (noInput) { setErr('حداقل یکی از نر یا ماده باید بیشتر از صفر باشد'); return; }
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
          <Btn variant="primary" onClick={handleSave} disabled={mismatch || noInput}>
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
            background: mismatch ? 'var(--danger-soft)' : 'var(--accent-soft)',
            border: `1px solid ${mismatch ? 'var(--danger)' : 'var(--accent-border)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 700,
            color: mismatch ? 'var(--danger)' : 'var(--accent)',
            textAlign: 'center',
          }}>
            {mismatch
              ? `${toFa(totalInput.toLocaleString('fa-IR'))} / ${toFa(currentCount.toLocaleString('fa-IR'))}`
              : `✓ ${toFa(totalInput.toLocaleString('fa-IR'))} = ${toFa(currentCount.toLocaleString('fa-IR'))}`}
          </div>
        </Field>
      </Grid2>

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
