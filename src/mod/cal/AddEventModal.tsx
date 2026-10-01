import { useState } from 'react';
import { useManual, TYPE_OPTIONS } from './manual';
import { todayJalali, type EventType } from './store';
import { Btn, BtnRow, Field, Grid2, Input, Modal, Select, ErrorBox } from '../../shr/components/ui';
import DatePicker from '../../shr/components/DatePicker';
import TimePicker from '../../shr/components/TimePicker';
import { toFa } from '../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  prefillDate?: string;
}

export default function AddEventModal({ open, onClose, prefillDate }: Props) {
  const { add } = useManual();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(prefillDate || todayJalali());
  const [time, setTime] = useState('');
  const [type, setType] = useState<EventType>('daily');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  const reset = () => {
    setTitle('');
    setDate(prefillDate || todayJalali());
    setTime('');
    setType('daily');
    setNotes('');
    setErr('');
  };

  const handleSave = () => {
    if (title.trim() === '') { setErr('عنوان اجباری است'); return; }
    if (date.trim() === '') { setErr('تاریخ اجباری است'); return; }

    add({
      title: title.trim(),
      date: date.trim(),
      time,
      type,
      notes: notes.trim()
    });

    reset();
    onClose();
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title="📅 افزودن رویداد"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleSave}>ذخیره</Btn>
          <Btn onClick={handleCancel}>لغو</Btn>
        </BtnRow>
      }
    >
      <Field label="عنوان" required>
        <Input
          placeholder="مثلاً — واکسن نیوکاسل"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </Field>

      <Grid2>
        <Field label="تاریخ" required>
          <DatePicker value={date} onChange={setDate}  autoToday />
        </Field>
        <Field label="ساعت" hint="اختیاری">
          <TimePicker value={time} onChange={setTime} placeholder="انتخاب" />
        </Field>
      </Grid2>

      <Field label="نوع رویداد">
        <Select value={type} onChange={e => setType(e.target.value as EventType)}>
          {TYPE_OPTIONS.map(o => (
            <option key={o.id} value={o.id}>{o.icon} {o.label}</option>
          ))}
        </Select>
      </Field>

      <Field label="یادداشت">
        <Input
          placeholder="..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </Field>

      <ErrorBox>{err}</ErrorBox>

      <div style={{
        padding: 'var(--pad-normal)',
        background: 'var(--info-soft)',
        border: '1px solid var(--info)',
        borderRadius: 'var(--r-md)',
        fontSize: 'var(--fs-xs)',
        color: 'var(--info)',
        textAlign: 'center',
        lineHeight: 1.7
      }}>
        💡 این رویداد فقط برای یادآوری است — روی داده‌های دیگر تأثیر ندارد.
      </div>
    </Modal>
  );
}
