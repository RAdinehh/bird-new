/**
 * DiscardFormModal — فرم ثبت دور ریخت تخم
 *
 * برای تخم‌هایی که فروخته نمی‌شوند و دور ریخته می‌شوند:
 * شکسته/نرم/کثیف
 */
import { Btn, BtnRow, Field, Grid2, Modal, NumField, Select, Textarea, ErrorBox } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import type { EggDiscard, EggDiscardType, EggDiscardReason } from '../store';

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: {
    date: string;
    type: EggDiscardType;
    count: string;
    reason: EggDiscardReason;
    notes: string;
  };
  setForm: (f: any) => void;
  err: string;
  onSave: () => void;
}

const TYPE_LABELS: Record<EggDiscardType, string> = {
  broken: 'شکسته',
  soft: 'نرم',
  dirty: 'کثیف',
};

const REASON_LABELS: Record<EggDiscardReason, string> = {
  rotten: 'فاسد شده',
  broken_handling: 'شکستن در جابجایی',
  expired: 'تاریخ گذشته',
  contaminated: 'آلوده',
  other: 'سایر',
};

export default function DiscardFormModal(props: Props) {
  const { open, setOpen, form, setForm, err, onSave } = props;

  const num = (s: string) => parseInt(s || '0') || 0;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="🗑 ثبت دور ریخت تخم"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={onSave}>ذخیره</Btn>
          <Btn onClick={() => setOpen(false)}>لغو</Btn>
        </BtnRow>
      }
    >
      <Grid2>
        <Field label="تاریخ" required>
          <DatePicker
            value={form.date}
            onChange={v => setForm({ ...form, date: v })}
            autoToday
          />
        </Field>
        <Field label="نوع" required>
          <Select
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value as EggDiscardType })}
          >
            {(['broken', 'soft', 'dirty'] as const).map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </Select>
        </Field>
      </Grid2>

      <Grid2>
        <Field label="تعداد" required>
          <NumField
            placeholder="۰"
            value={form.count}
            onChange={e => setForm({ ...form, count: e.target.value })}
            unit="عدد"
            min={0}
          />
        </Field>
        <Field label="دلیل" required>
          <Select
            value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value as EggDiscardReason })}
          >
            {(['rotten', 'broken_handling', 'expired', 'contaminated', 'other'] as const).map(r => (
              <option key={r} value={r}>{REASON_LABELS[r]}</option>
            ))}
          </Select>
        </Field>
      </Grid2>

      <Field label="یادداشت">
        <Textarea
          rows={2}
          placeholder="..."
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
        />
      </Field>

      {num(form.count) > 0 && (
        <div style={{
          padding: 'var(--pad-normal)',
          background: 'var(--warn-soft)',
          border: '1px solid var(--warn)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-sm)',
          color: 'var(--warn)',
          fontWeight: 600,
        }}>
          ⚠️ {num(form.count)} تخم {TYPE_LABELS[form.type]} از موجودی کم می‌شود
        </div>
      )}

      {err && <ErrorBox>{err}</ErrorBox>}
    </Modal>
  );
}
