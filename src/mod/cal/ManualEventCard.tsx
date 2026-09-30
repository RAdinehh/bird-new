import { useState } from 'react';
import { useManual, TYPE_OPTIONS, type ManualEvent } from './manual';
import { TYPE_COLORS, statusOf } from './store';
import { Btn, BtnRow, Field, Grid2, Input, Modal, Select } from '../../shr/components/ui';
import DatePicker from '../../shr/components/DatePicker';
import TimePicker from '../../shr/components/TimePicker';
import { toFa } from '../../shr/utils/fa';

interface Props {
  event: ManualEvent;
  onChanged: () => void;
}

export default function ManualEventCard({ event, onChanged }: Props) {
  const { update, remove, toggleDone } = useManual();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [type, setType] = useState(event.type);
  const [notes, setNotes] = useState(event.notes);

  const colors = TYPE_COLORS[event.type];
  const status = statusOf(event.date);
  const typeLabel = TYPE_OPTIONS.find(o => o.id === event.type)?.label || '';

  const handleSave = () => {
    if (title.trim() === '') return;
    update(event.id, { title: title.trim(), date, time, type, notes: notes.trim() });
    setEditOpen(false);
    onChanged();
  };

  const handleDelete = () => {
    remove(event.id);
    setConfirmOpen(false);
    onChanged();
  };

  const handleToggleDone = () => {
    toggleDone(event.id);
    onChanged();
  };

  return (
    <>
      <div style={{
        background: 'var(--card)',
        border: '1px solid ' + (event.done ? 'var(--border)' : (status === 'overdue' ? 'var(--danger)' : 'var(--border)')),
        borderRadius: 'var(--r-lg)',
        padding: 'var(--pad-comfy)',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
        opacity: event.done ? 0.6 : 1
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 4,
          background: event.done ? 'var(--dim)' : colors.dot
        }} />

        {/* چک‌باکس انجام */}
        <button
          type="button"
          onClick={handleToggleDone}
          style={{
            width: 24, height: 24,
            borderRadius: 6,
            background: event.done ? 'var(--accent)' : 'transparent',
            border: '2px solid ' + (event.done ? 'var(--accent)' : 'var(--dim)'),
            color: event.done ? 'var(--avatar-text)' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: 0,
            marginTop: 8
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--fs-base)', fontWeight: 700,
            textDecoration: event.done ? 'line-through' : 'none',
            marginBottom: 4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {event.title}
          </div>

          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span>📅 {toFa(event.date)}</span>
            {event.time ? <span>⏰ {toFa(event.time)}</span> : null}
            <span style={{ color: colors.text }}>🏷 {typeLabel}</span>
          </div>

          {event.notes ? (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--dim)', lineHeight: 1.7 }}>
              {event.notes}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <Btn size="sm" onClick={() => setEditOpen(true)} style={{ flex: 1 }}>ویرایش</Btn>
            <Btn size="sm" onClick={() => setConfirmOpen(true)} style={{ flex: 1 }}>حذف</Btn>
          </div>
        </div>
      </div>

      {/* مودال ویرایش */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="ویرایش رویداد"
        footer={<BtnRow><Btn variant="primary" onClick={handleSave}>ذخیره</Btn><Btn onClick={() => setEditOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Field label="عنوان" required>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
        </Field>
        <Grid2>
          <Field label="تاریخ" required>
            <DatePicker value={date} onChange={setDate} />
          </Field>
          <Field label="ساعت">
            <TimePicker value={time} onChange={setTime} placeholder="انتخاب" />
          </Field>
        </Grid2>
        <Field label="نوع">
          <Select value={type} onChange={e => setType(e.target.value as any)}>
            {TYPE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.icon} {o.label}</option>)}
          </Select>
        </Field>
        <Field label="یادداشت">
          <Input value={notes} onChange={e => setNotes(e.target.value)} />
        </Field>
      </Modal>

      {/* مودال تأیید حذف */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="حذف رویداد"
        footer={<BtnRow><Btn variant="danger" onClick={handleDelete}>حذف کن</Btn><Btn onClick={() => setConfirmOpen(false)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          حذف <b>{event.title}</b>؟
          <br />
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>این عمل قابل بازگشت نیست.</span>
        </div>
      </Modal>
    </>
  );
}
