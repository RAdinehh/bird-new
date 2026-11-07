/**
 * ConsumptionFormModal.tsx — فرم ثبت دان/آب
 * فاز ۸b — write path برای ConsumptionEvent
 */
import { useState } from 'react';
import { Modal, Btn, BtnRow, Field, Select } from '../../../shr/components/ui';
import { useFlk, type Flock } from '../store';
import { todayJ } from '../api/flocksCalc';
import { toastMsg } from '../../../cor/store/toast';
import { toEn } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  flock: Flock;
}

const inputStyle = {
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  height: 38,
  padding: '0 var(--sp-3)',
  fontFamily: 'inherit',
  fontSize: 'var(--fs-sm)',
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
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
      confidence: 'exact',
      notes: notes.trim(),
    });
    toastMsg.success(type === 'feed' ? 'دان ثبت شد' : 'آب ثبت شد');
    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={'🍽️ ثبت دان/آب — ' + flock.name}>
      <Field label="نوع" required>
        <Select value={type} onChange={e => setType(e.target.value as 'feed' | 'water')}>
          <option value="feed">🍽️ دان</option>
          <option value="water">💧 آب</option>
        </Select>
      </Field>

      <Field label="تاریخ" required>
        <input
          type="text"
          value={date}
          onChange={e => setDate(e.target.value)}
          placeholder="1405/08/10"
          dir="ltr"
          style={inputStyle}
        />
      </Field>

      <Field label={'مقدار (' + unit + ')'} required>
        <input
          type="text"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="۰"
          inputMode="decimal"
          style={inputStyle}
        />
      </Field>

      {hasSplit && type === 'feed' && (
        <Field label="جنسیت">
          <Select value={sex} onChange={e => setSex(e.target.value as '' | 'male' | 'female' | 'mixed')}>
            <option value="">نامشخص (کل گله)</option>
            <option value="male">♂ نر</option>
            <option value="female">♀ ماده</option>
            <option value="mixed">مخلوط</option>
          </Select>
        </Field>
      )}

      <Field label="روش ثبت">
        <Select value={source} onChange={e => setSource(e.target.value as any)}>
          <option value="bulk_manual">🍽️ پر کردن سطل</option>
          <option value="daily_manual">📝 روزانه دستی</option>
          <option value="sensor_scale">⚖️ سنسور وزن</option>
          <option value="sensor_level">📊 سنسور سطح</option>
          <option value="auto_feeder">🤖 اتومات هوشمند</option>
        </Select>
      </Field>

      <Field label="یادداشت (اختیاری)">
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="مثلاً پر کردن سطل ۱ و ۲"
          style={inputStyle}
        />
      </Field>

      <BtnRow>
        <Btn variant="primary" onClick={handleSave}>ثبت</Btn>
        <Btn onClick={onClose}>لغو</Btn>
      </BtnRow>
    </Modal>
  );
}
