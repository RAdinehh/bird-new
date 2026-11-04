/**
 * DeferModal — تعویق سرسید (فاکتور/معامله)
 * استاندارد: Zod + useFormErrors (الگوی Reward Early, Punish Late)
 */
import { useState, useMemo } from 'react';
import { Btn, BtnRow, Field, Input, Modal } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { useValidation } from '../../../shr/validation/useValidation';
import { getDeferSchema } from '../../../shr/validation/rules/tra';
import { useFormErrors } from '../../../shr/hooks/useFormErrors';

interface Props {
  deferModal: any;
  onClose: () => void;
  deferDate: string;
  setDeferDate: (v: string) => void;
  deferReason: string;
  setDeferReason: (v: string) => void;
  onConfirm: () => void;
}

export default function DeferModal({ deferModal, onClose, deferDate, setDeferDate, deferReason, setDeferReason, onConfirm }: Props) {
  const schema = useMemo(() => getDeferSchema(deferModal?.oldDate || ''), [deferModal?.oldDate]);
  const { errors: vErrors } = useValidation(schema, { deferDate, deferReason });
  const { showError, markTouched, attemptSave } = useFormErrors(vErrors);

  const handleConfirm = () => {
    attemptSave();
    if (Object.keys(vErrors).length > 0) return;
    onConfirm();
  };

  return (
    <Modal
      open={!!deferModal}
      onClose={() => onClose()}
      title="⏰ تعویق سرسید"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleConfirm}>تأیید</Btn>
          <Btn onClick={() => onClose()}>لغو</Btn>
        </BtnRow>
      }
    >
      {deferModal ? (
        <>
          <div style={{ marginBottom: 12, fontSize: 'var(--fs-sm)', color: 'var(--muted)', background: 'var(--input-bg)', padding: '8px 12px', borderRadius: 'var(--r-sm)' }}>
            سرسید فعلی: <b>{deferModal.oldDate || '—'}</b>
          </div>
          
          <Field 
            label="سرسید جدید" 
            required 
            error={showError('deferDate')} 
            onTouch={() => markTouched('deferDate')}
          >
            <DatePicker 
              value={deferDate} 
              onChange={v => setDeferDate(v)} 
              min={deferModal.oldDate} 
              autoToday 
            />
          </Field>
          
          <Field 
            label="دلیل تعویق" 
            error={showError('deferReason')} 
            onTouch={() => markTouched('deferReason')}
          >
            <Input 
              placeholder="..." 
              value={deferReason} 
              onChange={e => setDeferReason(e.target.value)} 
            />
          </Field>
        </>
      ) : null}
    </Modal>
  );
}
