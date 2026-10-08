/**
 * ResetModal — مودال پاک کردن همه داده‌ها
 */
import { Btn, BtnRow, Modal } from '../../../shr/components/ui';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResetModal({ open, onClose, onConfirm }: Props) {
  return (
    <>
      <Modal
        open={open}
        onClose={() => onClose()}
        title="پاک کردن همه‌ی داده‌ها"
        footer={
          <BtnRow>
            <Btn variant="danger" onClick={onConfirm}>بله، پاک کن</Btn>
            <Btn onClick={() => onClose()}>لغو</Btn>
          </BtnRow>
        }
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          ⚠ تمام گله‌ها، سالن‌ها، معاملات، مخاطبین و تنظیمات پاک می‌شوند.
          <br />
          <span style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
            این عمل قابل بازگشت نیست.
          </span>
        </div>
      </Modal>
    </>
  );
}
