/**
 * GuideModal — مودال راهنمای کاربری
 */
import { Btn, Modal } from '../../../shr/components/ui';
import { GUIDE_SECTIONS } from '../data-about';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GuideModal({ open, onClose }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📖 راهنمای کاربری"
      footer={<Btn variant="primary" full onClick={onClose}>بستن</Btn>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {GUIDE_SECTIONS.map((sec: any, i: number) => (
          <div key={i}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 0 8px',
              borderBottom: '1px dashed var(--border)',
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 'var(--fs-lg)' }}>{sec.icon}</span>
              <span style={{
                fontSize: 'var(--fs-md)',
                fontWeight: 700,
                color: 'var(--accent)',
              }}>{sec.title}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sec.items.map((it: string, j: number) => (
                <div key={j} style={{
                  display: 'flex', gap: 8,
                  fontSize: 'var(--fs-sm)',
                  color: 'var(--text)',
                  lineHeight: 1.8,
                  padding: '4px 0',
                }}>
                  <span style={{
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    flexShrink: 0,
                    marginTop: 8,
                  }} />
                  <span style={{ flex: 1 }}>{it}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{
          padding: 'var(--pad-comfy)',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-sm)',
          color: 'var(--accent)',
          lineHeight: 1.8,
          textAlign: 'center',
        }}>
          💡 نکته: از دکمه‌ی «؟» در هدر یا Ctrl + H هر زمان که خواستید، راهنما را ببینید.
        </div>
      </div>
    </Modal>
  );
}
