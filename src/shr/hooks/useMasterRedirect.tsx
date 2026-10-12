/**
 * useMasterRedirect — هدایت کاربر به Master Data
 *
 * طبق قانون ۱۶ FOUNDATION: Master Data vs Operations
 * وقتی کاربر چیزی می‌خواد که توی Master نیست → پیام + دکمه
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Btn, BtnRow, Modal } from '../../shr/components/ui';
import { getMasterPath, getMasterMessage, type DataEntity } from '../../mod/brd/data-ownership';

interface RedirectState {
  entity: DataEntity;
  name: string;
}

export function useMasterRedirect() {
  const navigate = useNavigate();
  const [state, setState] = useState<RedirectState | null>(null);

  const redirect = useCallback((entity: DataEntity, name: string) => {
    setState({ entity, name });
  }, []);

  const dismiss = useCallback(() => setState(null), []);

  const Modal_ = () => {
    if (!state) return null;
    return (
      <Modal
        open={!!state}
        onClose={dismiss}
        title="پیدا نشد"
        footer={
          <BtnRow>
            <Btn
              variant="primary"
              onClick={() => {
                const path = getMasterPath(state.entity);
                dismiss();
                navigate(path);
              }}
            >
              رفتن به تنظیمات
            </Btn>
            <Btn onClick={dismiss}>بستن</Btn>
          </BtnRow>
        }
      >
        <div style={{ padding: 'var(--pad-normal)', lineHeight: 1.8, textAlign: 'center' }}>
          <div style={{ fontSize: '2em', marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>«{state.name}» توی لیست نیست</div>
          <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
            {getMasterMessage(state.entity)}
          </div>
        </div>
      </Modal>
    );
  };

  return { redirect, MasterRedirectModal: Modal_ };
}
