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
  onClose: () => void;
  onConfirm: () => void;
}

export default function TransferModal(props: TransferModalProps) {
  const { transferModal, transferNote, transferDate, setTransferNote, setTransferDate, onClose, onConfirm } = props;

  return (
    <Modal
      open={!!transferModal}
      center
      onClose={onClose}
      title={transferModal ? `تغییر به ${WORKFLOW_LABEL[transferModal.to]}` : ''}
      footer={<BtnRow><Btn variant="primary" onClick={onConfirm}>تأیید</Btn><Btn onClick={onClose}>لغو</Btn></BtnRow>}
    >
      {transferModal && (
        <>
          <Field label="تاریخ"><DatePicker value={transferDate} onChange={v => setTransferDate(v)} autoToday /></Field>
          {(transferModal.to === 'received' || transferModal.to === 'paid') && (
            <Field label="یادداشت">
              <Textarea placeholder="یادداشت..." value={transferNote} onChange={e => setTransferNote(e.target.value)} />
            </Field>
          )}
        </>
      )}
    </Modal>
  );
}
