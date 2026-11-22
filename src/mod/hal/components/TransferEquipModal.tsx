/**
 * TransferEquipModal — جابجایی تجهیز بین سالن‌ها (Odoo standard)
 */
import { useState } from 'react';
import { Btn, Field, Grid2, Input, Modal, Select } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { todayJ } from '../../flk/api/flocksCalc';
import type { Equipment, TransferLog, Hall, Zone } from '../store';
import SmartSelect from '../../../shr/components/SmartSelect';

interface Props {
  open: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  halls: Hall[];
  zones: Zone[];
  onConfirm: (eq: Equipment, toHallId: string, toZoneId: string, date: string, note: string) => void;
}

export default function TransferEquipModal({ open, onClose, equipment, halls, zones, onConfirm }: Props) {
  const [toHallId, setToHallId] = useState('');
  const [toZoneId, setToZoneId] = useState('');
  const [date, setDate] = useState(todayJ());
  const [note, setNote] = useState('');

  // Reset on open
  const handleClose = () => {
    setToHallId('');
    setToZoneId('');
    setDate(todayJ());
    setNote('');
    onClose();
  };

  if (!equipment) return null;

  const fromHall = halls.find(h => h.id === equipment.hallId);
  const zonesForTarget = zones.filter(z => z.hallId === toHallId);
  const canSave = !!toHallId && toHallId !== equipment.hallId;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`🔀 جابجایی: ${equipment.name}`}
      footer={
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <Btn
            variant="primary"
            onClick={() => {
              if (!canSave) return;
              onConfirm(equipment, toHallId, toZoneId, date, note);
              handleClose();
            }}
            style={{ flex: 1 }}
            disabled={!canSave}
          >
            تایید جابجایی
          </Btn>
          <Btn onClick={handleClose} style={{ flex: 1 }}>لغو</Btn>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="از سالن">
          <div style={{
            height: 38, display: 'flex', alignItems: 'center',
            padding: '0 12px', background: 'var(--bg)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            color: 'var(--muted)', fontWeight: 600,
          }}>
            {fromHall?.name || '— بدون سالن —'}
          </div>
        </Field>

        <Field label="به سالن" required>
          <SmartSelect
            value={toHallId}
            placeholder="— انتخاب کنید —"
            modalTitle="انتخاب سالن مقصد"
            options={halls
              .filter((h) => h.id !== equipment.hallId)
              .map((h) => ({ value: String(h.id), label: String(h.name) }))}
            onChange={(val: string) => {
              setToHallId(val);
              setToZoneId("");
            }}
          />
        </Field>

        {toHallId && (
          <Field label="به بخش (اختیاری)">
            <SmartSelect
            value={toZoneId}
            placeholder="— بدون بخش —"
            modalTitle="انتخاب بخش مقصد"
            options={zonesForTarget.map((z) => ({ value: String(z.id), label: String(z.name) }))}
            onChange={(val: string) => setToZoneId(val)}
          />
          </Field>
        )}

        <Grid2>
          <Field label="تاریخ جابجایی">
            <DatePicker value={date} onChange={setDate} placeholder="انتخاب" autoToday />
          </Field>
        </Grid2>

        <Field label="یادداشت (اختیاری)">
          <Input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="مثلاً: نیاز به تعمیر اساسی"
          />
        </Field>
      </div>
    </Modal>
  );
}
