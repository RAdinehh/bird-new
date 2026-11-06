/**
 * MergedEditBlockModal — راهنمای ویرایش گله ادغام‌شده
 * طبق استاندارد SAP: «راهنمایی به جای مسدود کردن»
 */
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';

interface Props {
  open: boolean;
  onClose: () => void;
  onUnmerge: () => void;
  flockName: string;
}

export default function MergedEditBlockModal({ open, onClose, onUnmerge, flockName }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="⚠️ گله ادغام‌شده"
      size="sm"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={() => { onClose(); onUnmerge(); }}>♻️ بازگردانی گله</Btn>
          <Btn onClick={onClose}>انصراف</Btn>
        </BtnRow>
      }
    >
      <div style={{ padding: 'var(--pad-normal)', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 'var(--fs-sm)', lineHeight: 1.7 }}>
        <div>
          گله <b>«{flockName}»</b> از ادغام چند گله دیگر ساخته شده است و داده‌های آن با گله اصلی یکی شده است.
        </div>
        <div style={{ color: 'var(--muted)' }}>
          برای ویرایش، ابتدا باید گله‌هایی که در آن ادغام شده‌اند را از این گله جدا (بازگردانی) کنید.
        </div>
      </div>
    </Modal>
  );
}
