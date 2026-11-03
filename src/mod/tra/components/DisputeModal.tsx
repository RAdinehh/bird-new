/**
 * DisputeModal.tsx — ثبت اختلاف روی فاکتور
 */
import { useState, useEffect } from 'react';
import { Modal, Btn, BtnRow, Field, Input, Textarea } from '../../../shr/components/ui';
import { useTra } from '../store';
import { toastMsg } from '../../../cor/store/toast';
import type { Invoice } from '../types';

const REASON_LABEL: Record<'price' | 'quantity' | 'quality' | 'other', string> = {
  price: 'قیمت',
  quantity: 'تعداد',
  quality: 'کیفیت',
  other: 'سایر',
};

const chipStyle = (active: boolean) => ({
  padding: '6px 12px',
  fontSize: 'var(--fs-sm)',
  background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
  border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
  borderRadius: 'var(--r-sm)',
  color: active ? 'var(--accent)' : 'var(--muted)',
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
});

interface Props {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export default function DisputeModal({ open, onClose, invoice }: Props) {
  const markDispute = useTra(s => s.markDispute);
  const [reason, setReason] = useState<'price' | 'quantity' | 'quality' | 'other'>('price');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setReason('price');
      setNote('');
    }
  }, [open, invoice?.id]);

  if (!invoice) return null;

  const handleSave = () => {
    markDispute(invoice.id, reason, note.trim());
    toastMsg.success('اختلاف ثبت شد — فاکتور از لیست طلبی خارج شد');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="⚠️ ثبت اختلاف"
      size="md"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleSave}>ثبت اختلاف</Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      <div style={{ padding: 'var(--pad-normal)', background: 'var(--warn-soft)', borderRadius: 'var(--r-sm)', marginBottom: 'var(--sp-3)', fontSize: 'var(--fs-sm)', color: 'var(--warn)' }}>
        ⚠️ بعد از ثبت، این فاکتور از لیست طلبی خارج می‌شود تا مشکل حل شود.
      </div>

      <Field label="دلیل اختلاف">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['price', 'quantity', 'quality', 'other'] as const).map(r => (
            <button key={r} type="button" onClick={() => setReason(r)} style={chipStyle(reason === r)}>
              {REASON_LABEL[r]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="یادداشت (اختیاری)" hint="مثلاً مشتری می‌گه قیمت ۵ میلیون کمتره">
        <Textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxHeight={120} />
      </Field>
    </Modal>
  );
}
