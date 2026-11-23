/**
 * DisputeModal.tsx — ثبت اختلاف روی فاکتور
 */
import { useState, useEffect } from 'react';
import { Modal, Btn, BtnRow, Field, Textarea, AlertBox } from '../../../shr/components/ui';
import { useTra } from '../store';
import { toastMsg } from '../../../cor/store/toast';
import type { Invoice } from '../types';

type DisputeReason = 'price' | 'quantity' | 'quality' | 'other';

const REASON_LABEL: Record<DisputeReason, string> = {
  price: 'قیمت',
  quantity: 'تعداد',
  quality: 'کیفیت',
  other: 'سایر',
};

function getReasonPlaceholder(reason: DisputeReason, isPurchase: boolean): string {
  switch (reason) {
    case 'price':
      return isPurchase
        ? 'مغایرت قیمت توافقی با نرخ درج‌شده در فاکتور'
        : 'مغایرت قیمت توافقی و مبلغ فاکتور (مثلاً ۵ میلیون تومان اختلاف)';
    case 'quantity':
      return isPurchase
        ? 'کسری یا مغایرت تعداد تحویلی نسبت به فاکتور'
        : 'مغایرت تعداد ارسالی با تعداد ثبت‌شده در فاکتور';
    case 'quality':
      return 'توضیح مشکل کیفی (مثلاً تلفات، شکستگی یا ضعف گله)';
    case 'other':
      return 'شرح مختصر دلیل اختلاف روی این فاکتور...';
  }
}

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
  const [reason, setReason] = useState<DisputeReason>('price');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setReason('price');
      setNote('');
    }
  }, [open, invoice?.id]);

  if (!invoice) return null;

  const isPurchase = invoice.type === 'purchase';

  const handleSave = () => {
    markDispute(invoice.id, reason, note.trim());
    toastMsg.success('اختلاف ثبت شد — فاکتور از لیست طلبی خارج شد');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت اختلاف"
      size="md"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleSave}>ثبت اختلاف</Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      <Field label="دلیل اختلاف">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['price', 'quantity', 'quality', 'other'] as const).map(r => (
            <button key={r} type="button" onClick={() => setReason(r)} style={chipStyle(reason === r)}>
              {REASON_LABEL[r]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="یادداشت (اختیاری)">
        <Textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={getReasonPlaceholder(reason, isPurchase)}
          rows={3}
          maxHeight={120}
        />
      </Field>

      <AlertBox tone="warn" style={{ marginTop: -4 }}>
        {isPurchase
          ? 'با ثبت اختلاف، این فاکتور تا زمان رفع مشکل از فهرست بدهی‌ها و یادآوری سررسید خارج می‌شود.'
          : 'با ثبت اختلاف، این فاکتور تا زمان رفع مشکل از فهرست مطالبات و یادآوری سررسید خارج می‌شود.'}
      </AlertBox>
    </Modal>
  );
}
