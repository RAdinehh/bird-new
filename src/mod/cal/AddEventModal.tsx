import { IconCalendar, IconNote, IconSyringe, IconLeaf, IconEgg, IconDollar, IconBell } from '../../shr/icons';
import { useState } from 'react';
import { useManual, TYPE_OPTIONS } from './manual';
import { todayJalali, type EventType } from './store';
import { Btn, BtnRow, Field, Grid2, Input, Modal, Select, ErrorBox , Textarea } from '../../shr/components/ui';
import DatePicker from '../../shr/components/DatePicker';
import TimePicker from '../../shr/components/TimePicker';

interface Props {
  open: boolean;
  onClose: () => void;
  prefillDate?: string;
}

const EVENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  daily: <IconNote size={16} />,
  vaccine: <IconSyringe size={16} />,
  herbal: <IconLeaf size={16} />,
  hatch: <IconEgg size={16} />,
  payment: <IconDollar size={16} />,
  finance: <IconBell size={16} />,
};

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
    if (title.trim() === '') { setErr('عنوان را وارد کنید'); return; }
    if (date.trim() === '') { setErr('تاریخ را وارد کنید'); return; }

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
      title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconCalendar size={16} /> افزودن رویداد</span>}
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleSave}>ذخیره</Btn>
          <Btn onClick={handleCancel}>لغو</Btn>
        </BtnRow>
      }
    >
      <Field label="عنوان" required>
        <Input
          placeholder="عنوان"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </Field>

      <Grid2>
        <Field label="تاریخ" required>
          <DatePicker value={date} onChange={setDate}  autoToday />
        </Field>
        <Field label="ساعت" hint="اختیاری">
          <TimePicker value={time} onChange={setTime} placeholder="انتخاب ساعت" />
        </Field>
      </Grid2>

      <Field label="نوع رویداد">
        <Select value={type} onChange={e => setType(e.target.value as EventType)}>
          {TYPE_OPTIONS.map(o => (
            <option key={o.id} value={o.id} data-icon={EVENT_TYPE_ICONS[o.id]}>{o.label}</option>
          ))}
        </Select>
      </Field>

      <Field label="یادداشت">
            <Textarea
          placeholder="توضیحات"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
          </Field>

      <ErrorBox>{err}</ErrorBox>

      <div style={{
        padding: 'var(--pad-normal)',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        fontSize: 'var(--fs-xs)',
        color: 'var(--accent)',
        textAlign: 'center',
        lineHeight: 1.7
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><IconNote size={14} /> این رویداد فقط برای یادآوری است — روی داده‌های دیگر تأثیر ندارد.</span>
      </div>
    </Modal>
  );
}
