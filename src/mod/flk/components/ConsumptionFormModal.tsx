/**
 * ConsumptionFormModal.tsx — فرم ثبت دان/آب
 * فاز ۸b — سلسله مراتب منطقی: داده اصلی + جزئیات
 */
import { useState } from 'react';
import { Modal, Btn, BtnRow, Field, Grid2, Select } from '../../../shr/components/ui';
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

const SOURCE_LABEL: Record<string, string> = {
  bulk_manual: '🍽️ پر کردن سطل',
  daily_manual: '📝 روزانه دستی',
  sensor_scale: '⚖️ سنسور وزن',
  sensor_level: '📊 سنسور سطح',
  auto_feeder: '🤖 اتومات هوشمند',
};

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

      {/* ═══ بخش ۱ — داده اصلی ═══ */}
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
          <input
            type="text"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={amountPlaceholder}
            inputMode="decimal"
            style={inputStyle}
          />
        </Field>
        {showSex ? (
          <Field label="برای کدام جنس؟">
            <Select value={sex} onChange={e => setSex(e.target.value as '' | 'male' | 'female' | 'mixed')}>
              <option value="">کل گله (نامشخص)</option>
              <option value="male">♂ نر</option>
              <option value="female">♀ ماده</option>
              <option value="mixed">مخلوط</option>
            </Select>
          </Field>
        ) : (
          <Field label=" ">
            <div style={{
              height: 38,
              display: 'flex',
              alignItems: 'center',
              fontSize: 10,
              color: 'var(--muted)',
              padding: '0 var(--sp-3)',
            }}>
              {type === 'water' ? '💧 آب — بدون تفکیک جنسیت' : 'ℹ️ گله بدون تفکیک'}
            </div>
          </Field>
        )}
      </Grid2>

      {/* ═══ بخش ۲ — جزئیات اختیاری ═══ */}
      <div style={{ marginTop: 12 }}>
        <SectionHeader icon="📝" label="جزئیات" hint="— اختیاری" />

        <Field label="یادداشت">
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="مثلاً پر کردن سطل ۱ و ۲"
            style={inputStyle}
          />
        </Field>

        <details style={{ marginTop: 8 }}>
          <summary style={{
            cursor: 'pointer',
            padding: '8px 10px',
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-sm)',
            color: 'var(--text)',
            userSelect: 'none',
            listStyle: 'none',
          }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <span style={{ color: 'var(--muted)', fontSize: 11, marginLeft: 4 }}>روش ثبت</span>
                <b style={{ color: 'var(--accent)' }}>{SOURCE_LABEL[source]}</b>
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 10 }}>▾ تغییر</span>
            </span>
          </summary>
          <div style={{ padding: '8px 4px 0' }}>
            <Select value={source} onChange={e => setSource(e.target.value as any)}>
              <option value="bulk_manual">🍽️ پر کردن سطل</option>
              <option value="daily_manual">📝 روزانه دستی</option>
              <option value="sensor_scale">⚖️ سنسور وزن</option>
              <option value="sensor_level">📊 سنسور سطح</option>
              <option value="auto_feeder">🤖 اتومات هوشمند</option>
            </Select>
            {source === 'sensor_level' && (
              <div style={{ fontSize: 10, color: 'var(--warn)', padding: '4px 8px', background: 'var(--warn-soft)', borderRadius: 'var(--r-sm)', marginTop: 6 }}>
                ⚠️ سنسور سطح — مقدار «تخمینی» ثبت می‌شود
              </div>
            )}
            {source === 'sensor_scale' && (
              <div style={{ fontSize: 10, color: 'var(--accent)', padding: '4px 8px', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)', marginTop: 6 }}>
                ✓ سنسور وزن — دقت بالا
              </div>
            )}
            {source === 'auto_feeder' && (
              <div style={{ fontSize: 10, color: 'var(--info)', padding: '4px 8px', background: 'var(--info-soft)', borderRadius: 'var(--r-sm)', marginTop: 6 }}>
                ℹ️ اتومات — ممکن است با سیستم تلاقی کند
              </div>
            )}
          </div>
        </details>
      </div>

      <BtnRow>
        <Btn variant="primary" onClick={handleSave}>ثبت</Btn>
        <Btn onClick={onClose}>لغو</Btn>
      </BtnRow>
    </Modal>
  );
}
