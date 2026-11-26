/**
 * TransferEquipModal — جابجایی تجهیز بین سالن‌ها و بخش‌ها (Odoo standard)
 */
import { useFormat } from '../../../shr/units/useFormat';

import { useEffect, useState } from 'react';
import { Btn, Field, Grid2, Input, Modal, NumField } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { todayJ } from '../../flk/api/flocksCalc';
import { toFa, toEn } from '../../../shr/utils/fa';
import { getUnitLabel } from '../_typedLabels';
import type { Equipment, Hall, Zone } from '../store';
import SmartSelect from '../../../shr/components/SmartSelect';

interface Props {
  open: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  halls: Hall[];
  zones: Zone[];
  onConfirm: (eq: Equipment, toHallId: string, toZoneId: string, qty: number, date: string, note: string) => void;
}

export default function TransferEquipModal({ open, onClose, equipment, halls, zones, onConfirm }: Props) {
  const fmt = useFormat();
  const [toHallId, setToHallId] = useState('');
  const [toZoneId, setToZoneId] = useState('');
  const [qtyStr, setQtyStr] = useState('1');
  const [date, setDate] = useState(todayJ());
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open && equipment) {
      setToHallId(equipment.hallId || '');
      setToZoneId('');
      setQtyStr(String(equipment.count || 1));
      setDate(todayJ());
      setNote('');
    }
  }, [open, equipment]);

  const handleClose = () => {
    setToHallId('');
    setToZoneId('');
    setQtyStr('1');
    setDate(todayJ());
    setNote('');
    onClose();
  };

  if (!equipment) return null;

  const maxQty = Math.max(1, equipment.count || 1);
  const qtyNum = Math.floor(Number(toEn(qtyStr)) || 0);
  const fromHall = halls.find(h => h.id === equipment.hallId);
  const fromZone = zones.find(z => z.id === equipment.zoneId);
  const zonesForTarget = zones.filter(z => z.hallId === toHallId);
  const isSameHall = toHallId === (equipment.hallId || '');
  const isSameZone = (toZoneId || '') === (equipment.zoneId || '');
  const locationChanged = !!toHallId && (!isSameHall || !isSameZone);
  const validQty = qtyNum >= 1 && qtyNum <= maxQty;
  const canSave = locationChanged && validQty;

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
              onConfirm(equipment, toHallId, toZoneId, qtyNum, date, note);
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
        <Field label="مبدأ فعلی">
          <div style={{
            height: 38, display: 'flex', alignItems: 'center',
            padding: '0 12px', background: 'var(--bg)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            color: 'var(--muted)', fontWeight: 600, fontSize: 'var(--fs-sm)',
          }}>
            {fromHall?.name || '— بدون سالن —'}{fromZone ? ` • بخش ${fromZone.name}` : ''}
          </div>
        </Field>

        <Field label="به سالن" required>
          <SmartSelect
            value={toHallId}
            placeholder="— انتخاب —"
            modalTitle="انتخاب سالن مقصد"
            options={halls.filter((h) => !h.archived).map((h) => ({ value: String(h.id), label: String(h.name) }))}
            onChange={(val: string) => {
              setToHallId(val);
              setToZoneId('');
            }}
          />
        </Field>

        {toHallId && zonesForTarget.length > 0 && (
          <Field label={isSameHall ? 'به بخش (اجباری در همان سالن)' : 'به بخش (اختیاری)'} required={isSameHall}>
            <SmartSelect
              value={toZoneId}
              placeholder="— بدون بخش —"
              modalTitle="انتخاب بخش مقصد"
              options={zonesForTarget
                .filter((z) => !(isSameHall && z.id === equipment.zoneId))
                .map((z) => ({ value: String(z.id), label: String(z.name) }))}
              onChange={(val: string) => setToZoneId(val)}
            />
          </Field>
        )}

        <Grid2>
          {maxQty > 1 && (
            <Field label={`تعداد جابجایی (از ${fmt.count(maxQty)} ${getUnitLabel(equipment.unit)})`} required>
              <NumField
                value={qtyStr}
                onChange={e => setQtyStr(e.target.value)}
                min={1}
                max={maxQty}
              />
            </Field>
          )}
          <Field label="تاریخ جابجایی">
            <DatePicker value={date} onChange={setDate} placeholder="انتخاب تاریخ" autoToday />
          </Field>
        </Grid2>

        <Field label="یادداشت (اختیاری)">
          <Input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="علت انتقال"
          />
        </Field>
      </div>
    </Modal>
  );
}
