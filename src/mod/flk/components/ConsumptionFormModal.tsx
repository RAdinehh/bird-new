/**
 * ConsumptionFormModal.tsx — فرم ثبت دان/آب
 * فاز ۸b — نسخه نهایی با match کامل به الگوهای موجود
 */
import { useState } from 'react';
import { Modal, Btn, BtnRow, Field, Grid2, Select, NumField, Textarea } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { useFlk, type Flock } from '../store';
import { todayJ } from '../api/flocksCalc';
import { toastMsg } from '../../../cor/store/toast';
import { toEn } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  flock: Flock;
}

function SectionHeader({ icon, label, hint }: { icon: string; label: string; hint?: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      paddingBottom: 6,
      marginBottom: 8,
      marginTop: 4,
      borderBottom: '1px dashed var(--border)',
      fontSize: 'var(--fs-xs)',
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <b style={{ color: 'var(--text)' }}>{label}</b>
      {hint && <span style={{ color: 'var(--muted)', fontSize: 10 }}>{hint}</span>}
    </div>
  );
}

export default function ConsumptionFormModal({ open, onClose, flock }: Props) {
  const [type, setType] = useState<'feed' | 'water'>('feed');
  const [date, setDate] = useState(todayJ());
  const [amount, setAmount] = useState('');
  const [sex, setSex] = useState<'' | 'male' | 'female' | 'mixed'>('');
  const [source, setSource] = useState<'bulk_manual' | 'daily_manual' | 'sensor_scale' | 'sensor_level' | 'auto_feeder'>('bulk_manual');
  const [notes, setNotes] = useState('');
  const add = useFlk(s => s.addConsumptionEvent);

  const num = parseFloat(toEn(amount).replace('٫', '.')) || 0;
  const unit = type === 'feed' ? 'kg' : 'L';
  const hasSplit = !!flock.genderSplitAt;
  const showSex = type === 'feed' && hasSplit;
  const amountPlaceholder = type === 'feed' ? 'مثلاً ۲۵' : 'مثلاً ۵۰';
  const confidence: 'exact' | 'estimated' = source === 'sensor_level' ? 'estimated' : 'exact';

  const handleSave = () => {
    if (num <= 0) {
      toastMsg.error('مقدار را وارد کنید');
      return;
    }
    if (!date) {
      toastMsg.error('تاریخ را وارد کنید');
      return;
    }
    add({
      flockId: flock.id,
      type,
      date,
      amount: num,
      unit,
      sex: showSex ? sex : '',
      source,
      confidence,
      notes: notes.trim(),
    });
    toastMsg.success(type === 'feed' ? 'دان ثبت شد' : 'آب ثبت شد');
    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={'🍽️ ثبت دان/آب — ' + flock.name}>

      {/* ═══ داده اصلی ═══ */}
      <SectionHeader icon="📥" label="داده اصلی" hint="— الزامی" />

      <Grid2>
        <Field label="نوع" required>
          <Select value={type} onChange={e => setType(e.target.value as 'feed' | 'water')}>
            <option value="feed">🍽️ دان</option>
            <option value="water">💧 آب</option>
          </Select>
        </Field>
        <Field label="تاریخ" required>
          <DatePicker value={date} onChange={setDate} />
        </Field>
      </Grid2>

      <Grid2>
        <Field label={'مقدار (' + unit + ')'} required>
          <NumField
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={amountPlaceholder}
            unit={unit}
          />
        </Field>

        {showSex ? (
          <Field label="جنسیت">
            <Select value={sex} onChange={e => setSex(e.target.value as '' | 'male' | 'female' | 'mixed')}>
              <option value="">کل گله (نامشخص)</option>
              <option value="male">♂ نر</option>
              <option value="female">♀ ماده</option>
              <option value="mixed">مخلوط</option>
            </Select>
          </Field>
        ) : type === 'water' ? (
          <Field label="جنسیت" hint="آب بین همه پرنده‌ها مشترک است">
            <Select value="" disabled>
              <option value="">— آب بدون تفکیک —</option>
            </Select>
          </Field>
        ) : (
          <Field label="جنسیت" hint={`گله «${flock.name}» هنوز تفکیک نشده`}>
            <Select value="" disabled>
              <option value="">— ابتدا از گله تفکیک کنید —</option>
            </Select>
          </Field>
        )}
      </Grid2>

      {/* ═══ جزئیات ═══ */}
      <div style={{ marginTop: 12 }}>
        <SectionHeader icon="📝" label="جزئیات" hint="— اختیاری" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 8 }}>
          <Field label="روش ثبت">
            <Select value={source} onChange={e => setSource(e.target.value as any)}>
              <option value="bulk_manual">🍽️ پر کردن سطل</option>
              <option value="daily_manual">📝 روزانه دستی</option>
              <option value="sensor_scale">⚖️ سنسور وزن</option>
              <option value="sensor_level">📊 سنسور سطح</option>
              <option value="auto_feeder">🤖 اتومات هوشمند</option>
            </Select>
          </Field>
          <Field label="یادداشت">
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="مثلاً پر کردن سطل ۱ و ۲ — یا هر توضیح دیگر"
              rows={2}
            />
          </Field>
        </div>

        {source === 'sensor_level' && (
          <div style={{ fontSize: 10, color: 'var(--warn)', padding: '6px 10px', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-sm)', marginTop: 6 }}>
            ⚠️ سنسور سطح — مقدار به‌عنوان «تخمینی» ثبت می‌شود
          </div>
        )}
      </div>

      <BtnRow>
        <Btn variant="primary" onClick={handleSave}>ثبت</Btn>
        <Btn onClick={onClose}>لغو</Btn>
      </BtnRow>
    </Modal>
  );
}
