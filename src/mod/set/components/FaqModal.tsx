/**
 * FaqModal — مودال سؤالات متداول
 */
import { useState } from 'react';
import { Btn, Modal } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { FAQS } from '../data-about';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function FaqModal({ open, onClose }: Props) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const handleClose = () => { onClose(); setExpandedFaq(null); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="❓ سؤالات متداول"
      footer={<Btn variant="primary" full onClick={handleClose}>بستن</Btn>}
    >
      {/* ═══ مودال سوالات متداول ═══ */}
      <Modal
        open={open}
        onClose={handleClose}
        title="❓ سؤالات متداول"
        footer={<Btn variant="primary" full onClick={handleClose}>بستن</Btn>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {FAQS.map((f: any, i: number) => {
            const isOpen = expandedFaq === i;
            return (
              <div key={i} style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
              }}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedFaq(isOpen ? null : i)}
                  style={{
                    padding: 'var(--pad-comfy)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>{toFa(i + 1)}.</span>
                  <span style={{
                    flex: 1,
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}>{f.q}</span>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24"
                    fill="none"
                    stroke={isOpen ? 'var(--accent)' : 'var(--dim)'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform .25s',
                      flexShrink: 0,
                    }}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 250ms cubic-bezier(.16,1,.3,1)',
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      padding: '10px 14px 14px 40px',
                      fontSize: 'var(--fs-sm)',
                      color: 'var(--muted)',
                      lineHeight: 1.9,
                      borderTop: '1px dashed var(--border)',
                    }}>
                      {f.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </Modal>
  );
}
