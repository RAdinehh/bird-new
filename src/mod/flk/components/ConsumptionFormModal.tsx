/**
 * ConsumptionFormModal.tsx — فرم ثبت دان/آب
 * فاز ۸b — داده اصلی دو ستونه، جزئیات تک ستونه
 */
import { useState } from 'react';
import { Modal, Btn, BtnRow, Field, Grid2, Select, NumField, Textarea } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { useFlk, type Flock } from '../store';
import { todayJ } from '../api/flocksCalc';
import { toastMsg } from '../../../cor/store/toast';
import { toEn } from '../../../shr/utils/fa';
import { HELP } from '../../../shr/help/helpTexts';

interface Props {
  open: boolean;
  onClose: () => void;
  flock: Flock;
}

// الگوی group header — match dlg/FormModal.tsx
const GROUP_TITLE: React.CSSProperties = {
  fontSize: 'var(--fs-base)',
  color: 'var(--text)',
  fontWeight: 700,
  letterSpacing: '.3px',
  paddingTop: 8,
  paddingBottom: 6,
};

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
      sex: type === 'feed' && hasSplit ? sex : '',
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

      {/* ═══ داده اصلی — دو ستونه ═══ */}
      <div style={GROUP_TITLE}>📥 داده اصلی</div>

      <Grid2>
        <Field label="تاریخ" required>
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <Field label="نوع" required>
          <Select value={type} onChange={e => setType(e.target.value as 'feed' | 'water')}>
            <option value="feed">🍽️ دان</option>
            <option value="water">💧 آب</option>
          </Select>
        </Field>
      </Grid2>

      <Grid2>
        {type === 'water' ? (
          <Field label="جنسیت" hint="آب بین همه مشترک است">
            <Select value="" disabled>
              <option value="">— بدون تفکیک —</option>
            </Select>
          </Field>
        ) : hasSplit ? (
          <Field label="جنسیت">
            <Select value={sex} onChange={e => setSex(e.target.value as '' | 'male' | 'female' | 'mixed')}>
              <option value="">کل گله</option>
              <option value="male">♂ نر</option>
              <option value="female">♀ ماده</option>
              <option value="mixed">مخلوط</option>
            </Select>
          </Field>
        ) : (
          <Field label="جنسیت" hint={`گله «${flock.name}» تفکیک نشده`}>
            <Select value="" disabled>
              <option value="">— ابتدا تفکیک کنید —</option>
            </Select>
          </Field>
        )}
        <Field label={`مقدار (${unit})`} required>
          <NumField
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={amountPlaceholder}
            unit={unit}
          />
        </Field>
      </Grid2>

      {/* ═══ جزئیات — تک ستونه ═══ */}
      <div style={GROUP_TITLE}>📝 جزئیات — اختیاری</div>

      <Field label="روش توزیع" help={HELP.flk.consumptionSource}>
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

      {source === 'sensor_level' && (
        <div style={{
          fontSize: 10,
          color: 'var(--warn)',
          padding: '6px 10px',
          background: 'var(--warn-soft)',
          border: '1px solid var(--warn)',
          borderRadius: 'var(--r-sm)',
          marginTop: 4,
        }}>
          ⚠️ سنسور سطح — مقدار به‌عنوان «تخمینی» ثبت می‌شود
        </div>
      )}

      <BtnRow>
        <Btn variant="primary" onClick={handleSave}>ثبت</Btn>
        <Btn onClick={onClose}>لغو</Btn>
      </BtnRow>
    </Modal>
  );
}
