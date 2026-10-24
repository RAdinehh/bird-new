import { Modal, Btn } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { useFlk } from '../../flk/store';
import type { Flock } from '../../flk/store';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (flock: Flock) => void;
}

export default function PickFlockModal({ open, onClose, onSelect }: Props) {
  const { flocks } = useFlk();
  
  const archivedFlocks = (flocks || [])
    .filter(f => f.status === 'archived' || f.status === 'sold')
    .sort((a, b) => (b.archivedReason || '').localeCompare(a.archivedReason || ''));

  return (
    <Modal open={open} onClose={onClose} title="🔗 اتصال به گله آرشیو شده">
      {archivedFlocks.length === 0 ? (
        <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🐔</div>
          <div>هیچ گله آرشیو شده‌ای یافت نشد</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {archivedFlocks.map(f => (
            <button key={f.id} type="button" onClick={() => { onSelect(f); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '10px', background: 'var(--card-solid, #fff)',
                border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit',
              }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--text)' }}>
                  {f.name}
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                  {f.currentCount != null ? toFa(f.currentCount) + ' پرنده' : 'تعداد نامشخص'} • {f.archivedReason || 'بدون دلیل'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
