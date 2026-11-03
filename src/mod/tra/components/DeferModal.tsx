/**
 * DeferModal — تعویق سرسید فاکتور
 */
import { Btn, BtnRow, Field, Input, Modal } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';

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
  return (
      <Modal
        open={!!deferModal}
        center
        onClose={() => onClose()}
        title="⏰ تعویق سرسید"
        footer={
          <BtnRow>
            <Btn variant="primary" onClick={onConfirm}>تأیید</Btn>
            <Btn onClick={() => onClose()}>لغو</Btn>
          </BtnRow>
        }
      >
        {deferModal ? (
          <>
            <div style={{ marginBottom: 12, fontSize: 'var(--fs-sm)', color: 'var(--muted)', background: 'var(--input-bg)', padding: '8px 12px', borderRadius: 'var(--r-sm)' }}>
                    سرسید فعلی: <b>{deferModal.oldDate || '—'}</b>
                  </div>
                  <Field label="سرسید جدید" required>
              <DatePicker value={deferDate} onChange={v => setDeferDate(v)}  autoToday />
            </Field>
            <Field label="دلیل تعویق">
              <Input placeholder="..." value={deferReason} onChange={e => setDeferReason(e.target.value)} />
            </Field>
          </>
        ) : null}
      </Modal>
  );
}
