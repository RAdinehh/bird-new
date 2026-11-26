/**
 * TransferModal — تغییر وضعیت workflow فاکتور
 */
import { Btn, BtnRow, Field, Modal, Textarea } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { WORKFLOW_LABEL, type WorkflowStatus } from '../store';

export interface TransferModalProps {
  transferModal: { id: string; to: WorkflowStatus } | null;
  transferNote: string;
  transferDate: string;
  setTransferNote: (v: string) => void;
  setTransferDate: (v: string) => void;
  dateError?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function TransferModal(props: TransferModalProps) {
  const { transferModal, transferNote, transferDate, setTransferNote, setTransferDate, dateError, onClose, onConfirm } = props;

  return (
    <Modal
      open={!!transferModal}
      onClose={onClose}
      title={transferModal ? `تغییر به ${WORKFLOW_LABEL[transferModal.to]}` : ''}
      footer={<BtnRow><Btn variant="primary" onClick={onConfirm}>تأیید</Btn><Btn onClick={onClose}>لغو</Btn></BtnRow>}
    >
      {transferModal && (
        <>
          <Field label="تاریخ" error={dateError}><DatePicker value={transferDate} onChange={v => setTransferDate(v)} autoToday /></Field>
          {(transferModal.to === 'received' || transferModal.to === 'paid') && (
            <Field label="یادداشت">
              <Textarea placeholder="توضیحات اختیاری" value={transferNote} onChange={e => setTransferNote(e.target.value)} />
            </Field>
          )}
        </>
      )}
    </Modal>
  );
}
